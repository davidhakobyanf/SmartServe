import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Permission } from "src/common/auth/permission";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import {
  OpenSessionGuard,
  RequestWithSession,
} from "src/common/guards/open-session.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

@Controller("api/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_VIEW)
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @UseGuards(OpenSessionGuard)
  @Get("mine")
  findMine(@Req() req: RequestWithSession) {
    return this.ordersService.findForSession(req.diningSession!.id);
  }

  @UseGuards(OpenSessionGuard)
  @Post()
  create(@Req() req: RequestWithSession) {
    return this.ordersService.createFromBasket(req.diningSession!.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_MANAGE)
  @Patch(":id/status")
  updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
