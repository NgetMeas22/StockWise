# StockWise — Inventory Management System

StockWise is an enterprise-grade, secure, and maintainable inventory management system designed for businesses managing multi-warehouse stock tracking, suppliers, purchasing, goods receiving, and public B2B product catalogs.

## 🚀 Overview & Key Features

- **Multi-Warehouse Stock Tracking:** Real-time balances tracked across facilities through an immutable movement ledger.
- **Strict Ledger Integrity:** Double-entry style movements (`RECEIPT`, `ISSUE`, `ADJUSTMENT`, `TRANSFER`, `REVERSAL`) enforced with PostgreSQL triggers and row-level locks.
- **Purchasing & Goods Receiving:** Full purchase order lifecycle (`DRAFT` → `ORDERED` → `PARTIALLY_RECEIVED` → `RECEIVED` / `CANCELLED`) with tolerance checking.
- **Valuation & Analytics:** Real-time inventory valuation powered by Weighted Average Cost (WAC), dashboard KPI metrics, and low-stock alerts.
- **Granular RBAC:** 26 permission keys across 4 internal roles (`ADMIN`, `MANAGER`, `INVENTORY_STAFF`, `VIEWER`) with confidential cost data redaction.
- **Public Product Catalog:** Server-rendered B2B catalog with category breadcrumbs, SEO metadata, and strict allow-list data serializers.
- **Full Traceability:** Append-only audit logs capturing actor, IP, timestamp, and sanitized before/after state diffs.

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Node.js, Express.js, TypeScript, Zod, Helmet, Pino
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Monorepo & Package Management:** pnpm workspaces
- **Testing:** Vitest, Supertest, Playwright
- **Containerization:** Docker & Docker Compose

## 📁 Repository Structure

```
.
├── apps/
│   ├── backend/         # Express API, controllers, services, repositories
│   └── frontend/        # Next.js App Router (web & public catalog)
├── packages/
│   └── shared/          # Shared Zod schemas, permission keys, DTO types
├── prisma/
│   └── schema.prisma    # Database schema & migrations
├── docs/                # Architectural & design specifications
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── permissions.md
│   ├── api-specification.md
│   ├── ui-design-system.md
│   └── implementation-plan.md
└── StockWise_Inventory_Management_System_URD.xlsx # Master URD Workbook
```

## 📋 Documentation & Specifications

- [Master Requirements (`requirements.md`)](./requirements.md)
- [System Architecture (`architecture.md`)](./architecture.md)
- [Database Schema & ERD (`database-design.md`)](./database-design.md)
- [Roles & Permissions Matrix (`permissions.md`)](./permissions.md)
- [REST API Specification (`api-specification.md`)](./api-specification.md)
- [UI Design System (`ui-design-system.md`)](./ui-design-system.md)
- [Implementation Plan & Checklist (`implementation-plan.md`)](./implementation-plan.md)
- [Excel URD Workbook](./StockWise_Inventory_Management_System_URD.xlsx)

## ⚡ Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NgetMeas22/StockWise.git
   cd StockWise
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Run with Docker Compose:**
   ```bash
   docker compose up -d
   ```
