import { Prisma, ProjectRole, TicketSeverity, TicketStatus } from "@prisma/client";

const { TESTER_CLIENT } = ProjectRole;

// A resolved fixture lets the reviewer demonstrate verification without a second actor.
export const TRANSITIONS: Record<TicketStatus, Partial<Record<TicketStatus, ProjectRole[]>>> = {
  OPEN: {},
  IN_PROGRESS: {},
  RESOLVED: { VERIFIED: [TESTER_CLIENT], OPEN: [TESTER_CLIENT] },
  VERIFIED: { OPEN: [TESTER_CLIENT] },
};

export function canTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: ProjectRole,
): boolean {
  return TRANSITIONS[from]?.[to]?.includes(role) ?? false;
}

/** Statuses the given role may move a ticket to from its current status. */
export function allowedTransitions(
  from: TicketStatus,
  role: ProjectRole,
): TicketStatus[] {
  return (Object.entries(TRANSITIONS[from]) as [TicketStatus, ProjectRole[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([to]) => to);
}

/**
 * A ticket blocks build approval while it is High or Blocker severity and has
 * not been verified by a tester. Resolved but unverified still blocks, which
 * forces the verification step before sign-off.
 */
export const BLOCKING_SEVERITIES: TicketSeverity[] = [
  TicketSeverity.HIGH,
  TicketSeverity.BLOCKER,
];

export const blockingWhere: Prisma.TicketWhereInput = {
  severity: { in: BLOCKING_SEVERITIES },
  status: { not: TicketStatus.VERIFIED },
};

export const isBlocking = (t: {
  severity: TicketSeverity;
  status: TicketStatus;
}) => BLOCKING_SEVERITIES.includes(t.severity) && t.status !== "VERIFIED";
