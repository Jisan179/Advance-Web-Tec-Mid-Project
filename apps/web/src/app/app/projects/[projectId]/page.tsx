"use client";

import Link from "next/link";
import useSWR from "swr";
import { CheckCircle2, Clock, ExternalLink, History, ShieldAlert } from "lucide-react";
import {
  Badge,
  BuildBadge,
  Card,
  Loading,
  SeverityBadge,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useProject } from "@/lib/project-context";
import type { Build, Paged, TicketListItem } from "@/lib/types";

interface ProjectOverviewData {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    verified: number;
    bySeverity: Record<string, number>;
  };
  builds: Record<string, number>;
  approvals: Array<{
    id: string;
    decision: "APPROVED" | "CHANGES_REQUESTED";
    note: string | null;
    commitSha: string;
    decidedAt: string;
    user: { name: string };
    build: { name: string; branch: string };
  }>;
  activity: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: { name: string } | null;
  }>;
}

export default function ProjectOverviewPage() {
  const { project, role } = useProject();
  const overview = useSWR<ProjectOverviewData>(`/projects/${project.id}/overview`);
  const tickets = useSWR<Paged<TicketListItem>>(
    `/projects/${project.id}/tickets?limit=5`,
  );
  const builds = useSWR<Build[]>(`/projects/${project.id}/builds`);
  const base = `/app/projects/${project.id}`;
  const review = builds.data?.filter((b) => b.status === "IN_REVIEW") ?? [];

  return (
    <div className="space-y-6">
      {/* Project Lead & Developer Overview Card */}
      <Card>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-semibold">Project overview</h2>
            <p className="text-xs text-muted">Real-time status across tickets, builds, and audit logs.</p>
          </div>
          <span className="text-xs text-muted">Role: <strong>{role}</strong></span>
        </div>

        {overview.isLoading && (
          <div className="py-6">
            <Loading label="Loading overview metrics..." />
          </div>
        )}

        {overview.data && (
          <div className="mt-4 space-y-5">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-line bg-surface2 px-3 py-2">
                <dt className="text-xs font-medium text-muted uppercase">Open Tickets</dt>
                <dd className="mt-1 text-2xl font-bold">{overview.data.tickets.open}</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface2 px-3 py-2">
                <dt className="text-xs font-medium text-muted uppercase">In Progress</dt>
                <dd className="mt-1 text-2xl font-bold">{overview.data.tickets.inProgress}</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface2 px-3 py-2">
                <dt className="text-xs font-medium text-muted uppercase">Resolved</dt>
                <dd className="mt-1 text-2xl font-bold text-ok">{overview.data.tickets.resolved}</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface2 px-3 py-2">
                <dt className="text-xs font-medium text-muted uppercase">Verified</dt>
                <dd className="mt-1 text-2xl font-bold text-brand">{overview.data.tickets.verified}</dd>
              </div>
            </dl>

            {/* Severity Breakdown */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Tickets by Severity</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(overview.data.tickets.bySeverity).map(([sev, count]) => (
                  <span key={sev} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs">
                    <span className="font-medium">{sev}:</span>
                    <strong className="text-ink">{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Builds by Status */}
              <section className="space-y-2 rounded-lg border border-line p-3">
                <h3 className="font-semibold text-sm">Build status summary</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(overview.data.builds).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <BuildBadge value={status as any} />
                      <span className="text-xs font-semibold">({count})</span>
                    </div>
                  ))}
                  {Object.keys(overview.data.builds).length === 0 && (
                    <p className="text-xs text-muted">No builds registered yet.</p>
                  )}
                </div>
              </section>

              {/* Approval History */}
              <section className="space-y-2 rounded-lg border border-line p-3">
                <h3 className="font-semibold text-sm">Recent approvals</h3>
                {overview.data.approvals.length === 0 ? (
                  <p className="text-xs text-muted">No approval decisions recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-line text-xs">
                    {overview.data.approvals.slice(0, 3).map((a) => (
                      <li key={a.id} className="py-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{a.build.name}</span>
                          <span className="text-muted"> by {a.user.name}</span>
                        </div>
                        <Badge tone={a.decision === "APPROVED" ? "ok" : "warn"}>{a.decision}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Recent Activity Log */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <History className="h-4 w-4 text-muted" aria-hidden="true" /> Recent activity log
              </h3>
              {overview.data.activity.length === 0 ? (
                <p className="text-xs text-muted">No recent activity.</p>
              ) : (
                <ul className="divide-y divide-line text-xs">
                  {overview.data.activity.slice(0, 5).map((act) => (
                    <li key={act.id} className="flex items-center justify-between py-1.5">
                      <span>
                        <code className="rounded bg-surface2 px-1 py-0.5 font-mono text-[11px]">{act.action}</code>
                        {act.actor && <span className="text-muted"> by {act.actor.name}</span>}
                      </span>
                      <span className="text-muted">{formatDateTime(act.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">How to report a problem</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>
            Open the staging website
            {project.stagingUrl && (
              <>
                {" "}
                (
                <a
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                  href={project.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.stagingUrl}
                  <ExternalLink
                    className="h-3 w-3"
                    aria-label="opens in a new tab"
                  />
                </a>
                )
              </>
            )}
            .
          </li>
          <li>
            Click the <strong className="text-ink">Report issue</strong> button
            in the corner and sign in with this account.
          </li>
          <li>
            Draw on the screenshot, blur private data, describe the problem and
            send.
          </li>
        </ol>
      </Card>

      {review.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">Builds waiting for your review</h2>
          <ul className="space-y-2">
            {review.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-2 text-sm"
              >
                <span>
                  <strong>{b.name}</strong>{" "}
                  <span className="text-muted">({b.branch})</span>
                </span>
                <Link
                  href={`/app/builds/${b.id}`}
                  className="font-medium text-brand hover:underline"
                >
                  Review build
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">My latest reports</h2>
          <Link
            href={`${base}/tickets`}
            className="text-sm font-medium text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        {tickets.isLoading && <Loading />}
        {tickets.data?.items.length === 0 && (
          <p className="text-sm text-muted">
            You have not reported anything yet.
          </p>
        )}
        <ul className="divide-y divide-line">
          {tickets.data?.items.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <Link
                href={`/app/tickets/${t.id}`}
                className="font-medium hover:text-brand"
              >
                IF-{t.number} {t.title}
              </Link>
              <span className="flex gap-2">
                <SeverityBadge value={t.severity} />
                <StatusBadge value={t.status} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
