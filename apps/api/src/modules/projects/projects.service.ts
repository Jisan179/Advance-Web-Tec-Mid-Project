import { Injectable } from "@nestjs/common";
import { Project, ProjectRole } from "@prisma/client";
import { toPaging } from "@/common/utils/pagination";
import { PrismaService } from "@/providers/database/prisma.service";
import { PageDto } from "./dto/project.dto";

/** Removes secrets before a project is returned to a client. */
export function toPublicProject(project: Project) {
  const { id, name, description, stagingUrl, createdAt } = project;
  return { id, name, description, stagingUrl, createdAt };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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

}
