import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { Category } from "src/entities/category.entity";
import { Product } from "src/entities/product.entity";
import { In, QueryFailedError, Repository } from "typeorm";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductSauce } from "src/entities/product-sauce.entity";
import { Sauce } from "src/entities/sauce.entity";
import { BasketItem } from "src/entities/basket-item.entity";
import { decodeImage } from "src/common/utils/image-upload.util";
import {
  cleanLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,

    @InjectRepository(ProductSauce)
    private readonly productSaucesRepo: Repository<ProductSauce>,

    @InjectRepository(Sauce)
    private readonly saucesRepo: Repository<Sauce>,

    @InjectRepository(BasketItem)
    private readonly basketItemsRepo: Repository<BasketItem>,
  ) {}

  private normalizeSauceIds(sauceIds: string[] = []): string[] {
    return [...new Set(sauceIds)].sort();
  }

  private async validateSauceIds(sauceIds: string[] = []): Promise<string[]> {
    const normalizedIds = this.normalizeSauceIds(sauceIds);
    if (normalizedIds.length === 0) return [];

    const sauces = await this.saucesRepo.findBy({
      id: In(normalizedIds),
    });
    if (sauces.length !== normalizedIds.length) {
      throw new BadRequestException("One or more sauces do not exist");
    }

    return normalizedIds;
  }

  private async replaceSauceLinks(
    productId: string,
    sauceIds: string[],
  ): Promise<void> {
    await this.productSaucesRepo.delete({ productId });
    if (sauceIds.length === 0) return;

    await this.productSaucesRepo.save(
      sauceIds.map((sauceId) =>
        this.productSaucesRepo.create({ productId, sauceId }),
      ),
    );
  }

  private findOneWithDetails(id: string): Promise<Product> {
    return this.productsRepo.findOneOrFail({
      where: { id },
      relations: {
        category: true,
        sauceLinks: {
          sauce: true,
        },
      },
    });
  }

  private async findCategory(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
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
        sauceLinks: {
          sauce: true,
        },
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
        sauceLinks: {
          sauce: true,
        },
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
    const sauceIds = await this.validateSauceIds(dto.sauceIds);
    const image = dto.image?.data
      ? decodeImage(dto.image, "product-image")
      : {};
    const titleTranslations = withLegacyEnglish(
      dto.titleTranslations,
      dto.title,
    );
    const title = primaryLocalizedText(titleTranslations);
    if (!title) {
      throw new BadRequestException(
        "A product title is required in at least one language",
      );
    }
    const descriptionTranslations = withLegacyEnglish(
      dto.descriptionTranslations,
      dto.description,
    );
    const product = this.productsRepo.create({
      categoryId: category.id,
      category,
      title,
      titleTranslations,
      description: primaryLocalizedText(descriptionTranslations),
      descriptionTranslations,
      price: dto.price,
      isActive: dto.isActive ?? true,
      imageName: dto.image?.name?.trim() || null,
      imageMimeType: dto.image?.mimeType?.trim() || null,
      imageData: null,
      ...image,
    });
    const saved = await this.productsRepo.save(product);
    await this.replaceSauceLinks(saved.id, sauceIds);
    return this.findOneWithDetails(saved.id);
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

    if (dto.title !== undefined || dto.titleTranslations !== undefined) {
      const titleTranslations =
        dto.titleTranslations !== undefined
          ? cleanLocalizedText(dto.titleTranslations)
          : withLegacyEnglish(product.titleTranslations, dto.title);
      if (dto.title !== undefined && dto.titleTranslations === undefined) {
        titleTranslations.en = dto.title.trim();
      }
      const title = primaryLocalizedText(titleTranslations);
      if (!title) {
        throw new BadRequestException(
          "A product title is required in at least one language",
        );
      }
      product.title = title;
      product.titleTranslations = titleTranslations;
    }
    if (
      dto.description !== undefined ||
      dto.descriptionTranslations !== undefined
    ) {
      const descriptionTranslations =
        dto.descriptionTranslations !== undefined
          ? cleanLocalizedText(dto.descriptionTranslations)
          : withLegacyEnglish(
              product.descriptionTranslations,
              dto.description,
            );
      if (
        dto.description !== undefined &&
        dto.descriptionTranslations === undefined
      ) {
        descriptionTranslations.en = dto.description.trim();
      }
      product.descriptionTranslations = descriptionTranslations;
      product.description = primaryLocalizedText(descriptionTranslations);
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    if (dto.image?.data) {
      Object.assign(product, decodeImage(dto.image, "product-image"));
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
    if (dto.sauceIds !== undefined) {
      const sauceIds = await this.validateSauceIds(dto.sauceIds);
      await this.replaceSauceLinks(id, sauceIds);
    }
    return this.findOneWithDetails(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const basketItemsCount = await this.basketItemsRepo.count({
      where: { productId: id },
    });
    if (basketItemsCount > 0) {
      throw new ConflictException(
        "Product cannot be deleted while it is in a guest basket",
      );
    }

    try {
      const result = await this.productsRepo.delete(id);
      if (!result.affected) {
        throw new NotFoundException("Product not found");
      }
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === "23503"
      ) {
        throw new ConflictException(
          "Product cannot be deleted while it is in a guest basket",
        );
      }
      throw error;
    }

    return { success: true };
  }
}
