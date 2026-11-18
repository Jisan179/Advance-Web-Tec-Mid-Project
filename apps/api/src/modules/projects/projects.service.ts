import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Project, ProjectRole } from "@prisma/client";
import { toPaging } from "@/common/utils/pagination";
import { PrismaService } from "@/providers/database/prisma.service";
import { StorageService } from "@/providers/storage/storage.service";
import { generateWidgetKey, randomSecret } from "@/common/utils/crypto";
import { env } from "@/config";
import { ActivityService } from "@/modules/activity/activity.service";
import {
  ConnectGithubDto,
  CreateProjectDto,
  PageDto,
  UpdateProjectDto,
} from "./dto/project.dto";

/** Removes secrets before a project is returned to a client. */
export function toPublicProject(project: Project) {
  const { apiKeyHash: _hash, webhookSecret, ...rest } = project;
  return { ...rest, hasWebhookSecret: !!webhookSecret };
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly activity: ActivityService,
  ) {}

  /** The creator becomes Project Lead. The widget key is returned only once. */
  async create(userId: string, dto: CreateProjectDto) {
    const widget = generateWidgetKey();
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          stagingUrl: dto.stagingUrl,
          allowedOrigins: dto.allowedOrigins ?? [],
          apiKeyPrefix: widget.prefix,
          apiKeyHash: widget.hash,
          memberships: { create: { userId, role: ProjectRole.LEAD } },
        },
      });
      await this.activity.log(
        { projectId: created.id, actorId: userId, action: "project.created" },
        tx,
      );
      return created;
    });
    return { ...toPublicProject(project), myRole: ProjectRole.LEAD, widgetKey: widget.key };
  }

  async listForUser(userId: string, page?: PageDto) {
    const paged = page?.page !== undefined || page?.limit !== undefined;
    const { skip, take, page: p, limit } = toPaging(page ?? {});
    const [memberships, total] = await Promise.all([
      this.prisma.membership.findMany({
        where: { userId },
        include: { project: true },
        orderBy: { project: { createdAt: "desc" } },
        ...(paged ? { skip, take } : {}),
      }),
      paged ? this.prisma.membership.count({ where: { userId } }) : 0,
    ]);
    const items = memberships.map((m) => ({
      ...toPublicProject(m.project),
      myRole: m.role,
    }));
    return paged ? { items, total, page: p, limit } : items;
  }

  async get(projectId: string, role: ProjectRole) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    return { ...toPublicProject(project), myRole: role };
  }

  async update(projectId: string, actorId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        stagingUrl: dto.stagingUrl,
        allowedOrigins: dto.allowedOrigins,
      },
    });
    await this.activity.log({
      projectId,
      actorId,
      action: "project.updated",
      metadata: { fields: Object.keys(dto) },
    });
    return toPublicProject(project);
  }

  /** Deletes the project, its database rows (cascade) and its stored files. */
  async remove(projectId: string, _actorId: string) {
    const artifacts = await this.prisma.artifact.findMany({
      where: { ticket: { projectId } },
      select: { storageKey: true },
    });
    await this.prisma.project.delete({ where: { id: projectId } });
    await Promise.all(artifacts.map((a) => this.storage.delete(a.storageKey)));
    return { message: "Project deleted", deletedFiles: artifacts.length };
  }

  async rotateKey(projectId: string, actorId: string) {
    const widget = generateWidgetKey();
    await this.prisma.project.update({
      where: { id: projectId },
      data: { apiKeyPrefix: widget.prefix, apiKeyHash: widget.hash },
    });
    await this.activity.log({
      projectId,
      actorId,
      action: "project.key_rotated",
    });
    return { widgetKey: widget.key };
  }

  // ---------------- members ----------------

  async listMembers(projectId: string, page?: PageDto) {
    const paged = page?.page !== undefined || page?.limit !== undefined;
    const { skip, take, page: p, limit } = toPaging(page ?? {});
    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        ...(paged ? { skip, take } : {}),
      }),
      paged ? this.prisma.membership.count({ where: { projectId } }) : 0,
    ]);
    return paged ? { items, total, page: p, limit } : items;
  }

  async getMember(projectId: string, membershipId: string) {
    const member = await this.prisma.membership.findFirst({
      where: { id: membershipId, projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  private async findMember(projectId: string, membershipId: string) {
    // projectId in the filter stops a Lead editing another project's member.
    const member = await this.prisma.membership.findFirst({
      where: { id: membershipId, projectId },
    });
    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  private async assertAnotherLead(projectId: string, excludingId: string) {
    const others = await this.prisma.membership.count({
      where: { projectId, role: ProjectRole.LEAD, id: { not: excludingId } },
    });
    if (others === 0) {
      throw new BadRequestException("A project must keep at least one Lead");
    }
  }

  async connectGithub(projectId: string, actorId: string, dto: ConnectGithubDto) {
    const repo = dto.githubRepo.toLowerCase();
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Serialize secret initialization and rotation for this project.
        await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
        const current = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { webhookSecret: true },
        });
        const generate = dto.regenerateSecret || (!dto.webhookSecret && !current.webhookSecret);
        const generated = generate ? randomSecret(24) : null;
        await tx.project.update({
          where: { id: projectId },
          data: { githubRepo: repo, webhookSecret: generated ?? dto.webhookSecret ?? undefined },
        });
        await this.activity.log(
          { projectId, actorId, action: "github.connected", metadata: { repo } },
          tx,
        );
        return {
          githubRepo: repo,
          webhookUrl: env.PUBLIC_API_URL.replace(/\/+$/, "") + "/webhooks/github",
          webhookSecret: generated,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("This repository is linked to another project");
      }
      throw error;
    }
  }

  async listDeliveries(projectId: string, page: PageDto) {
    const { skip, take, page: p, limit } = toPaging(page);
    const [items, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: { projectId },
        orderBy: { processedAt: "desc" },
        skip,
        take,
      }),
      this.prisma.webhookDelivery.count({ where: { projectId } }),
    ]);
    return { items, total, page: p, limit };
  }
}
