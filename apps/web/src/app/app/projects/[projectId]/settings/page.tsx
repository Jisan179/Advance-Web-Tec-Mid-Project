"use client";

import { KeyRound, RefreshCw } from "lucide-react";
import { Button, Card, Field, PageHeader, TextArea } from "@/components/ui";
import { PreviewNotice } from "@/components/role-preview";
import { useProject } from "@/lib/project-context";

export default function SettingsPage() {
  const { project } = useProject();
  return (
    <>
      <PageHeader
        title="Project settings"
        subtitle="Widget key, allowed websites, GitHub connection and project details."
      />
      <div className="space-y-6">
        <PreviewNotice>
          Project Lead and GitHub design preview. Settings are read-only in this
          demo.
        </PreviewNotice>
        <Card>
          <h2 className="mb-4 font-semibold">Details</h2>
          <fieldset disabled className="space-y-4">
            <Field label="Project name" value={project.name} />
            <TextArea label="Description" value={project.description ?? ""} />
            <Field
              label="Staging site URL"
              type="url"
              value={project.stagingUrl ?? ""}
            />
            <Button type="button" variant="primary" disabled>
              Save details
            </Button>
          </fieldset>
        </Card>
        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4" aria-hidden="true" /> Widget
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">Project key</p>
            <Button type="button" size="sm" disabled>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Rotate key
            </Button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface2 p-3 text-xs">
            {
              '<script src="…/inspectflow-widget.js" data-key="…" data-api="…" defer></script>'
            }
          </pre>
          <fieldset disabled className="mt-5 space-y-3">
            <TextArea
              label="Allowed origins (one per line)"
              placeholder="https://staging.example.com"
            />
            <Button type="button" disabled>
              Save origins
            </Button>
          </fieldset>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">GitHub connection</h2>
          <fieldset disabled className="space-y-3">
            <Field label="Repository" placeholder="owner/repository" />
            <Field label="Webhook secret (optional)" type="password" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" disabled>
                Save connection
              </Button>
              <Button type="button" disabled>
                Generate new secret
              </Button>
            </div>
          </fieldset>
          <h3 className="mb-2 mt-6 text-sm font-semibold">
            Recent webhook deliveries
          </h3>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th>Received</th>
                <th>Event</th>
                <th>Signature</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-3 text-muted">
                  No deliveries in this preview.
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card className="border-danger/40">
          <h2 className="mb-2 font-semibold text-danger">Danger zone</h2>
          <Button type="button" variant="danger" disabled>
            Delete project
          </Button>
        </Card>
      </div>
    </>
  );
}
