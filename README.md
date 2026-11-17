
# Inspect Flow 

A standalone local InspectFlow demo for the **Tester / Client Reviewer** actor. Sign in, report an issue from the staging site, annotate a screenshot, view and comment on your own reports, verify or reopen a fix, and approve a build or request changes.

## Run

This branch demonstrates the Tester / Client Reviewer locally. Cloning the repository downloads code and screenshots. It does not copy a running API, PostgreSQL server, database records, or your private `.env` file.

### First setup on your laptop

Use Node.js 22 (see `.nvmrc`), the pnpm version pinned in `package.json` (`12.16.1`), and PostgreSQL. The commands below are for the VS Code PowerShell terminal opened at the cloned repository root.

1. Select the `test` branch. Check with `git branch --show-current`. If your working files are saved and you are on another branch, use `git switch test`. On a fresh clone that has only the remote branch, use `git switch --track origin/test` instead.
2. Install the project dependencies.

   ```powershell
   pnpm install --frozen-lockfile
   ```

3. Choose **one** local database option.

   **Option A — included Docker database.** Install and start Docker Desktop first. From the repository root, run

   ```powershell
   docker compose up -d postgres
   docker compose exec postgres pg_isready -U inspectflow_actor -d inspectflow_actor
   ```

   Wait for `accepting connections`. The checked-in Compose file maps the laptop's port `5434` to PostgreSQL's container port `5432`. It creates the separate database `inspectflow_actor` with the demo user and password in `.env.example`.

   **Option B — PostgreSQL already installed.** Start that PostgreSQL service and create a new empty database called `inspectflow_actor` using pgAdmin or psql. Use its actual local username, password and port in `DATABASE_URL`. Do not run the Docker commands for this option. The schema and demo data are installed in step 5.

4. Create the API environment file only if it does not already exist.

   ```powershell
   if (-not (Test-Path 'apps/api/.env')) {
     Copy-Item 'apps/api/.env.example' 'apps/api/.env'
   }
   ```

   Open `apps/api/.env`. For Option A, the database line must match the included Compose configuration

   ```dotenv
   DATABASE_URL=postgresql://inspectflow_actor:inspectflow_actor_demo@127.0.0.1:5434/inspectflow_actor
   PORT=5002
   STORAGE_DRIVER=local
   ```

   For Option B, replace the database connection details with your own local values. Keep all the other example settings and set local `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `COOKIE_SECRET` values. Keep `.env` on your laptop and out of Git. These demo database credentials are only for the local Compose setup.

5. Generate Prisma Client, apply the existing migrations, and seed the Tester account and fixtures.

   ```powershell
   pnpm setup:db
   ```

   Continue only when the command succeeds. The seed accepts a separate database named `inspectflow_actor` or `inspectflow_actor_...`. It creates the Tester account and starting report/build states. It does not reset existing ticket states or build decisions.

6. Start the backend and **leave this terminal running**.

   ```powershell
   pnpm dev:api
   ```

   Wait for `InspectFlow API listening on port 5002`. In Postman Desktop, send `GET http://localhost:5002/health` with No Auth. Continue only after it returns HTTP `200` with `"database": "up"`.

### Each later demo session

Start your local PostgreSQL service again (Option A uses `docker compose up -d postgres`), run `pnpm dev:api`, then log in again in Postman for a fresh access token. You do not need to reinstall dependencies or reapply the seed every time. Keep both PostgreSQL and the API running throughout the demonstration.

`localhost` means the computer where Postman is running. On your laptop, it reaches your laptop's API. These addresses are not public deployment links. The API binds to `127.0.0.1`; if `localhost` resolves to `::1` and fails, use `http://127.0.0.1:5002` consistently for the API requests.

### Which local URL is used where?

| Service | Local URL | Open with | Required for the ten Postman checks? |
| --- | --- | --- | --- |
| API health | `http://localhost:5002/health` | Postman, GET | Yes, API and database must be running |
| API documentation | `http://localhost:5002/api/docs` | Browser, Swagger UI | Optional reference |
| Tester dashboard | `http://localhost:3001/login` | Browser | Optional UI demonstration |
| Staging shop and reporting widget | `http://localhost:4001/` | Browser | Optional screenshot submission demonstration |

The dashboard and staging URLs serve web pages. For these ten backend checks, Postman sends requests to port **5002**. To also demonstrate the UI, follow each frontend's `.env.example`, and run `pnpm dev:web` and `pnpm dev:staging` in separate terminals. Alternatively, `pnpm dev` starts API, dashboard and staging together; do not start a second API on the same port.

The seeded local account is `tester@inspectflow.demo` with fixture password `Demo@12345`, unless you intentionally set a different `DEMO_PASSWORD` when first seeding.

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

### Scope and screenshot evidence

The ten images below are the original Postman captures from 18 November 2026 (Bangladesh time), saved individually as PNG. Each image keeps its original dimensions, without a combined strip or resizing. The source captures were JPEG-encoded despite their .png filenames; they have been converted to actual PNG without changing the image content or adding further JPEG compression. Conversion cannot restore detail already lost in the original capture. Click **Open original PNG** under any check for the full-size image. Some screenshot timestamps are UTC and therefore show 17 November.

These are records of the earlier local run, not a claim that a server is currently running. That run used a temporary PostgreSQL instance at `127.0.0.1:55433`, database `inspectflow_actor_postman`, and API port `5002`. Both temporary processes were stopped after the captures. **Port 55433 is historical, not the port to copy for the Docker setup above, which uses 5434.**

The shared full-project database was outside the scope of the Tester checks. Verify, Reopen and build decisions write data, so we used a separate local database to keep the original project's data untouched. We applied the existing schema, migrations and Tester seed, and set `DATABASE_URL` in the test process. The backend source, schema and migration files required no change for that connection.

The original images also include Postman's earlier History entries. Follow the selected request and the instructions under each check; unrelated History entries are not part of this Tester demonstration. The images do not display access-token values.

### Before sending the ten requests

Complete [First setup on your laptop](#first-setup-on-your-laptop) and confirm the health response. Use Postman Desktop on the same computer as the running backend.

**A. Log in for a fresh dashboard token**

Choose method **POST** and paste only this URL into the address field

```text
http://localhost:5002/auth/login
```

Choose **No Auth**, then **Body → raw → JSON**. Send

```json
{
  "email": "tester@inspectflow.demo",
  "password": "Demo@12345"
}
```

Expect `200 OK`. Copy the response's `accessToken`. For protected requests below, choose **Authorization → Bearer Token** and paste only the token value. Do not paste the entire JSON or add a second `Bearer` prefix. The example access-token lifetime is 15 minutes; log in again if it expires. Keep the token out of screenshots and commits.

**B. Get the IDs from your own database**

Create/select a Postman environment named `Tester Local`. Add the following variables using the values returned by your local API. Use their local values and keep this environment selected while sending requests.

| Variable | How to obtain its value |
| --- | --- |
| `projectId` | Send authenticated `GET http://localhost:5002/projects`. Find **Acme Shop Reviewer Demo** and copy its `id`. |
| `if1Id` | Send authenticated `GET http://localhost:5002/projects/{{projectId}}/tickets`. In `items`, find ticket `number: 1` (Checkout button fix ready for verification) and copy its `id`. |
| `if2Id` | From the same ticket list, find ticket `number: 2` (Footer typo still visible) and copy its `id`. |
| `checkoutBuildId` | Send authenticated `GET http://localhost:5002/projects/{{projectId}}/builds`. Find **Checkout build** and copy its `id`. |
| `catalogueBuildId` | From the same build list, find **Catalogue build** and copy its `id`. |

`{{projectId}}` and the other double-brace names are Postman variables. They must have values before sending. If you prefer not to use an environment, replace the whole `{{...}}` section manually with the returned ID, leaving no braces. Do not type `IF-1` as a ticket ID; the route expects the UUID from its `id` field.

Project and ticket IDs are generated in each new database, so copying their old screenshot UUIDs can fail. The current seed explicitly fixes the two build IDs, but reading them from the API also checks that the builds exist in your database.

**C. Check the starting states**

For the exact sequence below, IF-1 must be `RESOLVED`, IF-2 must be `VERIFIED`, and both builds must be `IN_REVIEW`. Run steps 1–10 in order. Steps 5, 8, 9 and 10 change database records. Repeating them after a successful rehearsal may correctly return a conflict. Running `pnpm setup:db` again preserves those records; it does not reset them. For an identical new rehearsal, create a separate empty local database such as `inspectflow_actor_rehearsal2`, point only this demo's `DATABASE_URL` to it, run `pnpm setup:db`, restart the API, and get its IDs and a new token.

### Ten checks with individual screenshots

Choose the HTTP method separately in Postman. Paste the URL without a `GET` or `POST` prefix. For GET requests, leave Body empty. For POST requests below, choose **Body → raw → JSON**, which uses `Content-Type: application/json`.

#### 01. API and database health

**Method** `GET` · **Authorization** No Auth

**URL to use on your laptop**

```text
http://localhost:5002/health
```

**Expected response** `200 OK`. The response has `status: "ok"` and `database: "up"`. The health handler performs a database query.

![Check 01 — API and database health](docs/postman/01-api-health.png)

[Open original PNG](docs/postman/01-api-health.png)

#### 02. Authentication is required

**Method** `GET` · **Authorization** No Auth

**URL to use on your laptop**

```text
http://localhost:5002/projects
```

**Expected response** `401 Unauthorized`. This is an intentional rejection. It proves an unauthenticated request cannot list projects. Switch back to Bearer Token for the remaining checks.

![Check 02 — Authentication is required](docs/postman/02-projects-without-token.png)

[Open original PNG](docs/postman/02-projects-without-token.png)

#### 03. List the Tester's reports

**Method** `GET` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/projects/{{projectId}}/tickets
```

**Expected response** `200 OK`. The `items` array contains the reports visible to the Tester. Find IF-1 and IF-2 by their `number` fields.

![Check 03 — List the Tester's reports](docs/postman/03-my-reports.png)

[Open original PNG](docs/postman/03-my-reports.png)

#### 04. Block approval before verification

**Method** `POST` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/builds/{{checkoutBuildId}}/decision
```

**Body → raw → JSON**

```json
{
  "decision": "APPROVED"
}
```

**Expected response** `409 Conflict`. With Checkout build still `IN_REVIEW`, IF-1 has High severity and is not verified. The response explains that blocking tickets are not verified. This rejection is the expected business rule.

![Check 04 — Block approval before verification](docs/postman/04-approval-blocked.png)

[Open original PNG](docs/postman/04-approval-blocked.png)

#### 05. Verify the resolved fix

**Method** `POST` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/tickets/{{if1Id}}/status
```

**Body → raw → JSON**

```json
{
  "status": "VERIFIED"
}
```

**Expected response** `201 Created`. IF-1 changes from `RESOLVED` to `VERIFIED`. The response contains the updated ticket. This writes the ticket status in the local database.

![Check 05 — Verify the resolved fix](docs/postman/05-verify-fix.png)

[Open original PNG](docs/postman/05-verify-fix.png)

#### 06. Read the saved ticket again

**Method** `GET` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/tickets/{{if1Id}}
```

**Expected response** `200 OK`. A separate read returns `status: "VERIFIED"`, confirming the update is persisted.

![Check 06 — Read the saved ticket again](docs/postman/06-ticket-reread.png)

[Open original PNG](docs/postman/06-ticket-reread.png)

#### 07. Review Checkout build

**Method** `GET` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/builds/{{checkoutBuildId}}/review
```

**Expected response** `200 OK`. The response includes the build and `myRole: "TESTER_CLIENT"`. Inspect the full response for `blockingTickets`, `canApprove` and `canDecide`. After verification, no blocking ticket remains for the seeded Checkout build.

![Check 07 — Review Checkout build](docs/postman/07-build-review.png)

[Open original PNG](docs/postman/07-build-review.png)

#### 08. Approve the verified build

**Method** `POST` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/builds/{{checkoutBuildId}}/decision
```

**Body → raw → JSON**

```json
{
  "decision": "APPROVED"
}
```

**Expected response** `201 Created`. The response records `approval.decision: "APPROVED"` and `approval.commitSha`. The build changes to `APPROVED`. This is the same request as check 4 after satisfying the verification rule.

![Check 08 — Approve the verified build](docs/postman/08-build-approved.png)

[Open original PNG](docs/postman/08-build-approved.png)

#### 09. Reopen the separate verified report

**Method** `POST` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/tickets/{{if2Id}}/status
```

**Body → raw → JSON**

```json
{
  "status": "OPEN",
  "note": "Issue still visible in the QA demo"
}
```

**Expected response** `201 Created`. IF-2 changes from `VERIFIED` to `OPEN`. Use IF-2 here so the Checkout approval example remains independent.

![Check 09 — Reopen the separate verified report](docs/postman/09-reopen-ticket.png)

[Open original PNG](docs/postman/09-reopen-ticket.png)

#### 10. Request changes on Catalogue build

**Method** `POST` · **Authorization** Bearer Token

**URL to use on your laptop**

```text
http://localhost:5002/builds/{{catalogueBuildId}}/decision
```

**Body → raw → JSON**

```json
{
  "decision": "CHANGES_REQUESTED",
  "note": "Please fix the remaining catalogue display issue."
}
```

**Expected response** `201 Created`. The response records the `CHANGES_REQUESTED` decision, note and commit SHA. The build changes to `REJECTED`. A note is required, and this build must still be `IN_REVIEW`.

![Check 10 — Request changes on Catalogue build](docs/postman/10-request-changes.png)

[Open original PNG](docs/postman/10-request-changes.png)

### If a URL does not work

| Symptom | What to check |
| --- | --- |
| `Could not send request`, `ECONNREFUSED`, or no response | Start PostgreSQL and `pnpm dev:api` on the same laptop. Leave the terminal open. Confirm the startup message and port 5002. If the error mentions `::1`, use `127.0.0.1` instead of `localhost`. A screenshot or GitHub push does not start a server. |
| API exits during startup / cannot connect to database | Read the terminal error. Match `.env` credentials, database name and port to the running local PostgreSQL service. The included Docker setup uses 5434, not the historical screenshot database port 55433. |
| `docker` is not recognized | Install/start Docker Desktop for Option A, or use installed PostgreSQL via Option B. Docker is not installed by `pnpm install`. |
| `pnpm` is not recognized | Install the pnpm version pinned in `package.json`, then reopen your terminal and check `pnpm --version`. |
| `/health` works but a protected request returns 401 | Log in again and set Bearer Token. The 401 in check 2 is intentional. |
| 400 / invalid UUID | Fill the selected Postman environment variables or replace them manually with actual returned UUIDs. Check JSON body and Content-Type. |
| 404 / record not found | Read project, ticket and build IDs from this laptop's database. Do not reuse another database's project/ticket IDs. Also check the method and path. |
| 403 | Check that the token belongs to the seeded Tester account and the record belongs to its project. |
| 409 on build approval | Before verification, this is expected. After a previous approval/rejection, the build is no longer `IN_REVIEW`. Inspect its current state instead of repeatedly sending the same write. |
| Ticket status change rejected | Check the current state. The Tester can verify a `RESOLVED` ticket, or reopen a `RESOLVED`/`VERIFIED` ticket. The Tester cannot resolve an `OPEN` ticket in this actor-only demo. |
| HTML appears instead of API JSON | Use API port 5002. Port 3001 is the dashboard, port 4001 is the staging site, and `/api/docs` is the Swagger web page. |
| 429 | Wait for the rate-limit window before retrying, especially repeated login attempts. |

If asking for help, include the HTTP method, URL, status/error text and API terminal error. Omit passwords and bearer tokens.

### Capturing your laptop demonstration

Once the local setup works, repeat the ten checks in order against a fresh rehearsal database. For each image, keep the request method and URL, HTTP status and relevant response JSON visible. For POST requests, also show the JSON body when the window has enough space. Use a readable Postman window size, save each check as its own PNG, and avoid showing login-token responses or Authorization values. GitHub may fit the preview to the page width; **Open original PNG** opens the individual image.

### After the team merges into main

The deployed full-project demonstration is a later task. Merging into `main` alone does not configure Vercel, Render or Supabase. When the integrated app is deployed, configure its frontend and API environment values, database connection/migrations, storage and permitted origins for those services. Then use the deployed API base URL, log in to that environment, read its record IDs and capture a separate set of deployment screenshots. The screenshots in this section document only the local Tester demonstration.

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
