import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { MenuService } from './menu.service';

@Controller('api/menu-images')
export class MenuImagesController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':cardId')
  async getImage(
    @Param('cardId') cardId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mimeType } = await this.menuService.getCardImage(cardId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }
}
