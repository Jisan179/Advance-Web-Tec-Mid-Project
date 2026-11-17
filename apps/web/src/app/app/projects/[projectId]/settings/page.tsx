"use client";

import { useState } from "react";
import useSWR from "swr";
import { KeyRound, RefreshCw } from "lucide-react";
import { Badge, Button, Card, ErrorState, Field, Loading, PageHeader, TextArea, useToast } from "@/components/ui";
import { PreviewNotice } from "@/components/role-preview";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useProject } from "@/lib/project-context";
import type { Paged } from "@/lib/types";

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
          Project details and widget settings are read-only in this demo.
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
        {project.myRole !== "TESTER_CLIENT" && <GithubCard key={project.id} />}
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

interface WebhookDelivery {
  id: string;
  event: string;
  processedAt: string;
  signatureValid: boolean;
  outcome: string;
}

function GithubCard() {
  const { project, role, reload } = useProject();
  const toast = useToast();
  const [repo, setRepo] = useState(project.githubRepo ?? "");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ webhookUrl: string; webhookSecret: string | null } | null>(null);
  const deliveries = useSWR<Paged<WebhookDelivery>>(`/projects/${project.id}/webhook-deliveries?limit=10`);

  async function connect(e: React.FormEvent, regenerate = false) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await api<{ webhookUrl: string; webhookSecret: string | null }>(`/projects/${project.id}/github`, {
        method: "PATCH",
        body: { githubRepo: repo, webhookSecret: regenerate ? undefined : secret || undefined, regenerateSecret: regenerate || undefined },
      });
      setResult(res); setSecret("");
      toast("GitHub repository saved");
      reload();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold">GitHub connection</h2>
      <p className="mb-4 text-sm text-muted">When a pull request linked to a ticket is merged, GitHub notifies InspectFlow and the ticket moves to Resolved.</p>
      {role === "LEAD" && (
        <form onSubmit={(e) => connect(e)} className="space-y-3">
          <Field label="Repository" placeholder="owner/repository" value={repo} onChange={(e) => setRepo(e.target.value)} required />
          <Field label="Webhook secret (optional)" type="password" autoComplete="new-password" value={secret} onChange={(e) => setSecret(e.target.value)}
            hint={project.hasWebhookSecret ? "A secret is already stored. Leave empty to keep it." : "Leave empty to generate a strong secret for you."} />
          {error && <p className="rounded-lg bg-dangersoft px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={busy}>Save connection</Button>
            {project.hasWebhookSecret && <Button type="button" disabled={busy} onClick={(e) => connect(e, true)}>Generate new secret</Button>}
          </div>
        </form>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-line bg-surface2 p-3 text-sm">
          <p className="font-medium">Add this webhook in GitHub: Settings, Webhooks, Add webhook</p>
          <ul className="mt-2 space-y-1">
            <li>Payload URL: <code className="break-all rounded bg-surface px-1.5">{result.webhookUrl}</code></li>
            <li>Content type: <code className="rounded bg-surface px-1.5">application/json</code></li>
            <li>Events: <strong>Pull requests</strong></li>
            {result.webhookSecret && <li>Secret (shown once): <code className="break-all rounded bg-surface px-1.5">{result.webhookSecret}</code></li>}
          </ul>
        </div>
      )}

      <h3 className="mb-2 mt-6 text-sm font-semibold">Recent webhook deliveries</h3>
      {deliveries.isLoading && <Loading />}
      {deliveries.error && <ErrorState error={deliveries.error} retry={() => void deliveries.mutate()} />}
      {deliveries.data?.items.length === 0 && <p className="text-sm text-muted">No deliveries yet.</p>}
      {deliveries.data && deliveries.data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-2">Received</th><th>Event</th><th>Signature</th><th>Outcome</th></tr></thead>
            <tbody className="divide-y divide-line">
              {deliveries.data.items.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 pr-3 text-muted">{formatDateTime(d.processedAt)}</td>
                  <td className="pr-3">{d.event}</td>
                  <td className="pr-3"><Badge tone={d.signatureValid ? "ok" : "danger"}>{d.signatureValid ? "Valid" : "Rejected"}</Badge></td>
                  <td className="text-muted">{d.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
