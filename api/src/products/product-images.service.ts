import { storedImageContent } from "../common/http/image-response";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { ProductImageDto } from "./dto/product-image.dto";
import { decodeImage } from "../common/utils/image-upload.util";

@Injectable()
export class ProductImagesService {
  constructor(@InjectRepository(Product) private readonly productsRepo: Repository<Product>) {}

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const product = await this.productsRepo
      .createQueryBuilder("product")
      .addSelect("product.imageData")
      .where("product.id = :id", { id })
      .getOne();

    return storedImageContent(product?.imageData, product?.imageMimeType, "Product image not found");
  }

  applyUpload(product: Product, image?: ProductImageDto): void {
    if (image?.data) {
      Object.assign(product, decodeImage(image, "product-image"));
    } else if (image) {
      if (image.name !== undefined) {
        product.imageName = image.name.trim() || product.imageName;
      }
      if (image.mimeType !== undefined) {
        product.imageMimeType =
          image.mimeType.trim() || product.imageMimeType;
      }
    }
  }
}
