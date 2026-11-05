# StockWise — Requirements

Status: **Draft v0.1 (Phase 1 output, for approval at the Phase 2 gate)**
Date: 2026-11-02
Sources merged: (1) the 12-phase master specification, (2) the earlier StockWise plan (PDF, 28 pages).
Where the two disagree, the decision is recorded in section 8 (Decisions).

---

## 1. Purpose and scope

A secure, maintainable inventory management system for one business: products and categories, stock tracked per warehouse through an immutable movement ledger, suppliers, purchase orders with partial goods receiving, reports, audit logs, and a future public product catalog.

**In scope (initial release):** authentication, RBAC, user management, dashboard, products, categories, warehouses, inventory (receive, issue, adjust, transfer, reverse), suppliers, purchase orders and goods receipts, reports with CSV export, audit logs, public read-only catalog.

**Out of scope (prepared for, not built):** checkout, payments, customer orders, e-commerce cart, batch/lot/expiry tracking, multi-currency, barcode-scanner hardware integration, SSO, self-service password recovery by email, two-factor authentication (recommended right after launch, see D-12).

## 2. Reference research (Phase 1)

References were studied in the specified order. Results are reported exactly as accessed.

| # | Reference | Access result |
| --- | --- | --- |
| 1 | nxtbook digital catalog, page 1 (`…/index.php#/p/1`) | **Blocked** by bot detection. Not inspected. |
| 2 | Henry Schein Browse Supplies (`…/c/browsesupplies`) | **Accessible as page text and markup only.** No rendered visuals, CSS, images or prices were visible, so colour, typography, spacing and imagery were **not observed**. |
| 3 | nxtbook catalog index (`…/index.php`) | **Blocked** by bot detection. Not inspected. |

**Observed on Reference 2 (structure only):**

- 30 flat top-level categories (for example Anesthetics, Gloves, Infection Control Products, Instruments, Preventive, Small Equipment, X-Ray and Digital Imaging).
- A manufacturer index of 1,690 entries with an A–Z and "#" jump bar.
- Breadcrumb: Supplies & Small Equipment / Browse Supplies / Browse Supplies Results.
- A filters panel and a "Result Found In" control; results shown as a list.
- A product-compare feature limited to five products, with a result line template of Title, Item Code, Manufacturer and Manufacturer Code.
- Ordering tools: Shopping Lists, Speed Entry, Order from History; a "Top Categories" shortcut set of five; a "Featured Suppliers" block; catalog request and flyer links.

**Not observed (gaps):** how a printed/flipbook catalog page is composed; product images; SKU and price presentation in rows; product detail layout; visual style. These gaps are handled by using generic, well-established supplier-catalog conventions (documented in `ui-design-system.md`) and by flagging them as assumptions. Optional: supply screenshots or a PDF of a few catalog pages and the design can be refined without changing the architecture.

**Ideas adopted (inspiration only, no copying of branding, text, assets or layouts):** category-first browsing, A–Z supplier jump bar, breadcrumb on every catalog page, left filter panel, item line "name · SKU · supplier · supplier part number", compare up to five items (post-MVP), quick entry by SKU, reorder lists from history (post-MVP).

## 3. Workspace inspection (Phase 1)

The sandbox used for this phase contains only the earlier plan PDF. **No access to the existing Antigravity workspace or repository was available**, so no existing code, framework versions, dependencies, conventions or reusable components have been verified. Nothing is assumed to exist. `implementation-plan.md` section 3 defines the exact inspection the agent must run inside the real repository before Phase 3, and no existing file may be overwritten without a diff review.

## 4. Assumptions (to confirm, safe defaults used meanwhile)

| ID | Assumption | Default |
| --- | --- | --- |
| A-1 | One company, one currency | Currency code kept in settings (default `USD`); no multi-currency |
| A-2 | Warehouses | 1 to 5 locations; one marked default |
| A-3 | Users | About 20 internal users; public catalog is anonymous |
| A-4 | Data volume | Up to 20,000 products and a few hundred thousand movements |
| A-5 | Time | Stored in UTC; displayed in the browser time zone |
| A-6 | Hosting | One server or managed platform with Docker Compose |
| A-7 | Language | English UI; text kept in one place for later translation |
| A-8 | Public catalog prices | Selling price visible only if the product is published and a setting enables prices |

## 5. Functional requirements

Priority: **M** = MVP, **L** = later. Phase numbers refer to `implementation-plan.md`.

### 5.1 Authentication and users (phase 4)

| ID | Requirement | Pri |
| --- | --- | --- |
| AUTH-1 | Login and logout with server-managed sessions in HttpOnly cookies | M |
| AUTH-2 | Idle timeout 30 minutes, absolute timeout 12 hours, revocation on logout, password change, deactivation | M |
| AUTH-3 | Argon2id password hashing, 12-character minimum, common-password check | M |
| AUTH-4 | Lock account 15 minutes after 5 failed attempts; rate limit login by IP and by email | M |
| AUTH-5 | User profile and password change | M |
| AUTH-6 | Admin creates users, assigns role, deactivates/activates, revokes sessions, issues one-time temporary password (forced change at first login) | M |
| AUTH-7 | Self-service recovery by email, TOTP two-factor | L |

### 5.2 Dashboard (phase 9)

| ID | Requirement | Pri |
| --- | --- | --- |
| DSH-1 | Cards: active products, total stock quantity, inventory valuation (cost permission only), low-stock count, out-of-stock count | M |
| DSH-2 | Recent movements (last 10), recent purchase activity (last 10), low-stock list | M |
| DSH-3 | Stock by category chart, movements per day chart, date range filter | M |
| DSH-4 | Loading, empty and error states; every number computed by the API from real data | M |

### 5.3 Products and categories (phase 6)

| ID | Requirement | Pri |
| --- | --- | --- |
| PRD-1 | Create, read, update, search, filter, sort, paginate, archive and restore products | M |
| PRD-2 | Fields: SKU, optional barcode, name, slug, description, brand, image, unit of measure, cost price, selling price, category, reorder level, status, published flag | M |
| PRD-3 | Unique SKU and unique normalised barcode; clear 409 messages | M |
| PRD-4 | Image upload with content check, size limit, re-encoding, safe file name | M |
| PRD-5 | Optimistic locking on edit (version field) to stop silent overwrites | M |
| CAT-1 | Parent-child categories, slug, description, image, status, product counts | M |
| CAT-2 | Reject self-parent and circular hierarchies; archive instead of delete | M |
| PRD-6 | Multiple categories per product, product compare | L |

### 5.4 Inventory (phase 7)

| ID | Requirement | Pri |
| --- | --- | --- |
| INV-1 | Receive stock (direct, not tied to a purchase order) with reason code | M |
| INV-2 | Issue stock with reason code; reject if it would go below zero | M |
| INV-3 | Adjust stock (positive or negative) with mandatory written reason | M |
| INV-4 | Transfer between warehouses as two linked movements in one transaction | M |
| INV-5 | Reverse a movement with a new linked movement and mandatory reason; originals are never edited | M |
| INV-6 | Current balances per product and warehouse; low-stock and out-of-stock views | M |
| INV-7 | Movement history filtered by product, warehouse, user, type, date; shows actor and reason | M |
| INV-8 | Idempotency key on write requests to prevent double submission | M |
| INV-9 | Approval workflow for adjustments, batch/lot, expiry | L |

### 5.5 Suppliers and purchasing (phase 8)

| ID | Requirement | Pri |
| --- | --- | --- |
| SUP-1 | Supplier name, contact person, email, telephone, address, notes, active/inactive; purchase history | M |
| PUR-1 | Draft purchase orders: supplier, destination warehouse, lines with quantity and agreed unit cost | M |
| PUR-2 | Statuses: DRAFT, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED; transitions validated on the server | M |
| PUR-3 | Goods receipts against an ordered PO, partial receiving allowed, stock increases only for quantities actually received | M |
| PUR-4 | Over-receipt rejected unless the tolerance setting allows it (default 0 %) | M |
| PUR-5 | Cancellation needs its own permission; cancelling after partial receipt cancels only the unreceived remainder; history kept | M |
| PUR-6 | Print-friendly PO view (browser print to PDF) | M |

### 5.6 Reports (phase 9)

| ID | Requirement | Pri |
| --- | --- | --- |
| RPT-1 | Inventory valuation (weighted average cost), by category and warehouse | M |
| RPT-2 | Low-stock, out-of-stock, stock movements, purchase history reports with date and category filters | M |
| RPT-3 | CSV export with its own permission, formula-injection escaping, and the same filters as the screen | M |

### 5.7 Audit (phase 4 onward)

| ID | Requirement | Pri |
| --- | --- | --- |
| AUD-1 | Log authentication events, user and role changes, product and category changes, every stock operation, exports, settings changes | M |
| AUD-2 | Record actor, action, entity, before/after (secrets redacted), IP, user agent, request id, time | M |
| AUD-3 | Audit log is append-only at database level; only `audit_logs:read` holders can view | M |

### 5.8 Public catalog (phase 10)

| ID | Requirement | Pri |
| --- | --- | --- |
| PUB-1 | Home, browse by category, product list, product detail, search, sort, filters, pagination | M |
| PUB-2 | Only products with `is_published = true` and status ACTIVE appear | M |
| PUB-3 | Never expose supplier data, costs, audit data, quantities or warehouse data. Availability (in/out of stock label) is off by default | M |
| PUB-4 | SEO metadata, Open Graph tags, clean slugs, sitemap | M |
| PUB-5 | Checkout, payments, customer accounts, orders | L |

## 6. Business rules

| ID | Rule |
| --- | --- |
| BR-1 | Stock quantity changes only by inserting a stock movement; balances are updated in the same transaction. |
| BR-2 | Negative stock is not allowed. A database CHECK enforces it in addition to the service check. |
| BR-3 | Stock movements and audit logs are never updated or deleted (database triggers reject it). |
| BR-4 | A purchase order never changes stock. Only a goods receipt (or a direct receipt) does. |
| BR-5 | Products, categories, suppliers, warehouses and users are archived or deactivated, never deleted, once referenced. |
| BR-6 | SKU is trimmed and upper-cased; barcode is trimmed; both are unique after normalisation. |
| BR-7 | Adjustments, reversals and cancellations require a reason of at least 3 characters. |
| BR-8 | Quantities use `NUMERIC(14,3)`; units that cannot be fractional (EACH, BOX, PACK) accept integers only. |
| BR-9 | Money uses `NUMERIC`, never floating point. Costs 4 decimals, prices 2 decimals. |
| BR-10 | Cost data is returned only to holders of `products:view_cost`. |
| BR-11 | Valuation method and correction rules are in `database-design.md` section 6 and must not change without a decision record. |

## 7. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Security | Server-side authorization on every protected route; OWASP Top 10 review at phase 11; no secrets in the repo |
| Performance targets | List endpoints p95 under 300 ms and search under 200 ms with 20,000 products on development hardware. These are targets to be measured in phase 11, not current results |
| Accessibility | Aim for WCAG 2.2 AA: keyboard operation, visible focus, labelled controls, text status never colour alone |
| Responsive | Desktop, tablet, phone; tables degrade to cards or horizontal scroll on narrow screens |
| Reliability | Nightly backup, restore tested before launch. Proposed RPO 24 h, RTO 4 h (confirm) |
| Maintainability | TypeScript strict, feature modules, lint and type checks in CI, migrations from an empty database |
| Observability | Structured JSON logs with request id; health and readiness endpoints |

## 8. Decisions (merging the two sources)

| ID | Decision | Reason |
| --- | --- | --- |
| D-1 | Package manager: **pnpm** workspaces | Master spec requires it; earlier plan said npm |
| D-2 | Auth: **opaque server-side sessions** in HttpOnly cookies, not JWT access/refresh | Master spec prefers server-managed sessions; instant revocation; simpler to reason about |
| D-3 | RBAC: normalised tables (roles, permissions, user_roles, role_permissions) with 26 permission keys; permission registry lives in code, default matrix seeded | Master spec entity list; central, testable |
| D-4 | Roles: ADMIN, MANAGER, INVENTORY_STAFF, VIEWER | Master spec names |
| D-5 | One role per user in MVP (primary key on `user_roles.user_id`) | Simpler escalation analysis |
| D-6 | Adjustments are applied directly by `inventory:adjust` holders (Manager, Admin) with mandatory reason; no approval queue in MVP | Master spec; earlier plan's request/approve flow moved to Later |
| D-7 | One category per product in MVP (`products.category_id`); no `product_categories` table | Spec marks it optional; hierarchy covers the need |
| D-8 | Prisma schema at repository root `prisma/`, imported only by `apps/api` | Master spec layout |
| D-9 | Valuation: weighted average cost | See `database-design.md` section 6 |
| D-10 | Same-origin deployment: reverse proxy sends `/api` to Express, everything else to Next.js | First-party cookies, simpler CSRF and CORS |
| D-11 | Public catalog uses a separate router and separate output serializers with an allow-list of fields | Prevents accidental leakage |
| D-12 | TOTP two-factor for Admin and Manager recommended immediately after MVP | Not in master spec; listed so it is not forgotten |
| D-13 | Package versions are pinned in phase 3 after checking current stable releases and the existing repository | No versions are asserted in these documents |

## 9. Open questions (answer when convenient; defaults apply otherwise)

1. Currency and tax: single currency with no tax handling is assumed. Is tax needed on purchase orders?
2. Public catalog: should selling prices be public (A-8) and should "in stock / out of stock" labels be shown?
3. Number of warehouses and whether staff should be limited to specific warehouses (not in MVP).
4. Hosting target (VPS, managed container platform) for phase 12.
5. Is a printed PDF catalog still wanted later? The data model already supports it; it is a separate future phase.

## 10. Acceptance criteria

Mapped from the specification's release conditions; each becomes at least one automated test (IDs assigned in phase 11).

| # | Criterion | Primary test layer |
| --- | --- | --- |
| 1 | Secure login and logout | API integration, E2E |
| 2 | Unauthenticated requests get 401 on protected endpoints | API integration |
| 3 | Role boundaries (104 permission-by-role checks) | API integration |
| 4 | Products and categories persist; duplicates and invalid data rejected | API integration |
| 5 | Receipts increase and issues decrease quantities correctly | Unit, integration |
| 6 | Invalid or unauthorised adjustments rejected | Integration |
| 7 | Concurrent operations never corrupt balances | Concurrency integration |
| 8 | Movement history shows actor and reason | Integration |
| 9 | PO does not change stock; partial receipt changes only received quantity | Integration |
| 10 | Dashboard totals equal database aggregates | Integration |
| 11 | Public catalog exposes no confidential field | Contract test on serializers |
| 12 | Forms, filters, pagination, error states work; responsive layout | E2E |
| 13 | Migrations succeed from a clean database | CI job |
| 14 | Backup and restore documented and rehearsed | Manual checklist |
| 15 | No committed secrets | CI secret scan |
