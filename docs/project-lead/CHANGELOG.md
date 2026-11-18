# Project Lead (10.3) — Changelog

## v1.0.0 — Initial release

### Backend (NestJS / `apps/api`)
- **ProjectsService**: create, read, update, delete projects
- **Widget key**: auto-generated on project creation; `POST /projects/:id/rotate-key` to rotate
- **Members API**: invite by email, change role, remove member; LEAD cannot remove themselves
- **Overview API**: ticket counts by status, build counts by status, recent approvals, activity log
- **Allowed origins**: stored and validated per project for widget embedding

### Frontend (Next.js / `apps/web`)
- **Projects list page**: grid of project cards with role badge; "New project" modal shows widget key once
- **Project layout**: shared nav tabs (Overview, Tickets, Builds, Members, Settings); Settings visible to LEAD only
- **Overview page**: EngineerOverview (stats cards, build summary, approval history, activity feed); TesterOverview (how-to guide, build review queue, latest reports)
- **Members page**: member table with inline role dropdown, add-member modal, remove-with-confirmation modal; self-identification via `useAuth`
- **Settings page**: DetailsCard (name, description, staging URL), WidgetCard (key rotation, embed snippet, allowed origins), GithubCard (repo connection, webhook deliveries), DangerCard (delete project)

### Auth & API client
- Token refresh with deduplication (single refresh for parallel 401s)
- Auto-redirect to `/login` when refresh fails
- `session` helpers for `localStorage` access with SSR safety
