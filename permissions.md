# StockWise — Roles and Permissions

Status: **Draft v0.1**. The permission keys below are the single source of truth. They are defined once in `packages/shared/src/permissions.ts`, seeded into the database, and used by the API (enforcement), the web app (menu visibility and button state) and the tests.

## 1. Principles

1. Deny by default. A route without a declared permission fails the API start-up check.
2. The API is the only authority. Hiding a button or menu item is a convenience.
3. 401 = not authenticated. 403 = authenticated but not allowed. 404 may be used instead of 403 only for public catalog lookups.
4. Permissions come from the user's role, loaded from the database per request (cached for a short time, invalidated when role permissions change).
5. Never trust a role, user id, price, quantity or permission sent by the client.
6. Authorization is centralised: one `requirePermission(...keys)` middleware (all listed keys required) and one `can(user, key)` helper for service-level checks. No inline `role === 'ADMIN'` checks anywhere.

## 2. Permission registry (26 keys)

| Group | Key | Meaning |
| --- | --- | --- |
| Products | `products:read` | View products and details |
| | `products:create` | Create products |
| | `products:update` | Edit products and upload images |
| | `products:archive` | Archive and restore products |
| | `products:view_cost` | See cost price, average cost, unit costs and monetary totals derived from cost |
| Categories | `categories:read` | View categories |
| | `categories:manage` | Create, edit, archive categories |
| Inventory | `inventory:read` | View balances, movements, warehouses |
| | `inventory:receive` | Direct stock receipts |
| | `inventory:issue` | Stock issues |
| | `inventory:adjust` | Adjustments and reversals (reason required) |
| | `inventory:transfer` | Transfers between warehouses |
| Suppliers | `suppliers:read` | View suppliers |
| | `suppliers:manage` | Create, edit, deactivate suppliers |
| Purchases | `purchases:read` | View purchase orders and receipts |
| | `purchases:manage` | Create, edit, submit purchase orders |
| | `purchases:receive` | Record goods receipts |
| | `purchases:cancel` | Cancel purchase orders |
| Reports | `reports:read` | Dashboard summary and operational reports |
| | `reports:export` | CSV export (in addition to the report's read permission) |
| | `reports:valuation` | Inventory valuation report and valuation figures |
| Administration | `users:read` | View users, roles and the permission matrix |
| | `users:manage` | Create, edit, deactivate users; assign roles; revoke sessions; reset passwords |
| | `roles:manage` | Change the permission set of non-Admin roles |
| | `audit_logs:read` | View audit logs |
| | `settings:manage` | Change settings and manage warehouses |

Profile and password change for oneself need only authentication, not a permission.

## 3. Default role matrix

`Y` = granted. Blank = not granted. Counts: ADMIN 26, MANAGER 21, INVENTORY_STAFF 9, VIEWER 4.

| Permission | ADMIN | MANAGER | INVENTORY_STAFF | VIEWER |
| --- | :-: | :-: | :-: | :-: |
| `products:read` | Y | Y | Y | Y |
| `products:create` | Y | Y | | |
| `products:update` | Y | Y | | |
| `products:archive` | Y | Y | | |
| `products:view_cost` | Y | Y | | |
| `categories:read` | Y | Y | Y | Y |
| `categories:manage` | Y | Y | | |
| `inventory:read` | Y | Y | Y | Y |
| `inventory:receive` | Y | Y | Y | |
| `inventory:issue` | Y | Y | Y | |
| `inventory:adjust` | Y | Y | | |
| `inventory:transfer` | Y | Y | Y | |
| `suppliers:read` | Y | Y | | |
| `suppliers:manage` | Y | Y | | |
| `purchases:read` | Y | Y | Y | |
| `purchases:manage` | Y | Y | | |
| `purchases:receive` | Y | Y | Y | |
| `purchases:cancel` | Y | Y | | |
| `reports:read` | Y | Y | Y | Y |
| `reports:export` | Y | Y | | |
| `reports:valuation` | Y | Y | | |
| `users:read` | Y | | | |
| `users:manage` | Y | | | |
| `roles:manage` | Y | | | |
| `audit_logs:read` | Y | | | |
| `settings:manage` | Y | | | |

## 4. Rules that go beyond the matrix

| ID | Rule |
| --- | --- |
| P-1 | The ADMIN role always holds every permission; its permission set cannot be edited. |
| P-2 | `roles:manage` can only change MANAGER, INVENTORY_STAFF and VIEWER permission sets, only with keys from the registry, and every change is audited. Sessions pick up the change within the cache lifetime (60 s) or immediately after explicit invalidation. |
| P-3 | Only ADMIN holds `users:manage`, so only ADMIN can create or promote an ADMIN. The API additionally rejects `users:manage` or `roles:manage` being granted to any non-ADMIN role. |
| P-4 | The last active ADMIN cannot be deactivated or demoted. A user cannot deactivate or change the role of their own account. |
| P-5 | Cost fields (`cost_price`, `average_cost`, `unit_cost`, valuation, line and order totals) are removed from every response unless the caller holds `products:view_cost` (valuation endpoints need `reports:valuation`). |
| P-6 | CSV export requires both `reports:export` and the read permission of the underlying report. |
| P-7 | A purchase order can be edited only in DRAFT. Submit needs `purchases:manage`; receiving needs `purchases:receive`; cancelling needs `purchases:cancel`. |
| P-8 | Reversing a receipt that belongs to a goods receipt also needs `purchases:receive`. |
| P-9 | The public catalog needs no permission but uses a separate router and allow-listed output (see `api-specification.md` section 9). |
| P-10 | A deactivated user's sessions are revoked immediately and login is refused. |

## 5. UI visibility

The web app loads the caller's permission list from `GET /api/v1/auth/me` and hides or disables controls through one `<Can permission="…">` component and one `usePermission()` hook. Navigation:

| Item | Shown when user holds |
| --- | --- |
| Dashboard | `reports:read` |
| Products | `products:read` |
| Categories | `categories:read` |
| Inventory | `inventory:read` |
| Suppliers | `suppliers:read` |
| Purchases | `purchases:read` |
| Reports | `reports:read` |
| Users and Roles | `users:read` |
| Audit Logs | `audit_logs:read` |
| Settings | `settings:manage` |

Route-level protection (Next.js middleware) checks that a session cookie exists and redirects to login; the page then reads permissions and shows a "no access" state when needed. The API still decides.

## 6. Test plan

| Test | What it proves |
| --- | --- |
| Matrix test | For each of 26 permissions and 4 roles (104 cases) a guarded probe route returns 2xx when granted and 403 when not |
| Unauthenticated test | Every non-public route returns 401 without a session |
| Route registry test | Every registered route has a permission or is on the explicit public allow-list |
| Escalation tests | Manager cannot create users or grant roles; Admin-only operations return 403 for others; last Admin protection; self-demotion blocked |
| Field-level tests | Staff and Viewer never receive cost fields on products, movements, purchase orders, reports |
| Role-edit tests | P-1, P-2, P-3 enforced; changes audited; cache invalidation works |
| Session tests | Deactivation and password change revoke sessions |
