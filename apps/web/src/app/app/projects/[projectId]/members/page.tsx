"use client";

import { useState } from "react";
import useSWR from "swr";
import { Trash2, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  Modal,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { type Role, ROLE_LABEL } from "@/lib/types";

interface MemberItem {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MembersPage() {
  const { project, role } = useProject();
  const toast = useToast();
  const { data: members, error, isLoading, mutate } = useSWR<MemberItem[]>(
    `/projects/${project.id}/members`
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("DEVELOPER");
  const [adding, setAdding] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<MemberItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isLead = role === "LEAD";

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    try {
      await api(`/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: newRole }),
      });
      toast("Member added successfully", "ok");
      setEmail("");
      setNewRole("DEVELOPER");
      setAddModalOpen(false);
      mutate();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId: string, roleToSet: Role) {
    setUpdatingId(memberId);
    try {
      await api(`/projects/${project.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleToSet }),
      });
      toast("Role updated", "ok");
      mutate();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;

    setRemoving(true);
    try {
      await api(`/projects/${project.id}/members/${memberToRemove.id}`, {
        method: "DELETE",
      });
      toast("Member removed", "ok");
      setMemberToRemove(null);
      mutate();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Permissions come from each person's role in this project."
        actions={
          isLead && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setAddModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Add member
            </Button>
          )
        }
      />

      {isLoading && <Loading />}
      {error && <ErrorState error={error} retry={() => mutate()} />}

      {members && members.length === 0 && (
        <EmptyState
          icon={<UserPlus className="h-8 w-8" />}
          title="No members"
          text="Invite team members to collaborate on this project."
        />
      )}

      {members && members.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                {isLead && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium">{m.user.name}</td>
                  <td className="px-4 py-3">{m.user.email}</td>
                  <td className="px-4 py-3">
                    {isLead ? (
                      <select
                        aria-label={`Change role for ${m.user.name}`}
                        className="rounded-lg border border-line bg-surface2 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                        value={m.role}
                        disabled={updatingId === m.id}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                      >
                        <option value="TESTER_CLIENT">Tester / Client</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="LEAD">Project Lead</option>
                      </select>
                    ) : (
                      <Badge tone="brand">{ROLE_LABEL[m.role]}</Badge>
                    )}
                  </td>
                  {isLead && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setMemberToRemove(m)}
                        aria-label={`Remove ${m.user.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        open={addModalOpen}
        title="Add a Member"
        onClose={() => setAddModalOpen(false)}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <Field
            label="Email of a registered user"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
          />
          <Select
            label="Role in this project"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="TESTER_CLIENT">Tester / Client</option>
            <option value="DEVELOPER">Developer</option>
            <option value="LEAD">Project Lead</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={adding}>
              Add member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        open={!!memberToRemove}
        title="Remove Member?"
        onClose={() => setMemberToRemove(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to remove <strong>{memberToRemove?.user.name}</strong> ({memberToRemove?.user.email}) from this project?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMemberToRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={removing}
              onClick={handleRemoveMember}
            >
              Yes, remove
            </Button>
          </div>
        </div>
      </Modal>

      <Card className="mt-6">
        <h2 className="font-semibold">What each role can do</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><strong>Project Lead</strong> · Manage project settings, team members, allowed origins, and the widget.</li>
          <li><strong>Developer</strong> · Triage tickets, link pull requests and prepare builds for review.</li>
          <li><strong>Tester / Client</strong> · Report issues, verify fixes and review builds.</li>
        </ul>
      </Card>
    </>
  );
}
