import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma, Project, ProjectRole } from "@prisma/client";
import { toPaging } from "@/common/utils/pagination";
import { PrismaService } from "@/providers/database/prisma.service";
import { randomSecret } from "@/common/utils/crypto";
import { env } from "@/config";
import { ActivityService } from "@/modules/activity/activity.service";
import { ConnectGithubDto, PageDto } from "./dto/project.dto";

/** Removes secrets before a project is returned to a client. */
export function toPublicProject(project: Project) {
  const { id, name, description, stagingUrl, createdAt, githubRepo, webhookSecret } = project;
  return { id, name, description, stagingUrl, createdAt, githubRepo, hasWebhookSecret: !!webhookSecret };
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

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
