import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Membership } from "@prisma/client";
import {
  CurrentMembership,
  CurrentUser,
} from "@/common/decorators";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import {
  PageDto,
} from "./dto/project.dto";
import { ProjectsService } from "./projects.service";


/**
 * ProjectRolesGuard checks tester membership for project-scoped requests.
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

  @Get(":projectId")
  get(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @CurrentMembership() membership: Membership,
  ) {
    return this.projects.get(projectId, membership.role);
  }


}
