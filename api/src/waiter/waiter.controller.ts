import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  OpenSessionGuard,
  RequestWithSession,
} from "src/common/guards/open-session.guard";
import { WaiterGateway } from "./waiter.gateway";
import { WaiterCallsService } from "./waiter-calls.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";

@Controller("api/waiter")
export class WaiterController {
  constructor(
    private readonly gateway: WaiterGateway,
    private readonly calls: WaiterCallsService,
  ) {}

  @UseGuards(OpenSessionGuard)
  @Post("call")
  async call(@Req() req: RequestWithSession) {
    return { ok: true, call: await this.gateway.callForSession(req.diningSession!) };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.WAITER_CALLS_VIEW)
  @Get("pending")
  pending() {
    return this.calls.pending();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.WAITER_CALLS_VIEW)
  @Patch(":id/resolve")
  async resolve(@Param("id", new ParseUUIDPipe()) id: string) {
    await this.gateway.resolveCall(id);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.WAITER_CALLS_VIEW)
  @Post("resolve-all")
  async resolveAll() {
    await this.gateway.resolveAllCalls();
    return { ok: true };
  }
}
