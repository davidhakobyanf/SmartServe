import { Controller, Get, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { OpenSessionGuard } from "src/common/guards/open-session.guard";
import { productsResponse } from "./product-response";

@Controller("api/menu")
export class PublicMenuController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(OpenSessionGuard)
  @Get()
  async findActiveMenu() {
    return productsResponse(await this.productsService.findActiveMenu(), true);
  }
}
