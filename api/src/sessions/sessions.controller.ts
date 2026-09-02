import {
  Body,
  Controller,
  Get,
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

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly sessionService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  private adminResponseFor(user: User, session: DiningSession) {
    const canManageQr = this.usersService
      .getEffectivePermissions(user)
      .includes(Permission.TABLES_QR_MANAGE);

    if (canManageQr || !session.table) return session;
    return {
      ...session,
      table: { ...session.table, publicToken: undefined },
    };
  }

  private guestResponseFor(session: DiningSession) {
    return {
      id: session.id,
      status: session.status,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
      table: {
        id: session.table.id,
        number: session.table.number,
        name: session.table.name,
      },
    };
  }

  @Post("open")
  async open(@Body() dto: OpenSessionDto) {
    return this.guestResponseFor(
      await this.sessionService.openForTable(dto.tableToken),
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @Get("open")
  async listOpen(@CurrentUser() user: User) {
    const sessions = await this.sessionService.listOpen();
    return sessions.map((session) => this.adminResponseFor(user, session));
  }

  @UseGuards(OpenSessionGuard)
  @Get("current")
  getCurrent(@Req() req: RequestWithSession) {
    return this.guestResponseFor(req.diningSession!);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @Patch(":id/close")
  async close(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.adminResponseFor(user, await this.sessionService.close(id));
  }
}
