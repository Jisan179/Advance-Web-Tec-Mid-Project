"use client";

import Link from "next/link";
import useSWR from "swr";
import { ExternalLink, History } from "lucide-react";
import {
  BuildBadge,
  Card,
  Loading,
  SeverityBadge,
  StatusBadge,
} from "@/components/ui";
import { PreviewNotice } from "@/components/role-preview";
import { useProject } from "@/lib/project-context";
import type { Build, Paged, TicketListItem } from "@/lib/types";

export default function TesterOverview() {
  const { project } = useProject();
  const tickets = useSWR<Paged<TicketListItem>>(
    `/projects/${project.id}/tickets?limit=5`,
  );
  const builds = useSWR<Build[]>(`/projects/${project.id}/builds`);
  const base = `/app/projects/${project.id}`;
  const review = builds.data?.filter((b) => b.status === "IN_REVIEW") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <details>
          <summary className="cursor-pointer font-semibold">
            Developer overview
          </summary>
          <div className="mt-4 space-y-4">
            <PreviewNotice>
              Design preview for the project-wide dashboard.
            </PreviewNotice>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                "Open",
                "In progress",
                "Resolved, awaiting verification",
                "Verified",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-line px-3 py-2"
                >
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="mt-1 text-2xl font-semibold">—</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="space-y-2">
                <h2 className="font-semibold">Builds</h2>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"] as const
                  ).map((status) => (
                    <BuildBadge key={status} value={status} />
                  ))}
                </div>
              </section>
              <section>
                <h2 className="font-semibold">Approval history</h2>
                <p className="text-sm text-muted">
                  No project-wide results in this preview.
                </p>
              </section>
            </div>
            <h2 className="flex items-center gap-2 font-semibold">
              <History className="h-4 w-4" aria-hidden="true" /> Recent activity
            </h2>
          </div>
        </details>
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
