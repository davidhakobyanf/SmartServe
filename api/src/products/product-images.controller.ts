import { sendImage } from "../common/http/image-response";
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ProductsService } from "./products.service";

@Controller("api/product-images")
export class ProductImagesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(":id")
  async getImage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.productsService.getImage(id);
    sendImage(response, image);
  }
}
