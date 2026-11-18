"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Check, Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, Card, ErrorState, Field, Loading, Modal, PageHeader, TextArea, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useProject } from "@/lib/project-context";
import type { Paged } from "@/lib/types";

export default function SettingsPage() {
  const { project, role, reload } = useProject();
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [stagingUrl, setStagingUrl] = useState(project.stagingUrl ?? "");
  const [origins, setOrigins] = useState((project.allowedOrigins ?? []).join("\n"));
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingOrigins, setSavingOrigins] = useState(false);

  const [rotatingKey, setRotatingKey] = useState(false);
  const [rotatedKey, setRotatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLead = role === "LEAD";

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingDetails(true);
    try {
      await api(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          stagingUrl: stagingUrl.trim() || undefined,
        }),
      });
      toast("Project details saved successfully", "ok");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSaveOrigins(e: React.FormEvent) {
    e.preventDefault();
    setSavingOrigins(true);
    try {
      const allowedOriginsList = origins
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      await api(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedOrigins: allowedOriginsList,
        }),
      });
      toast("Allowed origins updated", "ok");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingOrigins(false);
    }
  }

  async function handleRotateKey() {
    setRotatingKey(true);
    try {
      const res = await api<{ widgetKey: string }>(`/projects/${project.id}/rotate-key`, {
        method: "POST",
      });
      setRotatedKey(res.widgetKey);
      toast("Widget key rotated successfully", "ok");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setRotatingKey(false);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast("Widget key copied to clipboard", "ok");
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function handleDeleteProject() {
    setDeleting(true);
    try {
      await api(`/projects/${project.id}`, { method: "DELETE" });
      toast("Project deleted", "ok");
      router.push("/app/projects");
    } catch (err) {
      toast((err as Error).message, "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Project settings"
        subtitle="Widget key, allowed websites, GitHub connection and project details."
      />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold">Details</h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <Field
              label="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isLead}
              required
            />
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isLead}
            />
            <Field
              label="Staging site URL"
              type="url"
              value={stagingUrl}
              onChange={(e) => setStagingUrl(e.target.value)}
              disabled={!isLead}
              placeholder="https://staging.example.com"
            />
            {isLead && (
              <Button type="submit" variant="primary" loading={savingDetails}>
                Save details
              </Button>
            )}
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4" aria-hidden="true" /> Widget
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Project key prefix</p>
              <p className="font-mono text-xs text-muted">{project.apiKeyPrefix ?? "Stored securely"}</p>
            </div>
            {isLead && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={rotatingKey}
                onClick={handleRotateKey}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Rotate key
              </Button>
            )}
          </div>

          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface2 p-3 text-xs">
            {
              '<script src="…/inspectflow-widget.js" data-key="…" data-api="…" defer></script>'
            }
          </pre>

          <form onSubmit={handleSaveOrigins} className="mt-5 space-y-3">
            <TextArea
              label="Allowed origins (one per line)"
              placeholder="https://staging.example.com"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              disabled={!isLead}
            />
            {isLead && (
              <Button type="submit" variant="secondary" loading={savingOrigins}>
                Save origins
              </Button>
            )}
          </form>
        </Card>

        {/* Rotated Key Modal */}
        <Modal
          open={!!rotatedKey}
          title="New Widget Key Generated"
          onClose={() => setRotatedKey(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              The old widget key has been revoked. Copy your new widget key now; for security reasons, it cannot be displayed again.
            </p>
            {rotatedKey && (
              <div className="rounded-lg border border-line bg-surface2 p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">New Widget Key</span>
                <div className="mt-1 flex items-center justify-between gap-2 font-mono text-sm break-all">
                  <span>{rotatedKey}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyKey(rotatedKey)}
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button type="button" variant="primary" onClick={() => setRotatedKey(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>

        {project.myRole !== "TESTER_CLIENT" && <GithubCard key={project.id} />}

        {isLead && (
          <Card className="border-danger/40">
            <h2 className="mb-2 font-semibold text-danger">Danger zone</h2>
            <p className="mb-3 text-sm text-muted">
              Permanently delete this project and all associated tickets, builds, screenshots, and comments. This action cannot be undone.
            </p>
            <Button
              type="button"
              variant="danger"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete project
            </Button>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteModalOpen}
          title="Delete Project?"
          onClose={() => setDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to permanently delete <strong>{project.name}</strong>? All data will be irreversibly removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleting} onClick={handleDeleteProject}>
                Yes, delete project
              </Button>
            </div>
          </div>
        </Modal>
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
      toast("GitHub repository saved", "ok");
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
