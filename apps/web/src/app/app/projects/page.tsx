"use client";

import Link from "next/link";
import useSWR from "swr";
import { FolderKanban, Plus } from "lucide-react";
import { Card, EmptyState, ErrorState, Field, Loading, PageHeader, RoleBadge, TextArea } from "@/components/ui";
import { PreviewDialog } from "@/components/role-preview";
import { formatDay } from "@/lib/format";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>("/projects");

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Projects available for your review."
        actions={
          <PreviewDialog title="New project" label="New project" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            <Field label="Project name" />
            <TextArea label="Description (optional)" />
            <Field label="Staging site URL (optional)" type="url" placeholder="https://staging.example.com" />
            <Field label="Allowed widget origins" placeholder="https://staging.example.com" />
          </PreviewDialog>
        }
      />
      {isLoading && <Loading />}
      {error && <ErrorState error={error} retry={() => mutate()} />}
      {data && data.length === 0 && (
        <EmptyState icon={<FolderKanban className="h-8 w-8" />} title="No projects yet"
          text="Start by loading the reviewer demo project." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <Link key={p.id} href={`/app/projects/${p.id}`} className="block rounded-xl focus-visible:outline-offset-4">
            <Card className="h-full transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                <RoleBadge value={p.myRole} />
              </div>
              <p className="line-clamp-2 min-h-10 text-sm text-muted">{p.description || "No description"}</p>
              <p className="mt-3 text-xs text-muted">Created {formatDay(p.createdAt)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
