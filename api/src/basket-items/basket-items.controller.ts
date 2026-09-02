import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  OpenSessionGuard,
  RequestWithSession,
} from "src/common/guards/open-session.guard";
import { BasketItemsService } from "./basket-items.service";
import { AddBasketItemDto } from "./dto/add-basket-item.dto";
import { UpdateBasketItemDto } from "./dto/update-basket-item.dto";

@Controller("api/basket-items")
@UseGuards(OpenSessionGuard)
export class BasketItemsController {
  constructor(private readonly basketItemsService: BasketItemsService) {}

  @Get()
  findAll(@Req() req: RequestWithSession) {
    return this.basketItemsService.findAll(req.diningSession!.id);
  }

  @Post()
  add(@Req() req: RequestWithSession, @Body() dto: AddBasketItemDto) {
    return this.basketItemsService.add(req.diningSession!.id, dto);
  }

  @Patch(":id")
  update(
    @Req() req: RequestWithSession,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBasketItemDto,
  ) {
    return this.basketItemsService.update(req.diningSession!.id, id, dto);
  }

  @Delete(":id")
  remove(
    @Req() req: RequestWithSession,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.basketItemsService.remove(req.diningSession!.id, id);
  }

  @Delete()
  clear(@Req() req: RequestWithSession) {
    return this.basketItemsService.clear(req.diningSession!.id);
  }
}
