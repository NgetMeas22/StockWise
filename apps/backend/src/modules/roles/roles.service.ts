import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';
import { PERMISSION_REGISTRY, PermissionKey } from '@stockwise/shared';

export class RolesService {
  public async listRoles() {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { key: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp) => rp.permission.key as PermissionKey),
    }));
  }

  public async listPermissions() {
    return Object.values(PERMISSION_REGISTRY);
  }

  public async updateRolePermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // P-1: The ADMIN role always holds every permission; its permission set cannot be edited
    if (role.key === 'ADMIN') {
      throw new ConflictError('The ADMIN role permissions are immutable (P-1)');
    }

    // P-3: The API additionally rejects users:manage or roles:manage being granted to any non-ADMIN role
    const prohibitedKeys = ['users:manage', 'roles:manage'];
    for (const key of prohibitedKeys) {
      if (permissionKeys.includes(key as PermissionKey)) {
        throw new ConflictError(
          `Cannot grant administrative permission '${key}' to non-ADMIN role (P-3)`
        );
      }
    }

    const beforeKeys = role.rolePermissions.map((rp) => rp.permission.key);

    await prisma.$transaction(async (tx) => {
      // Remove all existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Insert new permissions
      for (const key of permissionKeys) {
        const perm = await tx.permission.findUnique({ where: { key } });
        if (perm) {
          await tx.rolePermission.create({
            data: {
              roleId,
              permissionId: perm.id,
            },
          });
        }
      }
    });

    await writeAuditLog({
      actorUserId,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'ROLE',
      entityId: role.id,
      before: { permissions: beforeKeys },
      after: { permissions: permissionKeys },
      ip,
      userAgent,
      requestId,
    });
  }
}

export const rolesService = new RolesService();
