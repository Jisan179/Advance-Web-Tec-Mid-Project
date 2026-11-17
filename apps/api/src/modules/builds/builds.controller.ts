import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Membership } from "@prisma/client";
import {
  CurrentMembership,
  CurrentUser,
} from "@/common/decorators";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { BuildsService } from "./builds.service";
import { PageDto } from "@/modules/projects/dto/project.dto";
import { DecisionDto } from "./dto/build.dto";


@ApiTags("Builds")
@ApiBearerAuth()
@Controller()
export class BuildsController {
  constructor(private readonly builds: BuildsService) {}

  @Get("projects/:projectId/builds")
  list(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @CurrentMembership() membership: Membership,
    @Query() page: PageDto,
  ) {
    return this.builds.list(projectId, membership.role, page);
  }

  @Get("builds/:buildId")
  get(
    @Param("buildId", ParseUUIDPipe) buildId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.builds.get(buildId, user);
  }

  @Get("builds/:buildId/review")
  review(
    @Param("buildId", ParseUUIDPipe) buildId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.builds.review(buildId, user);
  }

  @Post("builds/:buildId/decision")
  decide(
    @Param("buildId", ParseUUIDPipe) buildId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: DecisionDto,
  ) {
    return this.builds.decide(buildId, user, dto);
  }
}
