import { EventEmitter2 } from '@nestjs/event-emitter';
import { Optional } from '@nestjs/common';
import { storedImageContent } from "../common/http/image-response";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Sauce } from "src/entities/sauce.entity";
import { ILike, Repository } from "typeorm";
import { CreateSauceDto } from "./dto/create-sauce.dto";
import { UpdateSauceDto } from "./dto/update-sauce.dto";
import {
  updatedLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";
import { decodeImage, imageReplacement } from "src/common/utils/image-upload.util";

@Injectable()
export class SaucesService {
  constructor(
    @InjectRepository(Sauce)
    private readonly saucesRepo: Repository<Sauce>,
    @Optional() private readonly events?: EventEmitter2,
  ) {}

  findAll(): Promise<Sauce[]> {
    return this.saucesRepo.find({
      order: {
        isActive: "DESC",
        name: "ASC",
      },
    });
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const sauce = await this.saucesRepo
      .createQueryBuilder("sauce")
      .addSelect("sauce.imageData")
      .where("sauce.id = :id", { id })
      .getOne();

    return storedImageContent(sauce?.imageData, sauce?.imageMimeType, "Sauce image not found");
  }

  async create(dto: CreateSauceDto): Promise<Sauce> {
    const nameTranslations = withLegacyEnglish(
      dto.nameTranslations,
      dto.name,
    );
    const name = primaryLocalizedText(nameTranslations);
    if (!name) {
      throw new BadRequestException("Sauce name cannot be empty");
    }

    const existingSauce = await this.saucesRepo.findOne({
      where: {
        name: ILike(name),
      },
    });

    if (existingSauce) {
      throw new ConflictException("Sauce already exists");
    }

    const image = dto.image?.data ? decodeImage(dto.image, "sauce-image") : {};
    const sauce = this.saucesRepo.create({
      name,
      nameTranslations,
      price: dto.price,
      isActive: dto.isActive ?? true,
      imageName: null,
      imageMimeType: null,
      imageData: null,
      ...image,
    });

    const saved = await this.saucesRepo.save(sauce);
    this.events?.emit('menu:catalog-changed');
    return saved;
  }

  async update(id: string, dto: UpdateSauceDto): Promise<Sauce> {
    const sauce = await this.saucesRepo.findOne({ where: { id } });
    if (!sauce) {
      throw new NotFoundException("Sauce not found");
    }

    if (
      dto.name === undefined &&
      dto.nameTranslations === undefined &&
      dto.price === undefined &&
      dto.isActive === undefined &&
      dto.image === undefined &&
      dto.removeImage === undefined
    ) {
      throw new BadRequestException("At least one field must be provided");
    }

    if (dto.name !== undefined || dto.nameTranslations !== undefined) {
      const nameTranslations = updatedLocalizedText(sauce.nameTranslations, dto.nameTranslations, dto.name);
      const name = primaryLocalizedText(nameTranslations);
      if (!name) {
        throw new BadRequestException("Sauce name cannot be empty");
      }
      const existingSauce = await this.saucesRepo.findOne({
        where: { name: ILike(name) },
      });
      if (existingSauce && existingSauce.id !== id) {
        throw new ConflictException("Sauce already exists");
      }
      sauce.name = name;
      sauce.nameTranslations = nameTranslations;
    }
    if (dto.price !== undefined) {
      sauce.price = dto.price;
    }
    if (dto.isActive !== undefined) {
      sauce.isActive = dto.isActive;
    }

    Object.assign(sauce, imageReplacement(dto.image, dto.removeImage, "sauce-image"));

    const saved = await this.saucesRepo.save(sauce);
    this.events?.emit('menu:catalog-changed');
    return saved;
  }

  async remove(id: string): Promise<{ success: true }> {
    const result = await this.saucesRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException("Sauce not found");
    }
    this.events?.emit('menu:catalog-changed');
    return { success: true };
  }
}
