import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalDecision,
  BuildStatus,
  Prisma,
  ProjectRole,
  TicketStatus,
} from "@prisma/client";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { PrismaService } from "@/providers/database/prisma.service";
import { ActivityService } from "@/modules/activity/activity.service";
import { ProjectAccessService } from "@/modules/access/project-access.service";
import { blockingWhere } from "@/modules/tickets/ticket-workflow";
import { toPaging } from "@/common/utils/pagination";
import { PageDto } from "@/modules/projects/dto/project.dto";
import { DecisionDto } from "./dto/build.dto";

const { TESTER_CLIENT } = ProjectRole;

@Injectable()
export class BuildsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly activity: ActivityService,
  ) {}

  /**
   * Clients only see builds that were shared with them, meaning builds that
   * left DRAFT.
   */
  async list(projectId: string, role: ProjectRole, page?: PageDto) {
    const where = {
      projectId,
      ...(role === TESTER_CLIENT ? { status: { not: BuildStatus.DRAFT } } : {}),
    };
    const paged = page?.page !== undefined || page?.limit !== undefined;
    const { skip, take, page: p, limit } = toPaging(page ?? {});
    const [builds, total] = await Promise.all([
      this.prisma.build.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { tickets: true } } },
        ...(paged ? { skip, take } : {}),
      }),
      paged ? this.prisma.build.count({ where }) : 0,
    ]);
    const blocking = await this.prisma.ticket.groupBy({
      by: ["buildId"],
      where: { projectId, ...blockingWhere },
      _count: true,
    });
    const items = builds.map((b) => ({
      ...b,
      blockingTickets: blocking.find((x) => x.buildId === b.id)?._count ?? 0,
    }));
    return paged ? { items, total, page: p, limit } : items;
  }

  private async loadForUser(buildId: string, userId: string) {
    const build = await this.prisma.build.findUnique({ where: { id: buildId } });
    if (!build) throw new NotFoundException("Build not found");
    const membership = await this.access.requireMember(userId, build.projectId);
    if (membership.role === TESTER_CLIENT && build.status === BuildStatus.DRAFT) {
      throw new NotFoundException("Build not found");
    }
    return { build, role: membership.role };
  }

  async get(buildId: string, user: AuthUser) {
    const { build, role } = await this.loadForUser(buildId, user.id);
    const approvals = await this.approvalHistory(buildId);
    const blocking = await this.prisma.ticket.count({
      where: { buildId, ...blockingWhere },
    });
    return { ...build, myRole: role, blockingTickets: blocking, approvals };
  }

  /** Page data for the client review screen. */
  async review(buildId: string, user: AuthUser) {
    const { build, role } = await this.loadForUser(buildId, user.id);
    const ticketSelect = {
      id: true,
      number: true,
      title: true,
      severity: true,
      status: true,
    } satisfies Prisma.TicketSelect;

    const [blocking, open, verifiedCount, approvals] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { buildId, ...blockingWhere },
        select: ticketSelect,
        orderBy: { number: "asc" },
      }),
      this.prisma.ticket.findMany({
        where: { buildId, status: { not: TicketStatus.VERIFIED } },
        select: ticketSelect,
        orderBy: { number: "asc" },
      }),
      this.prisma.ticket.count({
        where: { buildId, status: TicketStatus.VERIFIED },
      }),
      this.approvalHistory(buildId),
    ]);
    return {
      build,
      myRole: role,
      blockingTickets: blocking,
      openTickets: open,
      verifiedCount,
      approvals,
      canDecide:
        role === TESTER_CLIENT && build.status === BuildStatus.IN_REVIEW,
      canApprove: blocking.length === 0,
    };
  }

  /**
   * Records the client's decision against the exact commit under review.
   *
   * Everything happens in one transaction. The build row is locked first
   * (SELECT ... FOR UPDATE) so two simultaneous decisions cannot both succeed,
   * and the blocking-ticket check sees the same data the approval is based on.
   */
  async decide(buildId: string, user: AuthUser, dto: DecisionDto) {
    const build = await this.prisma.build.findUnique({ where: { id: buildId } });
    if (!build) throw new NotFoundException("Build not found");
    await this.access.requireMember(user.id, build.projectId, [TESTER_CLIENT]);
    if (build.status === BuildStatus.DRAFT) {
      throw new NotFoundException("Build not found");
    }
    if (dto.decision === ApprovalDecision.CHANGES_REQUESTED && !dto.note?.trim()) {
      throw new BadRequestException("A note is required when requesting changes");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Build" WHERE id = ${buildId} FOR UPDATE`;
      const locked = await tx.build.findUniqueOrThrow({ where: { id: buildId } });
      if (locked.status !== BuildStatus.IN_REVIEW) {
        throw new ConflictException(
          `Build is ${locked.status} and can no longer be decided`,
        );
      }

      if (dto.decision === ApprovalDecision.APPROVED) {
        const blocking = await tx.ticket.count({
          where: { buildId, ...blockingWhere },
        });
        if (blocking > 0) {
          throw new ConflictException(
            `Cannot approve: ${blocking} blocking ticket(s) are not verified yet`,
          );
        }
      }

      const approved = dto.decision === ApprovalDecision.APPROVED;
      const approval = await tx.buildApproval.create({
        data: {
          buildId,
          userId: user.id,
          decision: dto.decision,
          note: dto.note?.trim() || null,
          commitSha: locked.commitSha,
        },
      });
      const updated = await tx.build.update({
        where: { id: buildId },
        data: { status: approved ? BuildStatus.APPROVED : BuildStatus.REJECTED },
      });
      await this.activity.log(
        {
          projectId: locked.projectId,
          actorId: user.id,
          action: approved ? "build.approved" : "build.changes_requested",
          metadata: { buildId, commitSha: locked.commitSha },
        },
        tx,
      );
      return { approval, build: updated };
    });
  }

  /** Approval history of one build, newest first. */
  private approvalHistory(buildId: string) {
    return this.prisma.buildApproval.findMany({
      where: { buildId },
      orderBy: { decidedAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });
  }

}
