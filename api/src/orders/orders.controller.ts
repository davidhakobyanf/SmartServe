import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, DeleteOrderDto } from './dto/order.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getOrders() {
    return this.ordersService.getOrders();
  }

  @Patch()
  addOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.addOrder(dto);
  }

  @Delete()
  deleteOrder(@Body() dto: DeleteOrderDto) {
    return this.ordersService.deleteOrder(dto.id);
  }
}

@Controller('api/orders/all')
export class OrdersAllController {
  constructor(private readonly ordersService: OrdersService) {}

  @Delete()
  deleteAll() {
    return this.ordersService.deleteAllOrders();
  }
}
