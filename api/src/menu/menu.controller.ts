import { Body, Controller, Delete, Patch, Put } from '@nestjs/common';
import { MenuService } from './menu.service';
import {
  CreateMenuCardDto,
  DeleteMenuCardDto,
  UpdateMenuCardDto,
} from './dto/menu-card.dto';

@Controller('api/user/login')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Patch()
  addCard(@Body() dto: CreateMenuCardDto) {
    return this.menuService.addCard(dto);
  }

  @Delete()
  deleteCard(@Body() dto: DeleteMenuCardDto) {
    return this.menuService.deleteCard(dto.id);
  }

  @Put()
  editCard(@Body() dto: UpdateMenuCardDto) {
    return this.menuService.editCard(dto);
  }
}
