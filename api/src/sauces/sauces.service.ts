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

@Injectable()
export class SaucesService {
  constructor(
    @InjectRepository(Sauce)
    private readonly saucesRepo: Repository<Sauce>,
  ) {}

  findAll(): Promise<Sauce[]> {
    return this.saucesRepo.find({
      order: {
        isActive: "DESC",
        name: "ASC",
      },
    });
  }

  async create(dto: CreateSauceDto): Promise<Sauce> {
    const name = dto.name.trim();
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

    const sauce = this.saucesRepo.create({
      name,
      price: dto.price,
      isActive: dto.isActive ?? true,
    });

    return this.saucesRepo.save(sauce);
  }

  async update(id: string, dto: UpdateSauceDto): Promise<Sauce> {
    const sauce = await this.saucesRepo.findOne({ where: { id } });
    if (!sauce) {
      throw new NotFoundException("Sauce not found");
    }

    if (
      dto.name === undefined &&
      dto.price === undefined &&
      dto.isActive === undefined
    ) {
      throw new BadRequestException("At least one field must be provided");
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
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
    }
    if (dto.price !== undefined) {
      sauce.price = dto.price;
    }
    if (dto.isActive !== undefined) {
      sauce.isActive = dto.isActive;
    }

    return this.saucesRepo.save(sauce);
  }
}
