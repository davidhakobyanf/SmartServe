import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { OpenSessionDto } from "./dto/open-session.dto";
import {
  OpenSessionGuard,
  RequestWithSession,
} from "src/common/guards/open-session.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";
import { adminSessionResponse, guestSessionResponse } from "./session-response";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly sessionService: SessionsService,
  ) {}

  @Post("open")
  async open(
    @Body() dto: OpenSessionDto,
    @Headers("accept-language") locale?: string,
  ) {
    return guestSessionResponse(
      await this.sessionService.openForTable(dto.tableToken),
      locale,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @Get("open")
  async listOpen(
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    const sessions = await this.sessionService.listOpen();
    return sessions.map((session) =>
      adminSessionResponse(user, session, locale),
    );
  }

  @UseGuards(OpenSessionGuard)
  @Get("current")
  getCurrent(
    @Req() req: RequestWithSession,
    @Headers("accept-language") locale?: string,
  ) {
    return guestSessionResponse(req.diningSession!, locale);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @Patch(":id/close")
  async close(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return adminSessionResponse(
      user,
      await this.sessionService.close(id),
      locale,
    );
  }
}
