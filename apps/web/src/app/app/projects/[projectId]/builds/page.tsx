"use client";

import Link from "next/link";
import useSWR from "swr";
import { ExternalLink, GitBranch, PackagePlus, Rocket } from "lucide-react";
import {
  Badge,
  BuildBadge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  PageHeader,
} from "@/components/ui";
import { PreviewDialog } from "@/components/role-preview";
import { formatDateTime } from "@/lib/format";
import { useProject } from "@/lib/project-context";
import type { Build } from "@/lib/types";

export default function BuildsPage() {
  const { project } = useProject();
  const { data, error, isLoading, mutate } = useSWR<Build[]>(
    `/projects/${project.id}/builds`,
  );
  return (
    <>
      <PageHeader
        title="Builds shared with you"
        subtitle="Review each build and approve it or request changes."
        actions={
          <PreviewDialog
            title="Register a staging build"
            label="Register build"
            icon={<PackagePlus className="h-4 w-4" aria-hidden="true" />}
          >
            <Field label="Build name" />
            <Field label="Branch" />
            <Field label="Commit SHA" />
            <Field
              label="Preview URL"
              type="url"
              value={project.stagingUrl ?? ""}
              readOnly
            />
          </PreviewDialog>
        }
      />
      {isLoading && <Loading />}
      {error && <ErrorState error={error} retry={() => mutate()} />}
      {data && data.length === 0 && (
        <EmptyState
          icon={<Rocket className="h-8 w-8" />}
          title="Nothing to review yet"
          text="Builds appear here when ready for review."
        />
      )}

      <div className="space-y-3">
        {data?.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{b.name}</h2>
                  <BuildBadge value={b.status} />
                  {(b.blockingTickets ?? 0) > 0 && (
                    <Badge tone="danger">{b.blockingTickets} blocking</Badge>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="h-4 w-4" aria-hidden="true" />
                    {b.branch}
                  </span>
                  <span>
                    commit{" "}
                    <code className="rounded bg-surface2 px-1.5 text-xs text-ink">
                      {b.commitSha.slice(0, 10)}
                    </code>
                  </span>
                  <span>{formatDateTime(b.createdAt)}</span>
                </p>
                {b.previewUrl && (
                  <a
                    href={b.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-brand hover:underline"
                  >
                    {b.previewUrl}{" "}
                    <ExternalLink
                      className="h-3 w-3"
                      aria-label="opens in a new tab"
                    />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled
                  title="Developer preview"
                >
                  Mark ready for review
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled
                  title="Project Lead preview"
                >
                  Delete
                </Button>
                <Link
                  href={`/app/builds/${b.id}`}
                  className="inline-flex items-center rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface2"
                >
                  {b.status === "IN_REVIEW" ? "Review and decide" : "Details"}
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
