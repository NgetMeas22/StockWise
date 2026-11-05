# StockWise — Implementation Plan

Status: **Draft v0.1**. One phase at a time. A phase is complete only when its gate passes with real command output; nothing is reported as passing unless it was actually executed and succeeded.

## 1. Working rules

1. Complete a phase, run its checks, report real results, fix failures, update this checklist, then stop for approval before the next phase.
2. Preserve existing work: inspect first, diff before changing, never overwrite blindly.
3. Small commits with conventional messages. Each phase ends with a tagged commit.
4. Any decision that changes a document is recorded in `requirements.md` section 8.
5. Every phase report contains: what was implemented, files created or modified, commands run, actual results, unresolved issues, checklist update.

## 2. Phase overview

| # | Phase | Main output | Gate (must pass to continue) |
| --- | --- | --- | --- |
| 1 | Reference research and workspace inspection | Findings, seven draft planning docs | Findings and limits reported honestly; docs drafted (this document set) |
| 2 | Requirements, architecture, ERD, permissions | Approved docs; Prisma schema draft validated | You approve decisions D-1 to D-13 and open questions; `prisma validate` and `prisma format` succeed on the draft schema |
| 3 | Repository setup | Monorepo, Next.js, Express, PostgreSQL, Docker Compose, lint, type-check, CI | `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test` succeed; `docker compose up` gives a healthy database; `/api/v1/health` returns 200 |
| 4 | Migrations, seed, authentication, security base | Schema migrated, RBAC seed, sessions, CSRF, rate limits, audit writer | Migrations apply from an empty database; seed runs twice; 104-case permission matrix and session tests pass |
| 5 | UI design system and layout | Tokens, shell, data table, form kit, states, charts wrapper | Contrast and keyboard checks pass; Playwright smoke at 3 widths |
| 6 | Products and categories | CRUD, search and filters, image upload, archive | Duplicate SKU/barcode rejected; cycle prevention tested; field-level cost tests pass |
| 7 | Inventory ledger and stock workflows | `stockService`, receive, issue, adjust, transfer, reverse, balances | Concurrency test (parallel issues) passes; reconciliation check passes; immutability trigger test passes |
| 8 | Suppliers, purchase orders, goods receiving | Supplier CRUD, PO workflow, partial receiving | PO does not change stock; partial receipt adds only received quantity; illegal transitions rejected |
| 9 | Dashboard, reports, CSV | Summary endpoint, charts, reports, exports | Totals equal SQL aggregates; CSV escaping test passes; export permissions tested |
| 10 | Public catalog | Public router, serializers, SEO pages | Contract test proves no confidential field; Lighthouse and axe checks recorded |
| 11 | Automated tests, security review, fixes | Coverage of critical rules, review report, fixes | All acceptance criteria (requirements section 10) mapped to passing tests; dependency audit with no unresolved high or critical issues; manual security review recorded |
| 12 | Deployment, backups, documentation | Production images, proxy config, backup and restore, README | Fresh-clone start documented and tested; restore rehearsal done; no secrets in repository |

## 3. Phase 1 details

**Done in this session**

- References studied in the specified order; access results and limits recorded (`requirements.md` section 2).
- Seven draft planning documents written (this folder).
- Two source specifications merged; conflicts resolved as decisions D-1 to D-13.

**Not possible in this session:** inspecting your Antigravity workspace and repository (no access from the environment used).

**Workspace inspection protocol** (run by the agent inside the real repository before phase 3; output pasted into the phase 3 report):

| Check | Command or action |
| --- | --- |
| Repository state | `git status`, `git log --oneline -n 20`, `git branch -a` |
| Tree | `ls -la`, list top two levels, locate `package.json`, lockfiles, `prisma/`, `docker-compose*.yml`, `.env*` |
| Tool versions | `node -v`, `pnpm -v`, `docker --version`, `docker compose version`, `psql --version` |
| Dependencies | Read every `package.json`; record framework and library versions; note conflicts with the required stack |
| Conventions | ESLint, Prettier, tsconfig, folder structure, naming, existing tests |
| Reusable parts | List components, utilities, schemas that can be kept; mark anything that would be replaced and ask before replacing |
| Secrets | Scan for committed secrets and `.env` files; report, do not print values |

Rule: nothing existing is deleted or rewritten without a written diff summary and approval.

## 4. Phase 2 proposal (next step, planning only)

1. You review the seven documents and answer the open questions (`requirements.md` section 9).
2. I update the documents with your answers and record any changed decisions.
3. Write the Prisma schema draft (`prisma/schema.prisma`) matching `database-design.md`, plus the raw-SQL migration plan, and run `prisma validate` / `prisma format` (no application code).
4. Produce the OpenAPI skeleton listing all endpoints from `api-specification.md` (no handlers).
5. Cross-check script: permission keys used in the API doc exist in `permissions.md`; every table in the ERD has a definition; every phase has a gate.
6. Report results and request approval to start phase 3.

## 5. Definition of done (every phase)

- Code merged to the phase branch with lint and type checks clean.
- Tests for the phase's business rules and permission boundaries written and passing.
- Documentation updated; checklist below updated.
- For UI phases: responsive check at 375, 768, 1280 px and keyboard walkthrough.
- No new high or critical dependency vulnerabilities.
- Phase report delivered with real command output.

## 6. Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing repository conflicts with the planned structure | Rework | Inspection protocol and approval before changes |
| Stock corruption under concurrency | Critical | Row locks, CHECK constraints, immutable ledger, concurrency tests, reconciliation job |
| Permission gaps or privilege escalation | Critical | Central middleware, route registry check, 104-case matrix, escalation tests |
| Cost or supplier data leaks via public API or non-cost roles | High | Allow-list serializers, field-level tests, contract tests |
| Prisma limits for constraints and triggers | Medium | Raw SQL inside migrations, tested from an empty database |
| Valuation expectations differ from the weighted-average method | Medium | Decision D-9 confirmed in phase 2 before reports are built |
| Scope growth (orders, approvals, batch tracking) | Medium | "Later" list in requirements; extension points in architecture |
| Reference visuals not observed | Low | Generic conventions used; optional screenshots can refine the design |
| Upload abuse | Medium | Content sniffing, re-encoding, size limits, rate limits, private storage |

## 7. Checklist

Legend: `[x]` done and verified in this session, `[ ]` not started. Nothing below phase 1 has been started.

**Phase 1**
- [x] Reference 1 attempted; blocked, reported
- [x] Reference 2 inspected (structure only); limits reported
- [x] Reference 3 attempted; blocked, reported
- [ ] Existing Antigravity workspace inspected (not reachable from this environment; protocol in section 3)
- [x] `docs/requirements.md` drafted
- [x] `docs/architecture.md` drafted
- [x] `docs/database-design.md` drafted
- [x] `docs/permissions.md` drafted
- [x] `docs/api-specification.md` drafted
- [x] `docs/ui-design-system.md` drafted
- [x] `docs/implementation-plan.md` drafted
- [ ] Documents approved (phase 2 gate)

**Phases 2 to 12**
- [ ] 2 Requirements, architecture, ERD, permissions approved; Prisma draft validated
- [ ] 3 Repository, Docker, CI
- [ ] 4 Migrations, seed, authentication, security base
- [ ] 5 Design system and layout
- [ ] 6 Products and categories
- [ ] 7 Inventory ledger and workflows
- [ ] 8 Suppliers, purchase orders, receiving
- [ ] 9 Dashboard, reports, CSV
- [ ] 10 Public catalog
- [ ] 11 Tests, security review, fixes
- [ ] 12 Deployment, backups, documentation
