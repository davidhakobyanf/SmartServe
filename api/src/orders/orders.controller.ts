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
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import {
  OpenSessionGuard,
  RequestWithSession,
} from "src/common/guards/open-session.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { User } from "src/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { hideOrdersFinancials, hideOrderFinancials } from "./order-response";
import { OrdersService } from "./orders.service";

@Controller("api/orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  private canViewRevenue(user: User): boolean {
    return this.usersService
      .getEffectivePermissions(user)
      .includes(Permission.REVENUE_VIEW);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_VIEW)
  @Get()
  async findAll(@CurrentUser() user: User) {
    const orders = await this.ordersService.findAll();
    return this.canViewRevenue(user) ? orders : hideOrdersFinancials(orders);
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
  async updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    const order = await this.ordersService.updateStatus(id, dto.status);
    return this.canViewRevenue(user) ? order : hideOrderFinancials(order);
  }
}
