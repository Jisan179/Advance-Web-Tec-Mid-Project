"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Copy, Check, FolderKanban, Plus } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  Modal,
  PageHeader,
  RoleBadge,
  TextArea,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { Project } from "@/lib/types";

interface CreatedProjectResponse extends Project {
  widgetKey?: string;
}

export default function ProjectsPage() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>("/projects");
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newWidgetKey, setNewWidgetKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setStagingUrl("");
    setAllowedOrigins("");
    setNewWidgetKey(null);
    setCopied(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const origins = allowedOrigins
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      const created = await api<CreatedProjectResponse>("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          stagingUrl: stagingUrl.trim() || undefined,
          allowedOrigins: origins.length ? origins : undefined,
        }),
      });

      toast("Project created successfully", "ok");
      mutate();
      if (created.widgetKey) {
        setNewWidgetKey(created.widgetKey);
      } else {
        setIsOpen(false);
        resetForm();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create project", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    toast("Widget key copied to clipboard", "ok");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Projects available for your review and management."
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </Button>
        }
      />

      <Modal
        open={isOpen}
        title={newWidgetKey ? "Project Created!" : "Create New Project"}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
      >
        {newWidgetKey ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Your project has been created. Copy your widget project key now; for security reasons, it cannot be shown again.
            </p>
            <div className="rounded-lg border border-line bg-surface2 p-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Widget Key</span>
              <div className="mt-1 flex items-center justify-between gap-2 font-mono text-sm break-all">
                <span>{newWidgetKey}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => copyKey(newWidgetKey)}
                >
                  {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <Field
              label="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Platform"
              required
            />
            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the project"
            />
            <Field
              label="Staging site URL (optional)"
              type="url"
              value={stagingUrl}
              onChange={(e) => setStagingUrl(e.target.value)}
              placeholder="https://staging.example.com"
            />
            <TextArea
              label="Allowed widget origins (one per line)"
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
              placeholder="https://staging.example.com&#10;http://localhost:3000"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Create project
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {isLoading && <Loading />}
      {error && <ErrorState error={error} retry={() => mutate()} />}
      {data && data.length === 0 && (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="No projects yet"
          text="Start by creating a new project with the button above."
        />
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
