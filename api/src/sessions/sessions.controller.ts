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
import { UsersService } from "src/users/users.service";
import { DiningSession } from "src/entities/dining-session.entity";
import { localizedNameResponse } from "src/common/i18n/localized-response";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly sessionService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  private adminResponseFor(user: User, session: DiningSession, locale?: string) {
    const canManageQr = this.usersService
      .getEffectivePermissions(user)
      .includes(Permission.TABLES_QR_MANAGE);

    const localizedSession = session.table
      ? { ...session, table: localizedNameResponse(session.table, locale) }
      : session;

    if (canManageQr || !localizedSession.table) return localizedSession;
    return {
      ...localizedSession,
      table: { ...localizedSession.table, publicToken: undefined },
    };
  }

  private guestResponseFor(session: DiningSession, locale?: string) {
    return {
      id: session.id,
      status: session.status,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
      table: {
        id: session.table.id,
        number: session.table.number,
        name: localizedNameResponse(session.table, locale).name,
        nameTranslations: session.table.nameTranslations,
      },
    };
  }

  @Post("open")
  async open(
    @Body() dto: OpenSessionDto,
    @Headers("accept-language") locale?: string,
  ) {
    return this.guestResponseFor(
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
      this.adminResponseFor(user, session, locale),
    );
  }

  @UseGuards(OpenSessionGuard)
  @Get("current")
  getCurrent(
    @Req() req: RequestWithSession,
    @Headers("accept-language") locale?: string,
  ) {
    return this.guestResponseFor(req.diningSession!, locale);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @Patch(":id/close")
  async close(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return this.adminResponseFor(
      user,
      await this.sessionService.close(id),
      locale,
    );
  }
}
