import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, DeleteOrderDto } from "./dto/order.dto";
import { RequestWithSession } from "src/common/guards/open-session.guard";
import { OpenSessionGuard } from "src/common/guards/open-session.guard";
import { Req } from "@nestjs/common";

@Controller("api/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getOrders() {
    return this.ordersService.getOrders();
  }

  @UseGuards(OpenSessionGuard)
  @Patch()
  addOrder(@Req() req: RequestWithSession, @Body() dto: CreateOrderDto) {
    const session = req.diningSession!;
    return this.ordersService.addOrder(dto, {
      table: String(session.table.number),
      sessionId: session.id,
    });
  }

  @Delete()
  deleteOrder(@Body() dto: DeleteOrderDto) {
    return this.ordersService.deleteOrder(dto.id);
  }
}

@Controller("api/orders/all")
export class OrdersAllController {
  constructor(private readonly ordersService: OrdersService) {}

  @Delete()
  deleteAll() {
    return this.ordersService.deleteAllOrders();
  }
}
