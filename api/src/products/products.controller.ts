import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { ProductsService } from "./products.service";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { productResponse, productsResponse } from "./product-response";

@Controller("api/products")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions(Permission.MENU_VIEW)
  async findAll(@Headers("accept-language") locale?: string) {
    return productsResponse(await this.productsService.findAll(), false, locale);
  }

  @Post()
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  async create(
    @Body() dto: CreateProductDto,
    @Headers("accept-language") locale?: string,
  ) {
    return productResponse(await this.productsService.create(dto), false, locale);
  }

  @Patch(":id")
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
    @Headers("accept-language") locale?: string,
  ) {
    return productResponse(
      await this.productsService.update(id, dto),
      false,
      locale,
    );
  }
}
