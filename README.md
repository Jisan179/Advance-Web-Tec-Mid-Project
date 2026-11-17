
# Inspect Flow 

A standalone local InspectFlow demo for the **Tester / Client Reviewer** actor. Sign in, report an issue from the staging site, annotate a screenshot, view and comment on your own reports, verify or reopen a fix, and approve a build or request changes.

## Run

Requires Node.js 22+, pnpm 12.16.1, and PostgreSQL. The root commands below assume PowerShell on Windows. The original project's services can keep their usual ports.

1. From the project root, run `pnpm install --frozen-lockfile`. Keep the checked-in `pnpm-lock.yaml` and use pnpm in this copy. The workspace uses the hoisted linker with package copies for Windows compatibility and disables links for unreferenced workspace packages.
2. Start the included local database with `docker compose up -d`, or use an existing PostgreSQL server and create a separate `inspectflow_actor` database.
3. Copy `apps/api/.env.example` to `apps/api/.env` if it does not exist. The example points to the included Docker database. For an existing PostgreSQL server, use its connection details for the separate database. Set local JWT secrets.
4. Run `pnpm setup:db` to generate Prisma Client, apply the migrations and seed the demo.
5. Run `pnpm dev` to start the three apps. You can also use `pnpm dev:api`, `pnpm dev:web` or `pnpm dev:staging` in separate terminals.

| Service | URL |
| --- | --- |
| Dashboard | http://localhost:3001/login |
| Staging shop and report widget | http://localhost:4001/ |
| API health | http://localhost:5002/health |
| Swagger | http://localhost:5002/api/docs |

Demo account is `tester@inspectflow.demo` with the local fixture password `Demo@12345`.

## Interface and working features

The original home page and project navigation are visible. Project Lead, Developer and GitHub panels and actions are shown as interface previews. Opening a preview or switching its tabs does not perform an actor action. The Tester demo account is the working sign-in in this copy.

## Demonstration

- Open Staging, then select **Report issue**. Sign in with the demo account, draw a box or arrow, blur a region and submit. Use Low severity to keep the build approval demo independent. The ticket appears in **My reports**.
- Open **Checkout build** under **Build review**. Its High severity ticket, IF-1, is already Resolved. The API returns 409 for approval while it is unverified. Verify IF-1 in My Reports, then approve the build.
- Reopen the separate verified ticket IF-2. Use **Catalogue build** to request changes with a note.
- Swagger lists the reviewer routes. Dashboard routes use a dashboard token from `POST /auth/login`. `POST /reports` takes a widget token from `POST /widget/login`, the seeded project key, an allowed staging origin, and multipart fields `payload` (JSON text) and `screenshot` (file).

The seed creates only one project role. It prepares the resolved ticket and the two reviewable builds so a second actor is unnecessary during the demo. Running the seed again preserves your existing decisions and ticket states.

Run pnpm build to build all four apps without starting a server. The build runs one app at a time because the dashboard and staging builds both write the widget bundle.

## Tester backend checks in Postman

### Database used for these checks

We used a separate local PostgreSQL database because the full project's shared database was outside the scope of this Tester backend check. In Postman, Verify Fix and Reopen change ticket records, and Approve or Request Changes writes a build decision. The separate database let us test those changes without touching the shared project data.

1. We started a temporary PostgreSQL instance on `127.0.0.1:55433` and created a database named `inspectflow_actor_postman`.
2. We pointed the API to that database by setting `DATABASE_URL` in the test process. The backend source, Prisma schema, and migration files needed no changes for this connection.
3. We applied the existing Prisma migrations and ran the Tester seed. The seed created a demo account, sample tickets, and two builds for review.
4. We started the API on port `5002` and ran the checks below in Postman. The ticket status and build decision changes were saved only in the local demo database. We stopped the temporary API and PostgreSQL instance after taking the screenshots.

To reproduce the setup, create a separate local database named `inspectflow_actor_postman`. Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL` to the local database connection string, for example `postgresql://USER:PASSWORD@127.0.0.1:55433/inspectflow_actor_postman?schema=public`. Replace the username, password, and port with your own local values. From the repository root, run `pnpm setup:db` to generate Prisma Client, apply the migrations, and seed the demo. Then run `pnpm dev:api`. See the [Run instructions](#run) for installing the dependencies and starting PostgreSQL. Keep the actual `.env` local.

### Running the requests

Open Postman Desktop on the same PC as the running local API. Use `http://localhost:5002` as the base URL for these checks. The local Swagger page is `http://localhost:5002/api/docs`.

1. Send `POST http://localhost:5002/auth/login` with **Body → raw → JSON**. Use the demo email and password from the Run section as the `email` and `password` values. A successful login returns `200 OK` and an `accessToken`.
2. In protected requests, choose **Authorization → Bearer Token** and paste the access token. To reproduce the unauthorized check below, create a separate request with **No Auth**.
3. Send `GET http://localhost:5002/projects` and copy the ID of **Acme Shop Reviewer Demo**. Use that ID in `GET http://localhost:5002/projects/{projectId}/tickets` and `GET http://localhost:5002/projects/{projectId}/builds`. Copy the IDs of IF-1, IF-2, Checkout build, and Catalogue build from those responses. Replace every `{...Id}` in the request table with the ID from your own database.
4. Run the checks in the order shown. For status updates and build decisions, use **Body → raw → JSON**. The writes change demo records, so use a separate seeded database for a fresh rehearsal.

| Screenshot | Postman request | Result observed |
| --- | --- | --- |
| 1 | `GET /health` | `200 OK` with `status: ok` and `database: up`. The API completed a database query. |
| 2 | `GET /projects` without a token | `401 Unauthorized`. This project list requires authentication. |
| 3 | `GET /projects/{projectId}/tickets` with the Tester token | `200 OK`. The `items` array contains the Tester's reports. |
| 4 | `POST /builds/{checkoutBuildId}/decision` with `{"decision":"APPROVED"}` | `409 Conflict`. IF-1 is a High severity ticket and has yet to be verified. |
| 5 | `POST /tickets/{if1Id}/status` with `{"status":"VERIFIED"}` | `201 Created`. IF-1 changes from `RESOLVED` to `VERIFIED`. |
| 6 | `GET /tickets/{if1Id}` | `200 OK`. A fresh read returns the saved `VERIFIED` status. |
| 7 | `GET /builds/{checkoutBuildId}/review` | `200 OK`. The response includes the current build, its review state and the `TESTER_CLIENT` role. |
| 8 | Repeat the Checkout approval request from step 4 | `201 Created`. The response records `approval.decision: APPROVED` and `approval.commitSha`. |
| 9 | `POST /tickets/{if2Id}/status` with `{"status":"OPEN","note":"Issue still visible in the QA demo"}` | `201 Created`. The separate verified report reopens as `OPEN`. |
| 10 | `POST /builds/{catalogueBuildId}/decision` with `{"decision":"CHANGES_REQUESTED","note":"Please fix the remaining catalogue display issue."}` | `201 Created`. The decision and note are recorded against Catalogue build. |

### Exact local URLs from the screenshots

These are the full URLs used in the captured Postman run. The UUIDs came from the temporary demo database. After seeding a new local database, keep the same host and route structure and substitute the IDs you get from the API in step 3 above.

| Screenshot | Method | Full local URL |
| --- | --- | --- |
| 1 · API health | GET | `http://localhost:5002/health` |
| 2 · Projects without a token | GET | `http://localhost:5002/projects` |
| 3 · My Reports | GET | `http://localhost:5002/projects/8d25c4a1-7eca-466c-a288-bd764501d910/tickets` |
| 4 · Checkout approval blocked | POST | `http://localhost:5002/builds/e15a3e6c-c24c-4d1a-96c5-b72ad32519a2/decision` |
| 5 · Verify Fix | POST | `http://localhost:5002/tickets/1b2344a8-2d8e-4d61-bb2c-865a91cdd3a1/status` |
| 6 · Read the verified ticket | GET | `http://localhost:5002/tickets/1b2344a8-2d8e-4d61-bb2c-865a91cdd3a1` |
| 7 · Checkout build review | GET | `http://localhost:5002/builds/e15a3e6c-c24c-4d1a-96c5-b72ad32519a2/review` |
| 8 · Checkout approval accepted | POST | `http://localhost:5002/builds/e15a3e6c-c24c-4d1a-96c5-b72ad32519a2/decision` |
| 9 · Reopen a separate report | POST | `http://localhost:5002/tickets/a3c0d8b6-de9a-4276-a5a2-8c3a78f8355a/status` |
| 10 · Request changes on Catalogue | POST | `http://localhost:5002/builds/b06330aa-902a-491c-9897-4760a15c95da/decision` |

### Postman screenshots

These screenshots were captured on 18 November 2026 in Postman Desktop against a separate local PostgreSQL demo database. The images show the request URL and response. The login response and Authorization header values are omitted. Open the image for the full-size view.

![Postman screenshots for Tester API checks 1 through 10](docs/postman/tester-api-checks.png)

### Backend code paths

| Behavior | Backend entry point |
| --- | --- |
| API and database health | [AppController](apps/api/src/app.controller.ts) |
| Login and token response | [AuthController](apps/api/src/modules/auth/auth.controller.ts) and [AuthService](apps/api/src/modules/auth/auth.service.ts) |
| Project list | [ProjectsController](apps/api/src/modules/projects/projects.controller.ts) |
| Report list, detail, comments, Verify Fix and Reopen | [TicketsController](apps/api/src/modules/tickets/tickets.controller.ts) and [ticket workflow rules](apps/api/src/modules/tickets/ticket-workflow.ts) |
| Build review, approval and requests for changes | [BuildsController](apps/api/src/modules/builds/builds.controller.ts) and [BuildsService](apps/api/src/modules/builds/builds.service.ts) |
| Screenshot report intake | [ReportsController](apps/api/src/modules/reports/reports.controller.ts) and [ReportsService](apps/api/src/modules/reports/reports.service.ts) |

The screenshot upload can also be exercised separately in Postman. Send `POST /widget/login` with the demo credentials and the `X-InspectFlow-Key` and `Origin` headers. Use the demo project key from [the staging configuration](apps/staging/.env.example) and the allowed local staging origin `http://localhost:4001`. Use the widget login token as the bearer token for `POST /reports` and keep the same key and origin headers. In **Body → form-data**, add a Text field `payload` with `{"title":"Demo report","description":"Checkout button does not respond.","severity":"LOW"}` and a File field `screenshot` with a demo PNG. Confirm the report appears in **My Reports**. This upload is a separate rehearsal from the captured checks above.

## Code map

- `apps/staging/src` holds the demo site's HTML, CSS and JavaScript.
- `apps/widget/src` holds capture, annotation, redaction and report submission.
- `apps/web/src/app/app` holds My Reports, ticket detail and Build Review. Dashboard styles are in `apps/web/src/app/globals.css`.
- `apps/api/src/modules/reports`, `tickets`, and `builds` hold the reviewer endpoints and rules.
- `apps/api/prisma` holds the relational schema, migrations and reviewer demo seed.

The database schema and both migrations come from the full project. All four app folders (API, dashboard, staging and widget) keep their original dependency declarations. This copy uses separate local ports and a Reviewer-specific seed. The Reviewer is the only seeded account and the API exposes reviewer routes plus shared login, profile and health.
