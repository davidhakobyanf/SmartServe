import { isForeignKeyViolation } from "../database/database-error";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { updatedLocalizedText, primaryLocalizedText, withLegacyEnglish } from "../common/i18n/localized-text";
import { decodeImage } from "../common/utils/image-upload.util";
import { ProductsRepository } from "./products.repository";
import { ProductSaucesService } from "./product-sauces.service";
import { ProductImagesService } from "./product-images.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly productSauces: ProductSaucesService,
    private readonly images: ProductImagesService,
  ) {}

  private async findCategory(id: string): Promise<Category> {
    const category = await this.products.findCategory(id);

    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  getImage(id: string) {
    return this.images.getImage(id);
  }

  findAll(): Promise<Product[]> {
    return this.products.findAll();
  }

  findActiveMenu(): Promise<Product[]> {
    return this.products.findActiveMenu();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.findCategory(dto.categoryId);
    const sauceIds = await this.productSauces.validateIds(dto.sauceIds);
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
    const product = this.products.create({
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
    const saved = await this.products.save(product);
    await this.productSauces.replaceLinks(saved.id, sauceIds);
    return this.products.findOneWithDetails(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.products.findForUpdate(id);

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    if (dto.categoryId !== undefined) {
      const category = await this.findCategory(dto.categoryId);
      product.categoryId = category.id;
      product.category = category;
    }

    if (dto.title !== undefined || dto.titleTranslations !== undefined) {
      const titleTranslations = updatedLocalizedText(product.titleTranslations, dto.titleTranslations, dto.title);
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
      const descriptionTranslations = updatedLocalizedText(product.descriptionTranslations, dto.descriptionTranslations, dto.description);
      product.descriptionTranslations = descriptionTranslations;
      product.description = primaryLocalizedText(descriptionTranslations);
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    this.images.applyUpload(product, dto.image);

    await this.products.save(product);
    if (dto.sauceIds !== undefined) {
      const sauceIds = await this.productSauces.validateIds(dto.sauceIds);
      await this.productSauces.replaceLinks(id, sauceIds);
    }
    return this.products.findOneWithDetails(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const basketItemsCount = await this.products.countBasketItems(id);
    if (basketItemsCount > 0) {
      throw new ConflictException(
        "Product cannot be deleted while it is in a guest basket",
      );
    }

    try {
      const result = await this.products.delete(id);
      if (!result.affected) {
        throw new NotFoundException("Product not found");
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          "Product cannot be deleted while it is in a guest basket",
        );
      }
      throw error;
    }

    return { success: true };
  }
}
