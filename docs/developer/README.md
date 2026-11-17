# Developer actor API practice

This branch integrates the developer ticket and build workflow from the supplied InspectFlow project archive, with a project membership fix and additional access tests. The code was adapted from an existing project; contributors should describe their actual work and assistance accurately in the group report.

## Local setup

Use Node.js 22 or newer, pnpm and a local PostgreSQL database. Configure `apps/api/.env` using `apps/api/.env.example`, with a database reserved for development. From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @inspectflow/api prisma:generate
pnpm --filter @inspectflow/api migration:run
pnpm --filter @inspectflow/api seed
pnpm dev:api
```

The seed resets the demo project: never run it on real or shared data. The sample Postman collection uses `http://localhost:5001`; change its `baseUrl` collection variable if the API uses another port. Import `Developer.postman_collection.json`, then send requests in order. The collection stores the demo token and IDs automatically. Demo login is `dev@inspectflow.demo` / `Demo@12345`.

## Demonstration

1. Login, list projects and confirm the role is `DEVELOPER`.
2. Create and read a practice ticket, move it to `IN_PROGRESS`, link a branch and example PR number, then resolve it.
3. Register an example build and mark it ready for review.
4. Show that a developer cannot verify a resolved ticket (403); login as the tester and verify it.

The example branch, PR number and commit SHA are sample database values. These requests do not create a Git branch, PR, or commit, and do not exercise the GitHub webhook. Each run creates demo records. The tester login replaces the collection token; run the developer login again before repeating.

## Code map

- `apps/api/src/modules/tickets/ticket-workflow.ts`: permitted role/status transitions and blocking-ticket rule.
- `apps/api/src/modules/tickets/tickets.controller.ts`: ticket HTTP endpoints.
- `apps/api/src/modules/tickets/dto/ticket.dto.ts`: request validation rules.
- `apps/api/src/modules/tickets/tickets.service.ts`: authorization, ticket changes and activity.
- `apps/api/src/modules/builds/`: build registration and review-ready operations.
- `apps/api/src/modules/access/`: project membership and explicit role checks.

The project currently contains a separate `github-test` branch. Coordinate webhook integration and shared ticket/access changes with the group before merging. No branch guarantees conflict-free merging.
