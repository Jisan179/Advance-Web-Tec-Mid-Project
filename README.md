# InspectFlow — Developer Actor

This branch presents the Developer actor's backend workflow for InspectFlow, a staging-site issue tracking and build review project. It brings together developer ticket handling, project access checks, build preparation and Postman evidence.

## Developer responsibilities

- View project tickets and technical details permitted to the Developer role.
- Update ticket information and assignment, start work and resolve issues.
- Link a branch name and pull-request number to a ticket and mark duplicates.
- Register a build with a branch and commit SHA, then prepare it for review.
- Apply membership and role checks so that a Developer cannot verify a resolved ticket as a Tester.

The implementation was adapted and integrated from the supplied InspectFlow project archive. The Developer branch also includes a membership-access fix, tests, Postman practice and documentation. Contribution and AI assistance should be described accurately in the group report.

## Workflow

```text
Tester reports an issue → Developer starts work → Developer resolves it
                       → Tester verifies the fix

Developer registers a build → Developer marks it ready for review
```

The Developer ticket status demonstration uses `OPEN → IN_PROGRESS → RESOLVED`; the Tester verifies their own report as `VERIFIED`. Role and transition rules are implemented in [ticket-workflow.ts](apps/api/src/modules/tickets/ticket-workflow.ts). Other permitted transitions are documented in that file.

## Run the backend locally

Requires Node.js 22+, pnpm and PostgreSQL. Create a dedicated local development database and configure `apps/api/.env` from `apps/api/.env.example`, including the database URL and local secrets. From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @inspectflow/api prisma:generate
pnpm --filter @inspectflow/api migration:run
pnpm --filter @inspectflow/api seed
pnpm dev:api
```

The seed resets demo project data and is intended only for an isolated practice database. Once configured, keep PostgreSQL running and use `pnpm dev:api` to start the backend; you do not need to seed on every start. Use the API port shown in the terminal. Swagger is available at `/api/docs`.

## Postman demonstration

Import the [Developer Postman collection](docs/developer/Developer.postman_collection.json), set its `baseUrl` to the running API, and send requests in order. The collection uses fictional demo accounts and saves IDs and the access token between requests. The Tester creates the practice ticket; the Developer then handles it, registers a build, and receives the expected `403` when attempting to verify; finally the Tester verifies their own ticket.

The [full Developer guide](docs/developer/README.md) contains the request sequence, code map, setup notes and all included screenshots. The images show a local practice copy; fields can differ from this branch. Branch names, PR numbers and commit SHA values in the demo are examples and do not create actual GitHub objects.

| Developer action | Screenshot |
| --- | --- |
| View ticket | [Ticket details](docs/developer/screenshots/04-ticket-details.png) |
| Start work | [IN_PROGRESS](docs/developer/screenshots/05-start-work.png) |
| Link Git information | [Branch and PR](docs/developer/screenshots/06-link-branch.png) |
| Resolve issue | [RESOLVED](docs/developer/screenshots/07-resolve.png) |
| Register and prepare build | [DRAFT](docs/developer/screenshots/08-register-build.png), [IN_REVIEW](docs/developer/screenshots/09-build-ready.png) |
| Check role restriction | [Expected 403](docs/developer/screenshots/10-denied-verify.png) |

## Main code files

- [Tickets controller](apps/api/src/modules/tickets/tickets.controller.ts) — HTTP routes.
- [Ticket DTO](apps/api/src/modules/tickets/dto/ticket.dto.ts) — input validation.
- [Ticket service](apps/api/src/modules/tickets/tickets.service.ts) — access checks, ticket changes and activity.
- [Build service](apps/api/src/modules/builds/builds.service.ts) — build registration and review readiness.
- [Project access service](apps/api/src/modules/access/project-access.service.ts) — membership and role checks.

This root README is intended for the `developer` branch. It is a tracked file, so if a future merge includes this commit, it can also appear in the target branch. Review or exclude the README change during that merge if the group wants the main branch to keep a different landing page.
