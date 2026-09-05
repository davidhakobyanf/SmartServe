import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/entities/category.entity";
import { Repository } from "typeorm";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import {
  cleanLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";
import { decodeImage } from "src/common/utils/image-upload.util";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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

    if (!category?.imageData) {
      throw new NotFoundException("Category image not found");
    }

    return {
      buffer: category.imageData,
      mimeType: category.imageMimeType || "image/jpeg",
    };
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

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (dto.name !== undefined || dto.nameTranslations !== undefined) {
      const nameTranslations =
        dto.nameTranslations !== undefined
          ? cleanLocalizedText(dto.nameTranslations)
          : withLegacyEnglish(category.nameTranslations, dto.name);
      if (dto.name !== undefined && dto.nameTranslations === undefined) {
        nameTranslations.en = dto.name.trim();
      }
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

    if (dto.removeImage) {
      category.imageName = null;
      category.imageMimeType = null;
      category.imageData = null;
    } else if (dto.image?.data) {
      Object.assign(category, decodeImage(dto.image, "category-image"));
    }

    return this.categoryRepository.save(category);
  }
}
