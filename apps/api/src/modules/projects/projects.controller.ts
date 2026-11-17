import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Membership, ProjectRole } from "@prisma/client";
import {
  CurrentMembership,
  CurrentUser,
  ProjectRoles,
} from "@/common/decorators";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { ConnectGithubDto, PageDto } from "./dto/project.dto";
import { ProjectsService } from "./projects.service";


const { LEAD, DEVELOPER, TESTER_CLIENT } = ProjectRole;

/**
 * ProjectRolesGuard checks membership for project-scoped requests.
 */
@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() page: PageDto) {
    return this.projects.listForUser(user.id, page);
  }

  @ProjectRoles(LEAD, DEVELOPER, TESTER_CLIENT)
  @Get(":projectId")
  get(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @CurrentMembership() membership: Membership,
  ) {
    return this.projects.get(projectId, membership.role);
  }

  @ProjectRoles(LEAD)
  @Patch(":projectId/github")
  connectGithub(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ConnectGithubDto,
  ) {
    return this.projects.connectGithub(projectId, user.id, dto);
  }

  @ProjectRoles(LEAD, DEVELOPER)
  @Get(":projectId/webhook-deliveries")
  deliveries(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Query() page: PageDto,
  ) {
    return this.projects.listDeliveries(projectId, page);
  }
}
