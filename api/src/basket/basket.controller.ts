import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { BasketService } from './basket.service';
import {
  AddBasketItemDto,
  DeleteAllBasketDto,
  DeleteBasketItemDto,
} from './dto/basket.dto';

@Controller('api/basket')
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  @Get()
  getBasket() {
    return this.basketService.getTables();
  }

  @Patch()
  addToBasket(@Body() dto: AddBasketItemDto) {
    return this.basketService.addItem(dto);
  }

  @Delete()
  deleteItem(@Body() dto: DeleteBasketItemDto) {
    return this.basketService.deleteItem(dto.table, dto.id);
  }
}

@Controller('api/basket/all')
export class BasketAllController {
  constructor(private readonly basketService: BasketService) {}

  @Delete()
  deleteAll(@Body() dto: DeleteAllBasketDto) {
    return this.basketService.deleteAllForTable(dto.table);
  }
}
