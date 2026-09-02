import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { Category } from "src/entities/category.entity";
import { Product } from "src/entities/product.entity";
import { Repository } from "typeorm";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductImageDto } from "./dto/product-image.dto";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  private async findCategory(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  private decodeImage(image: ProductImageDto): {
    imageName: string;
    imageMimeType: string;
    imageData: Buffer;
  } {
    const mimeType = image.mimeType?.trim() || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      throw new BadRequestException("Invalid image type");
    }

    const base64 = image.data?.replace(/\s/g, "") ?? "";
    if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
      throw new BadRequestException("Invalid image data");
    }

    const imageData = Buffer.from(base64, "base64");
    if (imageData.length === 0 || imageData.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException("Image must be smaller than 5 MB");
    }

    return {
      imageName: image.name?.trim() || "product-image",
      imageMimeType: mimeType,
      imageData,
    };
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const product = await this.productsRepo
      .createQueryBuilder("product")
      .addSelect("product.imageData")
      .where("product.id = :id", { id })
      .getOne();

    if (!product?.imageData) {
      throw new NotFoundException("Product image not found");
    }

    return {
      buffer: product.imageData,
      mimeType: product.imageMimeType || "image/jpeg",
    };
  }

  findAll(): Promise<Product[]> {
    return this.productsRepo.find({
      relations: {
        category: true,
      },
      order: {
        title: "ASC",
      },
    });
  }

  findActiveMenu(): Promise<Product[]> {
    return this.productsRepo.find({
      where: {
        isActive: true,
        category: {
          isActive: true,
        },
      },
      relations: {
        category: true,
      },
      order: {
        category: {
          sortOrder: "ASC",
        },
        title: "ASC",
      },
    });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.findCategory(dto.categoryId);
    const image = dto.image?.data ? this.decodeImage(dto.image) : {};
    const product = this.productsRepo.create({
      categoryId: category.id,
      category,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? "",
      price: dto.price,
      sauces: dto.sauces ?? [],
      isActive: dto.isActive ?? true,
      imageName: dto.image?.name?.trim() || null,
      imageMimeType: dto.image?.mimeType?.trim() || null,
      imageData: null,
      ...image,
    });
    const saved = await this.productsRepo.save(product);
    return this.productsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    if (dto.categoryId !== undefined) {
      const category = await this.findCategory(dto.categoryId);
      product.categoryId = category.id;
      product.category = category;
    }

    if (dto.title !== undefined) {
      product.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      product.description = dto.description.trim();
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.sauces !== undefined) {
      product.sauces = dto.sauces;
    }
    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    if (dto.image?.data) {
      Object.assign(product, this.decodeImage(dto.image));
    } else if (dto.image) {
      if (dto.image.name !== undefined) {
        product.imageName = dto.image.name.trim() || product.imageName;
      }
      if (dto.image.mimeType !== undefined) {
        product.imageMimeType =
          dto.image.mimeType.trim() || product.imageMimeType;
      }
    }

    await this.productsRepo.save(product);
    return this.productsRepo.findOneOrFail({
      where: { id },
      relations: { category: true },
    });
  }
}
