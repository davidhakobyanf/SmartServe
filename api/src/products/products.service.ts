import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { Category } from "src/entities/category.entity";
import { Product } from "src/entities/product.entity";
import { Repository } from "typeorm";
import { UpdateProductDto } from "./dto/update-product.dto";

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
    const product = this.productsRepo.create({
      categoryId: category.id,
      category,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? "",
      price: dto.price,
      sauces: dto.sauces ?? [],
      isActive: dto.isActive ?? true,
    });
    return this.productsRepo.save(product);
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

    return this.productsRepo.save(product);
  }
}
