# StockWise — API Specification

Status: **Draft v0.1**. Base path `/api/v1`, JSON only. These are designed contracts, not an instruction to build every endpoint at once; each module is built in its phase. The machine-readable OpenAPI document is generated from the Zod schemas in phase 4 onward.

## 1. Conventions

| Topic | Rule |
| --- | --- |
| Auth | Session cookie `sw_session`; state-changing requests also send `X-CSRF-Token` and a matching `Origin` |
| Permissions | Listed per endpoint; "and" means all keys are required. Keys are defined in `permissions.md` |
| Success | `200` read/update, `201` create (with `Location`), `204` no body |
| Errors | `{ "error": { "code": "…", "message": "…", "details": […], "requestId": "…" } }` |
| Status codes | 400 malformed, 401 not authenticated, 403 forbidden, 404 not found, 409 conflict (duplicate, negative stock, stale version), 413 too large, 422 validation, 429 rate limited, 500 unexpected |
| Lists | `?page=1&pageSize=25` (max 100), `sort=field:asc|desc`, `q=` text search; response `{ "data": […], "meta": { "page", "pageSize", "total", "totalPages" } }` |
| Dates | ISO 8601 UTC; filters `from` and `to` |
| IDs | UUID |
| Money and quantity | Decimal strings in JSON (never floats), for example `"12.5000"` |
| Concurrency | Mutable resources return `version`; `PATCH` must send it; mismatch returns 409 `STALE_VERSION` |
| Idempotency | Stock writes accept `Idempotency-Key`; a repeat by the same user returns the original result |
| Cost fields | Omitted unless the caller holds `products:view_cost` |
| Request id | Every response has `X-Request-Id` |

## 2. Authentication and profile

| Method and path | Permission | Notes |
| --- | --- | --- |
| `POST /auth/login` | public | Body email, password. Sets session cookie, returns user, permissions, csrfToken. Rate limited; 401 with identical message for any failure; 423-style lock reported as 401 `ACCOUNT_LOCKED` without revealing whether the email exists beyond the lock window |
| `POST /auth/logout` | authenticated | Revokes the current session |
| `GET /auth/me` | authenticated | User, role, permission keys, `mustChangePassword`, csrfToken |
| `POST /auth/change-password` | authenticated | Needs current password; revokes other sessions |

## 3. Users, roles, permissions

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /users` | `users:read` | Filters: status, role, q |
| `POST /users` | `users:manage` | Creates user with temporary password shown once; `mustChangePassword = true` |
| `GET /users/:id` | `users:read` | |
| `PATCH /users/:id` | `users:manage` | Name, role. Guards P-3, P-4 |
| `POST /users/:id/deactivate`, `POST /users/:id/activate` | `users:manage` | Deactivation revokes sessions; last-Admin and self rules apply |
| `POST /users/:id/revoke-sessions` | `users:manage` | |
| `POST /users/:id/reset-password` | `users:manage` | New one-time temporary password |
| `GET /roles` | `users:read` | Roles with permission keys |
| `GET /permissions` | `users:read` | Registry |
| `PUT /roles/:id/permissions` | `roles:manage` | Body: list of keys; ADMIN immutable (P-1); audited |

## 4. Categories

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /categories` | `categories:read` | `?tree=true` returns hierarchy with product counts; filters status, parentId, q |
| `POST /categories` | `categories:manage` | 409 on duplicate slug or name under parent; 422 on circular parent |
| `GET /categories/:id` | `categories:read` | |
| `PATCH /categories/:id` | `categories:manage` | Rejects self-parent and cycles |
| `POST /categories/:id/archive`, `POST /categories/:id/restore` | `categories:manage` | Archive refused while active children or active products exist unless `moveProductsTo` is given |

## 5. Products and warehouses

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /products` | `products:read` | Filters: categoryId (optionally with descendants), status, brand, supplierId (via purchase history), stock state (`in`, `low`, `out`), published, q; sort by name, sku, price, stock; includes total on-hand |
| `POST /products` | `products:create` | 409 `DUPLICATE_SKU` / `DUPLICATE_BARCODE` |
| `GET /products/:id` | `products:read` | Includes balances per warehouse (needs `inventory:read`, else omitted) |
| `PATCH /products/:id` | `products:update` | Needs `version`; cost fields editable only with `products:view_cost` |
| `DELETE /products/:id` | `products:archive` | **Archives** (soft delete) and returns the archived product; never removes rows |
| `POST /products/:id/restore` | `products:archive` | |
| `POST /products/:id/image` | `products:update` | `multipart/form-data`; JPEG, PNG, WebP; 2 MB default limit; content sniffed and re-encoded |
| `GET /products/lookup?code=` | `products:read` | Exact SKU or barcode match, for quick entry |
| `GET /warehouses` | `inventory:read` | |
| `POST /warehouses`, `PATCH /warehouses/:id` | `settings:manage` | One default warehouse enforced |

## 6. Inventory

All write endpoints run through `stockService` (single transaction, row locks, no negative stock) and write an audit record.

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /inventory/balances` | `inventory:read` | Filters: productId, warehouseId, categoryId, state (`in`, `low`, `out`), q |
| `GET /inventory/movements` | `inventory:read` | Filters: productId, warehouseId, userId, type, reasonCode, from, to; shows actor and reason |
| `GET /inventory/movements/:id` | `inventory:read` | |
| `POST /inventory/receipts` | `inventory:receive` | Body: productId, warehouseId, quantity, unitCost (optional; used only with `products:view_cost`), reasonCode (DIRECT_PURCHASE, CUSTOMER_RETURN, OTHER), reason, notes |
| `POST /inventory/issues` | `inventory:issue` | Body: productId, warehouseId, quantity, reasonCode (USAGE, SUPPLIER_RETURN, DAMAGED, OTHER), reason. 409 `INSUFFICIENT_STOCK` |
| `POST /inventory/adjustments` | `inventory:adjust` | Body: productId, warehouseId, either `newQuantity` or `delta`, reason (min 3 chars, required) |
| `POST /inventory/transfers` | `inventory:transfer` | Body: productId, fromWarehouseId, toWarehouseId, quantity, notes. Creates TRANSFER_OUT and TRANSFER_IN with the same `transferGroupId` |
| `POST /inventory/movements/:id/reversals` | `inventory:adjust` (and `purchases:receive` if the movement belongs to a goods receipt) | Body: reason. Creates a linked REVERSAL; 409 if already reversed or stock would go negative |

## 7. Suppliers and purchasing

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /suppliers` | `suppliers:read` | Filters: status, q |
| `POST /suppliers` | `suppliers:manage` | |
| `GET /suppliers/:id` | `suppliers:read` | |
| `PATCH /suppliers/:id` | `suppliers:manage` | |
| `POST /suppliers/:id/deactivate`, `POST /suppliers/:id/activate` | `suppliers:manage` | Blocked for new POs when inactive |
| `GET /suppliers/:id/purchase-orders` | `suppliers:read` and `purchases:read` | Purchase history |
| `GET /purchase-orders` | `purchases:read` | Filters: status, supplierId, warehouseId, from, to, q (PO number) |
| `POST /purchase-orders` | `purchases:manage` | Creates DRAFT with lines (productId, quantity, unitCost) |
| `GET /purchase-orders/:id` | `purchases:read` | Includes lines and receipts; amounts only with `products:view_cost` |
| `PATCH /purchase-orders/:id` | `purchases:manage` | DRAFT only; needs `version` |
| `POST /purchase-orders/:id/submit` | `purchases:manage` | DRAFT to ORDERED; must have at least one line |
| `POST /purchase-orders/:id/cancel` | `purchases:cancel` | Body: reason. Allowed from DRAFT, ORDERED, PARTIALLY_RECEIVED; stock untouched |
| `POST /purchase-orders/:id/receipts` | `purchases:receive` | Body: warehouseId (defaults to PO destination), deliveryNoteRef, lines [{ purchaseOrderItemId, quantity, unitCost? }]. Allowed for ORDERED and PARTIALLY_RECEIVED. Creates goods receipt, movements, updates quantities and PO status. 422 if over-receipt beyond tolerance; 409 on illegal state |
| `GET /purchase-orders/:id/receipts` | `purchases:read` | |

Status transitions (server-validated): DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED; DRAFT, ORDERED, PARTIALLY_RECEIVED → CANCELLED. Any other jump returns 409 `INVALID_STATE_TRANSITION`.

## 8. Reports, dashboard, audit, settings, system

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /reports/summary` | `reports:read` | Dashboard figures, recent movements and purchases, charts data; valuation figure only with `reports:valuation` |
| `GET /reports/inventory-valuation` | `reports:valuation` | Group by category or warehouse; weighted average cost |
| `GET /reports/low-stock` | `reports:read` | On hand at or below reorder level |
| `GET /reports/out-of-stock` | `reports:read` | |
| `GET /reports/stock-movements` | `reports:read` | Same filters as movements |
| `GET /reports/purchase-history` | `reports:read` and `purchases:read` | Amounts only with `products:view_cost` |
| `GET /reports/<name>?format=csv` | `reports:export` and the report's own permission | Streams CSV; cells starting with `=`, `+`, `-`, `@` are prefixed; export is audited |
| `GET /audit-logs` | `audit_logs:read` | Filters: actorId, action, entityType, entityId, from, to |
| `GET /audit-logs/:id` | `audit_logs:read` | |
| `GET /settings` | authenticated | Non-sensitive subset (currency, thresholds) |
| `PATCH /settings` | `settings:manage` | Allow-listed keys only; audited |
| `GET /health` | public | Liveness; no version details |
| `GET /ready` | public (network-restricted in production) | Database check |
| `GET /docs`, `GET /openapi.json` | non-production, or `settings:manage` | API documentation |

## 9. Public catalog API (separate router, no session)

| Method and path | Notes |
| --- | --- |
| `GET /public/categories` | Active categories that contain published products; tree with counts of published products |
| `GET /public/products` | Filters: category slug (with descendants), q, brand, price range (only if prices enabled), sort (name, newest, price), pagination (max 48) |
| `GET /public/products/:slug` | Detail; 404 for unpublished or archived |
| `GET /public/brands` | Brands of published products (filter facets) |
| Image route | Public images only for published products |

Public response fields (allow-list): `slug`, `name`, `description`, `brand`, `imageUrl`, `category` (name, slug, breadcrumb), `sku` (optional, setting), `price` and `currency` (only if enabled), `availability` label (only if enabled). Never present: cost data, supplier data, quantities, warehouses, internal ids, audit data, version. Rate limited per IP and cacheable for a short time.

## 10. Error codes (initial list)

`VALIDATION_FAILED`, `UNAUTHENTICATED`, `ACCOUNT_LOCKED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_SKU`, `DUPLICATE_BARCODE`, `DUPLICATE_SLUG`, `STALE_VERSION`, `INSUFFICIENT_STOCK`, `INVALID_STATE_TRANSITION`, `OVER_RECEIPT`, `CIRCULAR_CATEGORY`, `LAST_ADMIN`, `ALREADY_REVERSED`, `FILE_TYPE_NOT_ALLOWED`, `FILE_TOO_LARGE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## 11. Rate limits (initial values, tuned in phase 11)

| Scope | Limit |
| --- | --- |
| Login | 5 per minute per IP and 5 per minute per email |
| Authenticated API | 300 per minute per user |
| CSV export and uploads | 10 per minute per user |
| Public API | 120 per minute per IP |
