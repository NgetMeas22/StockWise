import { RecordStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError, ValidationError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export interface CategoryTreeItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageKey: string | null;
  sortOrder: number;
  status: RecordStatus;
  productCount: number;
  children: CategoryTreeItem[];
  createdAt: string;
  updatedAt: string;
}

export class CategoriesService {
  public async listCategories(params: {
    tree?: boolean;
    status?: RecordStatus;
    parentId?: string | null;
    q?: string;
  }) {
    const { tree, status, parentId, q } = params;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (parentId !== undefined) {
      where.parentId = parentId;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageKey: c.imageKey,
      sortOrder: c.sortOrder,
      status: c.status,
      productCount: c._count.products,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    if (!tree) {
      return formatted;
    }

    // Build hierarchy tree
    const map = new Map<string, CategoryTreeItem>();
    const roots: CategoryTreeItem[] = [];

    for (const item of formatted) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of formatted) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  public async getCategoryById(id: string) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, status: true } },
        _count: { select: { products: true } },
      },
    });

    if (!cat) {
      throw new NotFoundError('Category not found');
    }

    return {
      id: cat.id,
      parentId: cat.parentId,
      parent: cat.parent,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageKey: cat.imageKey,
      sortOrder: cat.sortOrder,
      status: cat.status,
      productCount: cat._count.products,
      children: cat.children,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    };
  }

  public async createCategory(
    input: {
      name: string;
      slug: string;
      parentId?: string | null;
      description?: string | null;
      sortOrder?: number;
      status?: RecordStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const slug = input.slug.toLowerCase().trim();

    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictError(`Category with slug '${slug}' already exists`, 'DUPLICATE_SLUG');
    }

    // Unique name per parent
    const existingName = await prisma.category.findFirst({
      where: {
        parentId: input.parentId || null,
        name: { equals: input.name.trim(), mode: 'insensitive' },
      },
    });
    if (existingName) {
      throw new ConflictError(`A category named '${input.name}' already exists in this parent`);
    }

    if (input.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug,
        parentId: input.parentId || null,
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder || 0,
        status: input.status || RecordStatus.ACTIVE,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      after: category,
      ip,
      userAgent,
      requestId,
    });

    return category;
  }

  public async updateCategory(
    id: string,
    input: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      description?: string | null;
      sortOrder?: number;
      status?: RecordStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      // CHECK parent_id <> id
      if (input.parentId === id) {
        throw new ValidationError('A category cannot be its own parent');
      }

      // Check circular reference by walking ancestor tree
      let currentParentId: string | null = input.parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          throw new ConflictError('Circular hierarchy detected: cannot set descendant as parent', 'CIRCULAR_CATEGORY');
        }
        const p: { parentId: string | null } | null = await prisma.category.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        currentParentId = p?.parentId || null;
      }
    }

    if (input.slug && input.slug !== existing.slug) {
      const duplicate = await prisma.category.findUnique({ where: { slug: input.slug } });
      if (duplicate) {
        throw new ConflictError(`Slug '${input.slug}' is already in use`, 'DUPLICATE_SLUG');
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        slug: input.slug !== undefined ? input.slug.toLowerCase().trim() : undefined,
        parentId: input.parentId !== undefined ? input.parentId : undefined,
        description: input.description !== undefined ? input.description?.trim() || null : undefined,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
        status: input.status !== undefined ? input.status : undefined,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: id,
      before: existing,
      after: updated,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async archiveCategory(
    id: string,
    moveProductsTo?: string,
    actorUserId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { where: { status: RecordStatus.ACTIVE } },
        products: { where: { status: RecordStatus.ACTIVE } },
      },
    });

    if (!cat) throw new NotFoundError('Category not found');

    if (cat.children.length > 0) {
      throw new ConflictError(
        `Cannot archive category: it contains ${cat.children.length} active child categories. Please archive or reassign them first.`
      );
    }

    if (cat.products.length > 0 && !moveProductsTo) {
      throw new ConflictError(
        `Cannot archive category: it contains ${cat.products.length} active products. Provide 'moveProductsTo' to reassign them.`
      );
    }

    await prisma.$transaction(async (tx) => {
      if (moveProductsTo && cat.products.length > 0) {
        const dest = await tx.category.findUnique({ where: { id: moveProductsTo } });
        if (!dest) throw new NotFoundError('Destination category for products not found');

        await tx.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: moveProductsTo },
        });
      }

      await tx.category.update({
        where: { id },
        data: { status: RecordStatus.ARCHIVED },
      });
    });

    await writeAuditLog({
      actorUserId,
      action: 'CATEGORY_ARCHIVED',
      entityType: 'CATEGORY',
      entityId: id,
      after: { movedProductsTo: moveProductsTo || null },
      ip,
      userAgent,
      requestId,
    });
  }

  public async restoreCategory(
    id: string,
    actorUserId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    await prisma.category.update({
      where: { id },
      data: { status: RecordStatus.ACTIVE },
    });

    await writeAuditLog({
      actorUserId,
      action: 'CATEGORY_RESTORED',
      entityType: 'CATEGORY',
      entityId: id,
      ip,
      userAgent,
      requestId,
    });
  }
}

export const categoriesService = new CategoriesService();
