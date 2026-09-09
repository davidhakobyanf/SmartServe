import { EventEmitter2 } from '@nestjs/event-emitter';
import { Optional } from '@nestjs/common';
import { storedImageContent } from "../common/http/image-response";
import { isForeignKeyViolation } from "../database/database-error";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/entities/category.entity";
import { Product } from "src/entities/product.entity";
import { Repository } from "typeorm";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import {
  updatedLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";
import { decodeImage, imageReplacement } from "src/common/utils/image-upload.util";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @Optional() private readonly events?: EventEmitter2,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: {
        sortOrder: "ASC",
        name: "ASC",
      },
    });
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const category = await this.categoryRepository
      .createQueryBuilder("category")
      .addSelect("category.imageData")
      .where("category.id = :id", { id })
      .getOne();

    return storedImageContent(category?.imageData, category?.imageMimeType, "Category image not found");
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const nameTranslations = withLegacyEnglish(
      dto.nameTranslations,
      dto.name,
    );
    const name = primaryLocalizedText(nameTranslations);
    if (!name) {
      throw new BadRequestException(
        "A category name is required in at least one language",
      );
    }
    const existngCategory = await this.categoryRepository.findOne({
      where: { name },
    });

    if (existngCategory) {
      throw new ConflictException("Category already exists");
    }

    const image = dto.image?.data
      ? decodeImage(dto.image, "category-image")
      : {};
    const category = this.categoryRepository.create({
      name,
      nameTranslations,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      imageName: null,
      imageMimeType: null,
      imageData: null,
      ...image,
    });

    const saved = await this.categoryRepository.save(category);
    this.events?.emit('menu:catalog-changed');
    return saved;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (dto.name !== undefined || dto.nameTranslations !== undefined) {
      const nameTranslations = updatedLocalizedText(category.nameTranslations, dto.nameTranslations, dto.name);
      const name = primaryLocalizedText(nameTranslations);
      if (!name) {
        throw new BadRequestException(
          "A category name is required in at least one language",
        );
      }

      const existingCategory = await this.categoryRepository.findOne({
        where: { name },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException("Category already exists");
      }

      category.name = name;
      category.nameTranslations = nameTranslations;
    }

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    Object.assign(category, imageReplacement(dto.image, dto.removeImage, "category-image"));

    const saved = await this.categoryRepository.save(category);
    this.events?.emit('menu:catalog-changed');
    return saved;
  }

  async remove(id: string): Promise<{ success: true }> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const productsCount = await this.productsRepository.count({
      where: { categoryId: id },
    });
    if (productsCount > 0) {
      throw new ConflictException(
        "Category cannot be deleted while it contains products",
      );
    }

    try {
      const result = await this.categoryRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException("Category not found");
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          "Category cannot be deleted while it contains products",
        );
      }
      throw error;
    }

    this.events?.emit('menu:catalog-changed');
    return { success: true };
  }
}
