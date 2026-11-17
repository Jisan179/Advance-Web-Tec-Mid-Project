"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import {
  ArrowLeft,
  Bug,
  GitBranch,
  Trash2,
  ExternalLink,
  ImageOff,
  Maximize2,
  Send,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Loading,
  Modal,
  Select,
  SeverityBadge,
  StatusBadge,
  TextArea,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { describeActivity, formatDateTime, timeAgo } from "@/lib/format";
import {
  SEVERITY_LABEL,
  type Role,
  type Severity,
  type TicketStatus,
} from "@/lib/types";

interface Detail {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  severity: Severity;
  status: TicketStatus;
  pageUrl: string | null;
  viewport: string | null;
  userAgent: string | null;
  branch: string | null;
  prNumber: number | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  build: {
    id: string;
    name: string;
    branch: string;
    commitSha: string;
    status: string;
  } | null;
  duplicateOf: { id: string; number: number; title: string } | null;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string };
  }[];
  annotations: { id: string; type: "ARROW" | "BOX" | "BLUR" }[];
  artifacts: { id: string; url: string }[];
  activities: {
    id: string;
    action: string;
    metadata: any;
    createdAt: string;
    actor: { name: string } | null;
  }[];
  myRole: Role;
  allowedTransitions: TicketStatus[];
}

const ACTION_LABEL: Record<TicketStatus, string> = {
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  VERIFIED: "Verify fix",
  OPEN: "Reopen",
};

export default function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const {
    data: t,
    error,
    isLoading,
    mutate,
  } = useSWR<Detail>(`/tickets/${ticketId}`);
  if (isLoading) return <Loading />;
  if (error)
    return (
      <ErrorState
        error={
          error.status === 404
            ? new Error("Ticket not found, or you do not have access to it.")
            : error
        }
      />
    );
  if (!t) return null;

  return (
    <>
      <Link
        href={`/app/projects/${t.projectId}/tickets`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to tickets
      </Link>
      <div className="mb-6">
        <p className="text-sm text-muted">IF-{t.number}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge value={t.status} />
          <SeverityBadge value={t.severity} />
          {t.duplicateOf && (
            <Link href={`/app/tickets/${t.duplicateOf.id}`}>
              <Badge tone="warn">Duplicate of IF-{t.duplicateOf.number}</Badge>
            </Link>
          )}
          <span className="text-sm text-muted">
            Reported by {t.reporter.name}, {formatDateTime(t.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-wrap break-words text-sm">
              {t.description}
            </p>
          </Card>
          <Screenshot t={t} />
          <EvidencePreview />
          <Comments t={t} reload={() => mutate()} />
          <Activity t={t} />
        </div>
        <aside className="space-y-6">
          <StatusPanel t={t} reload={() => mutate()} />
          <TriagePreview t={t} />
          <Environment t={t} />
          <Card>
            <h2 className="mb-2 font-semibold text-danger">Delete ticket</h2>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled
              title="Project Lead preview"
            >
              Delete ticket
            </Button>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Screenshot({ t }: { t: Detail }) {
  const [zoom, setZoom] = useState(false);
  const shot = t.artifacts[0];
  const counts = t.annotations.reduce<Record<string, number>>(
    (acc, a) => ({ ...acc, [a.type]: (acc[a.type] ?? 0) + 1 }),
    {},
  );
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Annotated screenshot</h2>
        {shot && (
          <Button size="sm" onClick={() => setZoom(true)}>
            <Maximize2 className="h-4 w-4" aria-hidden="true" /> Enlarge
          </Button>
        )}
      </div>
      {shot ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot.url}
            alt={`Screenshot attached to ticket IF-${t.number}`}
            className="w-full cursor-zoom-in rounded-lg border border-line"
            onClick={() => setZoom(true)}
          />
          <p className="mt-2 text-xs text-muted">
            {t.annotations.length === 0
              ? "No annotations."
              : `Annotations: ${Object.entries(counts)
                  .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                  .join(", ")}.`}{" "}
            Blurred areas were destroyed before upload. The image link is
            private and expires after a few minutes; reload the page for a fresh
            one.
          </p>
          <Modal open={zoom} title="Screenshot" onClose={() => setZoom(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.url}
              alt="Enlarged screenshot"
              className="w-full rounded-lg border border-line"
            />
          </Modal>
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-surface2 p-6 text-sm text-muted">
          <ImageOff className="h-5 w-5" aria-hidden="true" /> This ticket was
          created manually and has no screenshot.
        </div>
      )}
    </Card>
  );
}

function Comments({ t, reload }: { t: Detail; reload: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  async function removeComment(id: string) {
    try {
      await api(`/comments/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api(`/tickets/${t.id}/comments`, {
        method: "POST",
        body: { body },
      });
      setBody("");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Discussion ({t.comments.length})</h2>
      {t.comments.length === 0 && (
        <p className="mb-3 text-sm text-muted">No comments yet.</p>
      )}
      <ul className="mb-4 space-y-3">
        {t.comments.map((c) => (
          <li key={c.id} className="rounded-lg bg-surface2 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <strong>{c.author.name}</strong>
              <span className="flex items-center gap-2">
                <time
                  className="text-xs text-muted"
                  title={formatDateTime(c.createdAt)}
                >
                  {timeAgo(c.createdAt)}
                </time>
                {c.author.id === user?.id && (
                  <button
                    onClick={() => removeComment(c.id)}
                    aria-label="Delete comment"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <p className="whitespace-pre-wrap break-words">{c.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="space-y-2">
        <TextArea
          label="Add a comment or reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
        />
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          disabled={!body.trim()}
        >
          <Send className="h-4 w-4" aria-hidden="true" /> Post comment
        </Button>
      </form>
    </Card>
  );
}

function Activity({ t }: { t: Detail }) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Activity</h2>
      <ol className="space-y-2 border-l border-line pl-4 text-sm">
        {t.activities.map((a) => (
          <li key={a.id} className="relative">
            <span
              className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand"
              aria-hidden="true"
            />
            <strong>{a.actor?.name ?? "GitHub"}</strong> {describeActivity(a)}
            <span className="ml-2 text-xs text-muted">
              {formatDateTime(a.createdAt)}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function StatusPanel({ t, reload }: { t: Detail; reload: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<TicketStatus | null>(null);
  async function move(status: TicketStatus) {
    setBusy(status);
    try {
      await api(`/tickets/${t.id}/status`, {
        method: "POST",
        body: { status, note: note || undefined },
      });
      setNote("");
      toast(`Status changed to ${status.replace("_", " ").toLowerCase()}`);
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Status</h2>
      <div className="mb-3">
        <StatusBadge value={t.status} />
      </div>
      {t.allowedTransitions.length === 0 ? (
        <p className="text-sm text-muted">
          {t.myRole === "TESTER_CLIENT"
            ? "The development team is working on this. You will be able to verify the fix once it is resolved."
            : "No status changes are available to you right now."}
        </p>
      ) : (
        <>
          <TextArea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {t.allowedTransitions.map((s) => (
              <Button
                key={s}
                variant={s === "OPEN" ? "secondary" : "primary"}
                size="sm"
                loading={busy === s}
                onClick={() => move(s)}
              >
                {ACTION_LABEL[s]}
              </Button>
            ))}
          </div>
        </>
      )}
      {t.resolvedAt && t.status !== "OPEN" && (
        <p className="mt-3 text-xs text-muted">
          Resolved {formatDateTime(t.resolvedAt)}
        </p>
      )}
    </Card>
  );
}

function EvidencePreview() {
  const [tab, setTab] = useState<"errors" | "network">("errors");
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Bug className="h-4 w-4" aria-hidden="true" /> Technical evidence
      </h2>
      <div
        className="mb-3 flex flex-wrap gap-2 border-b border-line pb-2"
        aria-label="Evidence preview"
      >
        <Button
          type="button"
          size="sm"
          aria-pressed={tab === "errors"}
          onClick={() => setTab("errors")}
        >
          Console and errors
        </Button>
        <Button
          type="button"
          size="sm"
          aria-pressed={tab === "network"}
          onClick={() => setTab("network")}
        >
          Failed requests
        </Button>
      </div>
      <p className="text-sm text-muted">
        {tab === "errors"
          ? "Console details are part of the Developer preview."
          : "Failed request details are part of the Developer preview."}
      </p>
    </Card>
  );
}

function TriagePreview({ t }: { t: Detail }) {
  return (
    <Card>
      <h2 className="mb-2 font-semibold">Triage</h2>
      <p className="mb-3 text-sm text-muted">Developer preview</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled>
          Start work
        </Button>
        <Button type="button" size="sm" disabled>
          Mark resolved
        </Button>
      </div>
      <fieldset disabled className="space-y-3">
        <Select label="Assignee">
          <option>{t.assignee?.name ?? "Unassigned"}</option>
        </Select>
        <Select label="Severity" value={t.severity} disabled>
          {Object.entries(SEVERITY_LABEL).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </Select>
        <p className="flex items-center gap-2 border-t border-line pt-3 text-sm font-medium">
          <GitBranch className="h-4 w-4" aria-hidden="true" /> Branch and pull
          request
        </p>
        <Field
          label="Branch"
          placeholder="fix/checkout-button"
          value={t.branch ?? ""}
          readOnly
        />
        <Field
          label="Pull request number"
          type="number"
          min={1}
          placeholder="12"
          value={t.prNumber ?? ""}
          readOnly
        />
        <Button type="button" size="sm" disabled>
          Save link
        </Button>
      </fieldset>
    </Card>
  );
}

function Environment({ t }: { t: Detail }) {
  const rows: [string, React.ReactNode][] = [
    [
      "Page",
      t.pageUrl ? (
        <a
          href={t.pageUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-brand hover:underline"
        >
          {t.pageUrl}{" "}
          <ExternalLink
            className="inline h-3 w-3"
            aria-label="opens in a new tab"
          />
        </a>
      ) : (
        "n/a"
      ),
    ],
    ["Viewport", t.viewport ?? "n/a"],
    [
      "Build",
      t.build ? (
        <Link
          href={`/app/builds/${t.build.id}`}
          className="text-brand hover:underline"
        >
          {t.build.name} ({t.build.commitSha.slice(0, 7)})
        </Link>
      ) : (
        "None"
      ),
    ],
  ];
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Environment</h2>
      <dl className="space-y-2 text-sm">
        {rows
          .filter(([, v]) => v !== null)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted">
                {k}
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
    </Card>
  );
}
