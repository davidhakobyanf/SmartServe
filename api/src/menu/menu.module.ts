import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BasketModule } from '../basket/basket.module';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuImagesController } from './menu-images.controller';

@Module({
  imports: [UsersModule, BasketModule],
  controllers: [MenuController, MenuImagesController],
  providers: [MenuService],
})
export class MenuModule {}
