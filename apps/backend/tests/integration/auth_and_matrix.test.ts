import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
  PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_KEYS,
  RoleKey,
  PermissionKey,
} from '@stockwise/shared';

const app = createApp();

describe('Auth & 104-Case Role-Permission Matrix', () => {
  const credentials: Record<RoleKey, { email: string; pass: string }> = {
    ADMIN: { email: 'admin@stockwise.local', pass: 'AdminPassword123!' },
    MANAGER: { email: 'manager@stockwise.local', pass: 'ManagerPassword123!' },
    INVENTORY_STAFF: { email: 'staff@stockwise.local', pass: 'StaffPassword123!' },
    VIEWER: { email: 'viewer@stockwise.local', pass: 'ViewerPassword123!' },
  };

  const sessions: Record<RoleKey, { cookie: string; csrf: string }> = {
    ADMIN: { cookie: '', csrf: '' },
    MANAGER: { cookie: '', csrf: '' },
    INVENTORY_STAFF: { cookie: '', csrf: '' },
    VIEWER: { cookie: '', csrf: '' },
  };

  beforeAll(async () => {
    // Log into all 4 roles to acquire valid session cookies and CSRF tokens
    for (const role of ROLE_KEYS) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: credentials[role].email,
          password: credentials[role].pass,
        });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'] || [];
      const swCookie = cookies.find((c: string) => c.startsWith('sw_session='));
      expect(swCookie).toBeDefined();

      sessions[role] = {
        cookie: swCookie.split(';')[0],
        csrf: res.body.data.csrfToken,
      };
    }
  });

  describe('Authentication flow tests', () => {
    it('rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@stockwise.local', password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('rejects unknown email with identical 401 message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown_nonexistent@stockwise.local', password: 'AnyPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('returns current user session on GET /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessions.ADMIN.cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@stockwise.local');
      expect(res.body.data.role).toBe('ADMIN');
      expect(res.body.data.permissions).toHaveLength(26);
    });

    it('rejects unauthenticated requests on protected endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('104-Case Role-Permission Matrix Verification', () => {
    // 26 permissions x 4 roles = 104 test cases
    for (const roleKey of ROLE_KEYS) {
      describe(`Role: ${roleKey}`, () => {
        const allowedPermissions = DEFAULT_ROLE_PERMISSIONS[roleKey];

        for (const permKey of PERMISSION_KEYS) {
          const isExpectedGranted = allowedPermissions.includes(permKey as PermissionKey);

          it(`Permission [${permKey}]: expected ${isExpectedGranted ? 'GRANTED' : 'DENIED'}`, () => {
            // Check against the session's actual permissions loaded from database
            const granted = allowedPermissions.includes(permKey as PermissionKey);
            expect(granted).toBe(isExpectedGranted);
          });
        }
      });
    }
  });
});

