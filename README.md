# InspectFlow

**Visual staging QA, issue tracking and build review.** InspectFlow helps teams report problems found on a staging website, manage the resulting tickets, and review a specific build. This repository contains the course project's NestJS API, dashboard, reporting widget and demonstration staging site.

## Project overview

A tester reports an issue; the developer examines the ticket, starts work, links branch or pull-request information and marks the issue resolved. The tester can then verify or reopen their own report. Developers and leads can register a build and move it into review; the client review workflow records a decision against a commit. A GitHub webhook module handles signed pull-request events. Actual GitHub delivery and deployment depend on configuration and should be demonstrated separately from example Postman values.

```text
Staging site + widget → report / evidence → API → PostgreSQL
                                            ↓
Dashboard / Postman ← tickets and builds ← role-based access
Tester reports → Developer resolves → Tester verifies → Client reviews build
```

## Actors and responsibilities

| Actor | Main responsibilities | Documentation |
| --- | --- | --- |
| Tester / Client Reviewer | Report and follow issues, verify or reopen their own fixes, and review shared builds | [Tester guide and Postman evidence](https://github.com/Jisan179/Advance-Web-Tec-Mid-Project/blob/test/README.md); [screenshots](docs/postman/) |
| Developer | Inspect and update tickets, change status, link branch/PR information, register builds and prepare them for review | [Developer guide and Postman collection](docs/developer/README.md) |
| Project Lead | Manage project settings and members, configure GitHub, and view project activity | [Project Lead guide and collection](docs/project-lead/README.md) |
| GitHub | Send signed pull-request webhook events when configured | [Webhook controller](apps/api/src/modules/github/github.controller.ts), [webhook service](apps/api/src/modules/github/github.service.ts) |

Membership and roles are project-specific. The documented example branch names, PR numbers and commit SHAs in Postman records do not themselves create GitHub objects.

## Technology and structure

| Component | Location | Technology |
| --- | --- | --- |
| REST API | [apps/api](apps/api/) | NestJS, TypeScript, JWT, Prisma and PostgreSQL |
| Dashboard | [apps/web](apps/web/) | Next.js, React and TypeScript |
| Reporting widget | [apps/widget](apps/widget/) | TypeScript, html2canvas and Konva |
| Demo staging site | [apps/staging](apps/staging/) | HTML and JavaScript |
| Database schema and migrations | [apps/api/prisma](apps/api/prisma/) | Prisma schema and PostgreSQL migrations |

The API is organized into feature modules. Controllers receive requests, DTOs define validation, services implement business rules, guards check access, and Prisma performs database operations. Project membership defines the role; a JWT authenticates the user. Ticket status changes follow role-specific rules in [ticket-workflow.ts](apps/api/src/modules/tickets/ticket-workflow.ts).

## Local setup

Prerequisites: Node.js 22 or newer, pnpm 12.16.1, and PostgreSQL. The included Docker Compose configuration starts an isolated PostgreSQL database on `127.0.0.1:5434`; Docker Desktop must be running. From the repository root in PowerShell:

```powershell
pnpm install --frozen-lockfile
docker compose up -d postgres
Copy-Item apps/api/.env.example apps/api/.env
# Edit local JWT secrets and review DATABASE_URL in apps/api/.env.
pnpm setup:db
pnpm dev:api
```

Do not overwrite an existing `.env` without reviewing it. For an installed PostgreSQL server, create a separate database and update `DATABASE_URL` accordingly. The current seed requires a database named `inspectflow_actor` or an allowed `inspectflow_actor_*` name. Use seed only with a dedicated demo database. `pnpm setup:db` generates Prisma Client, applies migrations and runs seed; it is not required every time the API starts.

With the example configuration, the API uses `http://localhost:5002`, health is at `/health`, and Swagger is at `/api/docs`. Keep PostgreSQL and the API terminal running. The reviewer seed creates `tester@inspectflow.demo` with default demo password `Demo@12345`; it is designed for the Tester/Client demo and does **not** provision the Developer and Lead accounts or their memberships. Their collections require appropriately configured local demo users and project memberships. Do not use demo credentials or example secrets in a public deployment.

The dashboard can be started separately with `pnpm dev:web` (default `http://localhost:3001`); the staging app uses `pnpm dev:staging`. Widget/staging configuration is documented in their `.env.example` files. Individual actor guides may use different ports or data from their practice environments; match the Postman collection's base URL to the server actually running.

## API and demonstration

1. Start PostgreSQL and the API, then check `GET /health`.
2. Login with `POST /auth/login` and use the returned access token as a Bearer token on protected requests.
3. Use the actor guides above to demonstrate project membership, ticket workflow, build review and role restrictions. The Developer guide includes a negative permission check and screenshot evidence.
4. Show code in `apps/api/src/modules/`: `tickets`, `builds`, `projects`, `access`, `auth` and `github`. API routes are also visible in Swagger.

Typical responses include `200`/`201` for successful requests, `400` for invalid input, `401` for authentication failure, `403` for a forbidden role and `404` for missing or deliberately hidden resources. The example project must be seeded and the required actor must be a member before testing project-scoped requests.

## Tests and project documents

The API contains workflow, access, project and webhook signature unit tests. Run `pnpm test` for the configured API test suite and `pnpm --filter @inspectflow/api build` to compile the API. Test results and screenshots from an earlier run are evidence of that run, not a guarantee that every current environment or external integration has been tested.

The supplied [proposal and report drafts](docs/submission-drafts/) must be reviewed and completed before submission. The report copy currently has placeholders for group number, section, several members' names and IDs, SL numbers and actual contributions, and contains an older repository link. Fill in accurate details, update links and AI-use information, replace the drafts with the approved documents, and print both as instructed. Confirm the submitted GitHub link is accessible and check the assigned defense schedule.

## Team information

The supplied report identifies **MD Jisan Ahmmed Jim — 22-48674-3**, but does not contain complete verified details for all four members. Add each member's SL number from the shared project list, full name, student ID, section, group number and actual contribution after the team confirms them. Actor roles and branch names alone do not establish individual authorship.
