## GitHub Actor: Merged Pull Request Auto-Resolves Tickets

**Owner:** SK Asif Ahmed Prethibi
**Branch:** `github-test`
**Requirements covered:** FR-11, FR-27, FR-28, FR-29, NFR-06

### What it does
GitHub is the only actor that changes a ticket without a human. A developer links a
ticket to a branch or pull request (PR). When that PR is merged, GitHub sends a
signed webhook to InspectFlow and the ticket moves from `OPEN` / `IN_PROGRESS` to
`RESOLVED` automatically. The change is recorded in the activity log with no human actor.

### How it works
1. A Lead connects a repository (`owner/repo`) in **Project Settings → GitHub connection**.
   InspectFlow generates a webhook secret and shows it once.
2. In GitHub: **Settings → Webhooks → Add webhook**. Use the payload URL shown in the
   dashboard, content type `application/json`, event **Pull requests**, and the secret.
3. A developer links a ticket to a branch or PR number (`POST /tickets/:ticketId/link`).
4. When a PR is opened or updated, the PR number is attached to tickets on that branch.
5. When the PR is merged, linked tickets in that project become `RESOLVED`.
   A PR closed without merging changes nothing.

### Security and reliability
| Feature | How it is done |
|---|---|
| Authentication | HMAC-SHA256 of the **raw request body**, compared with `X-Hub-Signature-256` |
| Timing attacks | Constant-time comparison (`timingSafeEqual`) |
| No information leak | Unknown repository and bad signature return the same `401` |
| Replay protection | Unique `X-GitHub-Delivery` id; a duplicate returns `duplicate: true` and applies nothing (NFR-06) |
| Atomic processing | Delivery record and ticket updates run in one database transaction |
| Project isolation | A merge only affects tickets of the matching project |
| Secret handling | Never returned by the API after creation (`hasWebhookSecret` only) |
| Audit trail | `github.connected` and `ticket.auto_resolved` activity entries |

### Files
| File | Purpose |
|---|---|
| `apps/api/src/modules/github/github.module.ts` | Module registration |
| `apps/api/src/modules/github/github.controller.ts` | Public `POST /webhooks/github` endpoint |
| `apps/api/src/modules/github/github.service.ts` | Signature check, replay protection, event handling |
| `apps/api/src/modules/github/github-signature.spec.ts` | Unit tests for signature verification |
| `apps/api/test/github.e2e-spec.ts` | End-to-end tests for the webhook flow |
| `apps/api/src/modules/projects/` | Connect repository, delivery history |
| `apps/api/src/modules/tickets/` | Link ticket to branch or PR |
| `apps/api/prisma/schema.prisma` | `githubRepo`, `webhookSecret`, `WebhookDelivery` |
| `apps/web/.../projects/[projectId]/settings/page.tsx` | GitHub connection card |

### Run the tests
```bash
cd apps/api
npm run test               # unit tests (signature)
npm run test:e2e           # end-to-end tests
```

### Known limitation
The tests send correctly signed requests built by the test code. The flow has not yet
been verified against a real GitHub repository delivery.
