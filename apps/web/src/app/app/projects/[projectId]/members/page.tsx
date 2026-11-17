import { Trash2, UserPlus } from "lucide-react";
import { Badge, Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { PreviewDialog, PreviewNotice } from "@/components/role-preview";

const exampleMembers = [
  { name: "Example Lead", email: "lead@example.test", role: "Project Lead" },
  { name: "Example Developer", email: "dev@example.test", role: "Developer" },
  { name: "Example Reviewer", email: "tester@example.test", role: "Tester / Client" },
];

export default function MembersPage() {
  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Permissions come from each person's role in this project."
        actions={
          <PreviewDialog title="Add a member" label="Add member" icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}>
            <Field label="Email of a registered user" type="email" />
            <Select label="Role in this project">
              <option>Tester / Client</option><option>Developer</option><option>Project Lead</option>
            </Select>
          </PreviewDialog>
        }
      />
      <PreviewNotice>Project Lead preview. The rows below are examples.</PreviewNotice>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {exampleMembers.map((member) => (
              <tr key={member.email}>
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3"><Badge tone="brand">{member.role}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button type="button" size="sm" variant="ghost" disabled aria-label={`Remove ${member.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold">What each role can do</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Project Lead · Manage project settings, team members and the widget.</li>
          <li>Developer · Triage tickets, link pull requests and prepare builds for review.</li>
          <li>Tester / Client · Report issues, verify fixes and review builds.</li>
        </ul>
      </Card>
    </>
  );
}
