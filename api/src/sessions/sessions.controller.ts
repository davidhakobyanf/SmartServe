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

@Controller("api/sessions")
export class SessionsController {
  constructor(private readonly sessionService: SessionsService) {}

  @Post("open")
  open(@Body() dto: OpenSessionDto) {
    return this.sessionService.openForTable(dto.tableToken);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @Get("open")
  listOpen() {
    return this.sessionService.listOpen();
  }

  @UseGuards(OpenSessionGuard)
  @Get("current")
  getCurrent(@Req() req: RequestWithSession) {
    return req.diningSession;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @Patch(":id/close")
  close(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.sessionService.close(id);
  }
}
