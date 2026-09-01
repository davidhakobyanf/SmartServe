import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { BasketService } from './basket.service';
import {
  AddBasketItemDto,
  DeleteAllBasketDto,
  DeleteBasketItemDto,
} from './dto/basket.dto';
import { RequestWithSession } from 'src/common/guards/open-session.guard';
import { OpenSessionGuard } from 'src/common/guards/open-session.guard';
import { Req } from '@nestjs/common';

  
@Controller('api/basket')
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  @Get()
  getBasket() {
    return this.basketService.getTables();
  }

  @UseGuards(OpenSessionGuard)
  @Get('mine')
  getMine(@Req() req: RequestWithSession) {
    const table = String(req.diningSession!.table.number);
    return this.basketService.getTableBasket(table);
  }

  @UseGuards(OpenSessionGuard)
  @Delete('mine')
  clearMine(@Req() req: RequestWithSession) {
    const table = String(req.diningSession!.table.number);
    return this.basketService.clearTable(table);
  }
  
  @UseGuards(OpenSessionGuard)
  @Patch()
  addToBasket(@Req() req: RequestWithSession, @Body() dto: AddBasketItemDto) {
    const table = String(req.diningSession!.table.number);
    return this.basketService.addItem({ ...dto, table });
  }

  @UseGuards(OpenSessionGuard)
  @Delete()
  deleteItem(@Req() req: RequestWithSession, @Body() dto: DeleteBasketItemDto) {
    const table = String(req.diningSession!.table.number);
    return this.basketService.deleteItem(table, dto.id, dto.sauces);
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
