# StockWise — UI Design System

Status: **Draft v0.1**. Modern, minimalist, premium business application: neutral surfaces, slate typography, one restrained teal accent, thin borders, almost no shadows, no decorative gradients.

## 1. Research basis and limits

Reference 2 was accessible as text and markup only; References 1 and 3 were blocked. Colour, typography, spacing and imagery of the references were therefore **not observed** and are **not copied**. The structural ideas used (category-first browsing, breadcrumb, left filters, A–Z supplier jump bar, item line with code and supplier, quick entry) are listed in `requirements.md` section 2. Visual choices below are original and based on common accessible practice. Contrast values are design intentions and must be verified with tooling in phase 5.

## 2. Principles

1. Data first: tables and clear numbers are the main surface; decoration is minimal.
2. One accent colour for primary actions, links and active navigation. Other colour only for meaning (stock status, errors).
3. Consistency: every list, form and dialog is built from shared components; no page-specific variants.
4. State completeness: every data view has loading skeleton, empty, error and success states.
5. Safety: destructive or sensitive actions use a confirmation dialog that names the target; stock quantities are never edited inline.
6. Accessibility: keyboard operation, visible focus, labels, status shown by text and icon, not colour alone.
7. Same tokens for the private app and the public catalog; the catalog adds imagery and larger type, not a new style.

## 3. Design tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #F8FAFC | App background |
| `--surface` | #FFFFFF | Cards, tables, dialogs |
| `--surface-muted` | #F1F5F9 | Table header, hover, code chips |
| `--border` | #E2E8F0 | All dividers and outlines |
| `--text` | #0F172A | Headings and body (dark slate) |
| `--text-muted` | #475569 | Secondary text and labels |
| `--accent` | #0F766E | Primary button, links, active nav, focus ring |
| `--accent-hover` | #115E59 | Hover and pressed |
| `--accent-soft` | #CCFBF1 | Selected row, subtle highlight |
| `--ok` | #15803D | In stock, success |
| `--warn` | #B45309 | Low stock, caution |
| `--danger` | #B91C1C | Out of stock, errors, destructive |
| `--info` | #0369A1 | Informational notices |

Dark theme is out of scope for the first release; tokens are CSS variables so it can be added later.

| Scale | Values |
| --- | --- |
| Font families | Inter (UI), JetBrains Mono (SKU, quantities, prices) via `next/font` |
| Type sizes (px) | 12 caption, 14 body and tables, 16 inputs and lead, 20 section title, 28 page title, 36 dashboard figure; public catalog hero 40 |
| Weights | 400 and 600 only |
| Spacing (px) | 4, 8, 12, 16, 24, 32, 48, 64 |
| Radius | 6 inputs and buttons, 8 cards and dialogs, 999 pills |
| Borders | 1 px `--border`; no shadows except a faint one for popovers and dialogs |
| Layout | Sidebar 240 px (64 px collapsed), content max width 1280 px, page padding 24 px (16 px on phones) |
| Breakpoints (px) | 640, 768, 1024, 1280 |
| Motion | 150 ms ease for hover and focus; reduced-motion respected |

## 4. Core components (built once, in phase 5)

| Component | Behaviour |
| --- | --- |
| App shell | Collapsible sidebar, top bar with breadcrumb or page title, notifications, user menu; sidebar becomes a drawer on tablet and phone |
| Page header | Title, optional description, primary action, secondary actions |
| Data table | Sortable columns, URL-synced search, filters, page and page size, row actions, sticky header, 44 px rows, right-aligned numerics in mono font, column visibility, empty and error states, skeleton rows; on phones rows become cards |
| Filter bar | Search field, select and multi-select filters, active filter chips, reset |
| Form kit | Field wrapper with label, hint and error; React Hook Form and Zod; grouped sections; sticky save and cancel bar for long forms |
| Dialog and drawer | Confirmation dialogs; create/edit drawers from the right |
| Stock badge | Pill with icon and text: In stock, Low stock, Out of stock |
| Status chips | Purchase order statuses and active/archived states, with text |
| Stat card | Label, large figure, optional trend or subtext; loading and error variants |
| Charts | Bar and line charts through one wrapper (axis, tooltip, legend, empty state); colours from tokens |
| Toasts | Success and error feedback; errors include request id on demand |
| Image uploader | Drag and drop, preview, type and size hints, remove |
| Breadcrumb | Used on every catalog and detail page |
| Permission gate | `<Can permission="…">` hides or disables controls; never the only protection |
| Empty and error states | Icon, one sentence, one action |

## 5. Private application screens

Routes live under `/app`. Navigation items follow `permissions.md` section 5.

| Screen | Route | Contents |
| --- | --- | --- |
| Login | `/login` | Email, password, error and lock messages, forced password change step |
| Dashboard | `/app/dashboard` | Five stat cards (active products, total quantity, valuation if permitted, low stock, out of stock), stock by category chart, movements per day chart, low-stock list with quick links, recent movements, recent purchase activity, date range control |
| Products | `/app/products` | Table: image, SKU, name, category, selling price, stock, status; filters: search, category, status, stock state; row actions: view, edit, archive |
| Product form | `/app/products/new`, `/app/products/[id]/edit` | Groups: identity (SKU, barcode, name, brand), classification (category, unit), pricing (cost, selling), stock policy (reorder level), media (image upload with preview), publishing (published flag). Inline validation, save and cancel |
| Product detail | `/app/products/[id]` | Summary, balances per warehouse, tabs: movements, purchases, audit (permission dependent) |
| Categories | `/app/categories` | Tree with counts, create and edit drawer, archive with guard messages |
| Inventory | `/app/inventory` | Balances table, tabs for low stock and out of stock; actions: receive, issue, adjust, transfer (each a drawer with mandatory reason where required) |
| Movements | `/app/inventory/movements` | Ledger table with filters (product, warehouse, user, type, date) and actor and reason columns |
| Quick entry | `/app/inventory/quick-entry` | Scan or type SKU, quantity, warehouse, reason code; running list; submit all (post-MVP enhancement of the receive and issue drawers) |
| Suppliers | `/app/suppliers`, `/app/suppliers/[id]` | List, form, purchase history |
| Purchases | `/app/purchases`, `/new`, `/[id]` | PO list with status chips; editor with line items; detail with receive dialog (per-line quantity), receipts list, cancel dialog, print view |
| Reports | `/app/reports` | Report picker; valuation, low stock, out of stock, movements, purchase history; filters; CSV button when permitted |
| Users and Roles | `/app/admin/users`, `/app/admin/roles` | User table and drawer; role list with permission matrix editor (Admin column locked) |
| Audit logs | `/app/admin/audit-logs` | Filterable table, detail drawer with before/after JSON (redacted) |
| Settings | `/app/settings` | Currency code, thresholds, public catalog options, warehouses |
| Profile | `/app/profile` | Name, password change, active sessions |

## 6. Public catalog design

| Page | Route | Design |
| --- | --- | --- |
| Home | `/` | Light hero with search, featured categories grid (image card, name, product count), a "new products" row |
| Browse by category | `/catalog` and `/catalog/[...category]` | Breadcrumb, category cards for sub-categories, product grid below; left filter panel on desktop, bottom sheet on phones |
| Product list | same | Search, sort (name, newest, price if enabled), brand filter, page-based pagination, result count |
| Product detail | `/p/[slug]` | Image gallery, name, brand, category breadcrumb, description, SKU if enabled, price if enabled, availability label if enabled; related products from the same category |
| Not found and empty | | Friendly messages with a way back |

Product card: 4:3 image area with neutral placeholder, name (2 lines max), brand in muted text, price in mono font when enabled; grid 4 columns desktop, 3 tablet landscape, 2 tablet portrait and phones. Imagery guidance: consistent background, minimum 800 px on the longer edge, alt text from the product name. Public pages carry titles, descriptions, canonical URLs, Open Graph tags and structured product data. No supplier names, costs, quantities or warehouse information appear anywhere.

## 7. Responsive behaviour

| Width | Behaviour |
| --- | --- |
| 1280 and above | Full sidebar, tables with all columns |
| 1024 to 1279 | Sidebar collapsible, low-priority columns hidden |
| 768 to 1023 | Sidebar as drawer, two-column forms collapse to one, tables scroll horizontally or hide columns |
| Below 768 | Bottom-safe actions, tables render as cards, drawers become full-height sheets, filters in a sheet |

## 8. Accessibility checklist (verified in phases 5 and 11)

- Colour contrast checked with a tool for every token pair in use (text 4.5:1, large text and UI parts 3:1).
- Focus ring 2 px accent with offset on every interactive element; logical tab order; skip link.
- Form fields have labels; errors are announced and linked with `aria-describedby`.
- Dialogs trap focus and restore it; Escape closes non-destructive dialogs.
- Tables use proper header cells and sort state announcements.
- Status never conveyed by colour alone.
- Reduced motion respected; zoom to 200 % without loss of function.
- Automated checks (axe) in Playwright for key pages.

## 9. Content rules

Plain, short labels. Numbers right-aligned, thousands separators, quantities show unit. Dates shown in the user's time zone with an unambiguous format. Error messages say what happened and what to do, never expose internals.
