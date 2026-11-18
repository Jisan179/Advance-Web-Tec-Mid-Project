# Project Lead Actor Guide

This document describes the implementation, API contracts, and testing procedures for the **Project Lead (10.3)** role in InspectFlow.

---

## 1. Responsibilities & Priority Matrix

| Screen / Feature | Actions Available | Priority | Endpoints |
|---|---|---|---|
| **Project Settings** | Create projects, generate & rotate widget project key, configure allowed domains, update project details, delete project | **Essential** | `POST /projects`<br>`PATCH /projects/:id`<br>`DELETE /projects/:id`<br>`POST /projects/:id/rotate-key` |
| **Member Management** | Invite registered users, assign roles per project (`LEAD`, `DEVELOPER`, `TESTER_CLIENT`), change roles, remove members | **Essential** | `GET /projects/:id/members`<br>`POST /projects/:id/members`<br>`PATCH /projects/:id/members/:mId`<br>`DELETE /projects/:id/members/:mId` |
| **GitHub Connection** | Enter repository (`owner/repo`), set webhook secret, view webhook delivery history | **Essential** | `PATCH /projects/:id/github`<br>`GET /projects/:id/webhook-deliveries` |
| **Overview Report** | See open/resolved ticket counts, severity breakdown, build approval history, and activity audit log | **Optional** | `GET /projects/:id/overview` |

---

## 2. Security & Role Guards

- Every project-scoped route requires caller membership via `@ProjectRoles(LEAD)`.
- Route protection is enforced globally by `ProjectRolesGuard` using `ProjectAccessService.requireMember()`.
- **Sole Lead Protection**: A project cannot remove or demote its last remaining Project Lead (`assertAnotherLead()`).
- **Widget Key Security**: Only the SHA-256 hash and lookup prefix (`if_pk_...`) are stored in the database. Full keys are returned only once upon creation or rotation.

---

## 3. Endpoints Reference

### Project Settings
- `POST /projects`: Create a project. The creator becomes `LEAD`. Returns project details and the initial `widgetKey`.
- `GET /projects`: List all projects for the authenticated user.
- `GET /projects/:projectId`: Get project details.
- `PATCH /projects/:projectId`: Update project name, description, staging URL, and allowed widget origins.
- `POST /projects/:projectId/rotate-key`: Invalidate old widget key and generate a fresh key.
- `DELETE /projects/:projectId`: Permanently delete project and clean up storage artifacts.

### Member Management
- `GET /projects/:projectId/members`: List all members and assigned roles.
- `POST /projects/:projectId/members`: Invite a registered user by email with role `LEAD`, `DEVELOPER`, or `TESTER_CLIENT`.
- `PATCH /projects/:projectId/members/:membershipId`: Change a member's role.
- `DELETE /projects/:projectId/members/:membershipId`: Remove a member from the project.

### GitHub Connection
- `PATCH /projects/:projectId/github`: Connect GitHub repository and save/generate webhook secret.
- `GET /projects/:projectId/webhook-deliveries`: View recent webhook delivery attempts and verification status.

### Overview Report
- `GET /projects/:projectId/overview`: Project-wide dashboard metrics (ticket status counts, severity distribution, build counts, recent approvals, activity logs).

---

## 4. Postman Demonstration

A dedicated Postman collection and environment are provided in this directory:
- `ProjectLead.postman_collection.json`
- `ProjectLead.postman_environment.json`

### Demonstration Workflow:
1. Import collection and environment into Postman.
2. Select **InspectFlow Project Lead** environment.
3. Run **Login as Lead** to acquire Bearer JWT.
4. Run **Create Project** or **List Projects**.
5. Test **Rotate Widget Key** and **Update Allowed Domains**.
6. Run **Add Member** with role `DEVELOPER`.
7. Run **Update Member Role** and **Remove Member**.
8. Run **Connect GitHub** and inspect **Webhook Delivery History**.
9. Run **Get Project Overview** to review real-time ticket, build, and approval statistics.
