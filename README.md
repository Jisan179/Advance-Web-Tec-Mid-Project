# InspectFlow — Backend

**Course:** CSC4161 Advance Programming in Web Technology (Fall 26-27) · **Group:** 11
**Repository:** https://github.com/Jisan179/Advance-Web-Tec-Mid-Project

InspectFlow is a REST API for reporting defects found on a staging website, managing project access, tracking fixes and recording build approval. This repository contains **the backend only** (NestJS API, PostgreSQL schema and Prisma migrations). There is no frontend in this repository; the API is demonstrated with Postman and Swagger.

The full write-up (requirements, use cases, ER diagram, normalization, API list, Postman evidence) is in the project report `InspectFlow_Backend_Project_Report.docx`.

## What the backend does

| Area | What is implemented |
|---|---|
| **Authentication** | Login with email and password (bcrypt, cost 12), 15-minute JWT access token, single-use revocable refresh tokens (only the SHA-256 hash is stored), logout, `GET /auth/me`. Accounts are created by the seed script; there is no public registration endpoint. |
| **Users** | View own profile, change name or password (current password required). |
| **Projects and members** | Create a project (creator becomes Lead), list own projects with role, edit, delete (with its data and stored files), add or remove members, change roles. A project always keeps one Lead. |
| **Per-project authorization** | No global admin. Rights come from the `Membership` role (`LEAD`, `DEVELOPER`, `TESTER_CLIENT`) enforced by one global `ProjectRolesGuard`. Non-member gets 404, wrong role gets 403. |
| **Report ingestion** | `POST /widget/login`, `GET /widget/config`, `POST /reports`. Validated by project key, allowed origin and a project-scoped token, rate limited. Creates the ticket, sanitised evidence, annotation metadata and screenshot in one transaction. |
| **Evidence and files** | Screenshot checked for size, declared type and file signature, re-encoded to PNG with Sharp, stored privately (local disk or S3-compatible bucket) under a random key and served through expiring signed URLs. Tokens, JWTs, passwords and sensitive query values are redacted before storage. |
| **Tickets** | Manual create, edit, delete; search, filter, sort and pagination; role-filtered detail (Testers do not see technical events); link branch or pull request; mark duplicate; comments (add, edit own, delete by author or Lead). |
| **Ticket workflow** | `OPEN → IN_PROGRESS → RESOLVED → VERIFIED` with reopening. Every transition is allowed only to specific roles (one table in `ticket-workflow.ts`). |
| **Builds and approval** | Register a build (starts as `DRAFT`), edit, mark ready (`IN_REVIEW`), review data, approve or request changes. Approval stores user, time and commit SHA. It is blocked while High or Blocker tickets are not verified. The build row is locked with `SELECT ... FOR UPDATE`, so parallel decisions produce exactly one result. |
| **GitHub webhook** | `POST /webhooks/github` verifies the HMAC-SHA256 signature (constant-time compare), rejects invalid signatures with 401, ignores replayed delivery ids and moves linked tickets to `RESOLVED` when a pull request is merged. Lead can connect a repository and view delivery history. |
| **Activity / audit log** | Ticket changes, approvals, role changes, key rotation and GitHub connection are recorded with user and time. Project overview endpoint for Lead and Developer. |
| **Cross-cutting** | DTO validation with a global `ValidationPipe` (whitelist, forbid unknown fields), one error JSON shape via a global exception filter (no stack traces), request-logger middleware, `X-Response-Time` interceptor, Helmet, CORS, rate limiting, Zod-validated environment, Swagger at `/api/docs`, health check at `/health`. |
| **Retention** | Optional job to remove screenshots of long-verified tickets. |

## Actors

| Actor | Role in the system |
|---|---|
| **Tester / Client Reviewer** (`TESTER_CLIENT`) | Submits reports, follows and comments on own tickets, verifies or reopens fixes, approves or rejects shared builds. |
| **Developer** (`DEVELOPER`) | Sees all tickets and evidence, changes status (start, resolve), assigns, links branch/PR, registers builds and marks them ready. |
| **Project Lead** (`LEAD`) | Developer operations plus project settings, members and roles, report-ingestion key rotation, allowed origins and GitHub connection. |
| **GitHub** (system) | Sends signed `pull_request` events to the webhook endpoint. |

## Tech stack

NestJS 11 (TypeScript, Express) · PostgreSQL 17 · Prisma 6 (ORM and migrations) · Passport-JWT · bcrypt · class-validator / class-transformer · Zod · Swagger (`@nestjs/swagger`) · Sharp and Multer · S3-compatible storage (optional) · Jest.

## Project structure

```
apps/api
├── prisma/            schema.prisma, migrations, seed.ts
└── src
    ├── common/        decorators, filters, guards, interceptors, middleware, utils
    ├── config/        Zod-validated environment
    ├── providers/     database (Prisma) and storage
    └── modules/       auth, users, projects, access, tickets, builds,
                       reports, files, github, activity
```

## Database

Thirteen tables, normalized to 3NF (BCNF in practice): `User`, `Project`, `Membership`, `Build`, `BuildApproval`, `Ticket`, `Annotation`, `Artifact`, `CapturedEvent`, `Comment`, `WebhookDelivery`, `RefreshToken`, `ActivityLog`. Foreign keys, unique keys and enums are enforced by the database. The schema is built only from the Prisma migrations. Multi-table operations (report creation, build decision, webhook processing) run in transactions.

## API overview

48 operations. Main groups (full tables with access rules are in the report, Section 5):

- **Auth / Users:** `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/users/me`
- **Projects / Members / GitHub:** `/projects`, `/projects/:projectId`, `/projects/:projectId/rotate-key`, `/projects/:projectId/members`, `/projects/:projectId/github`, `/projects/:projectId/webhook-deliveries`, `/projects/:projectId/overview`
- **Tickets / Comments:** `/projects/:projectId/tickets`, `/tickets/:ticketId`, `/tickets/:ticketId/status`, `/tickets/:ticketId/link`, `/tickets/:ticketId/duplicate`, `/tickets/:ticketId/comments`, `/comments/:commentId`
- **Builds:** `/projects/:projectId/builds`, `/projects/:projectId/approvals`, `/builds/:buildId`, `/builds/:buildId/ready`, `/builds/:buildId/review`, `/builds/:buildId/decision`
- **Report ingestion:** `/widget/config`, `/widget/login`, `/reports`
- **Other:** `/webhooks/github`, `/health`, `/`

Interactive documentation: `http://localhost:5002/api/docs` when the API is running.

## Getting started

Requirements: Node.js 22 (see `.nvmrc`), pnpm, Docker (for PostgreSQL).

```powershell
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Create the environment file and adjust secrets
copy apps\api\.env.example apps\api\.env

# 4. Generate Prisma client, apply migrations, seed demo data
pnpm setup:db

# 5. Run the API (default port 5002)
pnpm dev:api
```

The seed script resets its demo project, so use it only on a dedicated local database.

### Useful commands

```powershell
pnpm test                      # unit tests (46 tests in 6 suites)
pnpm lint                      # ESLint
pnpm build                     # build the API
pnpm --filter @inspectflow/api migration:run   # apply migrations
```

The tests read the same environment variables as the API, so keep `apps/api/.env` set up before running them.

## Testing with Postman

Import requests against `http://localhost:5002` (the report's screenshots were captured earlier on port 5001). Typical flow: login as Tester → report an issue → login as Developer and move the ticket to In progress / Resolved → Tester verifies → Client approves the build (blocked while blocking tickets exist) → send a signed GitHub webhook to see a merged PR resolve a linked ticket. Postman runs on each team member's own machine, so ids, tokens and timestamps differ between machines.

## Scope

In scope: REST API, PostgreSQL schema and migrations, authentication and authorization, report ingestion, file storage, ticket and build workflows, activity log, GitHub webhooks.

Out of scope: user interface, browser-side page capture and drawing tools, e-mail notifications, third-party tracker sync.

## Team

| ID | Name |
|---|---|
| 22-48674-3 | MD Jisan Ahmmed Jim |
| 23-50127-1 | MD. Arafat Hossen Apon |
| 23-50207-1 | Kawsar Habib |
| 22-48935-3 | SK Asif Ahmed Prethibi |

Submitted to: Sultanul Arifeen Hamim
