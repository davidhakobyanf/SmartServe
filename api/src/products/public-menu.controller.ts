import { Controller, Get, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { OpenSessionGuard } from "src/common/guards/open-session.guard";

@Controller("api/menu")
export class PublicMenuController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(OpenSessionGuard)
  @Get()
  findActiveMenu() {
    return this.productsService.findActiveMenu();
  }
}
