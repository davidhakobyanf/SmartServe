import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Sauce } from "../entities/sauce.entity";
import { ProductSauce } from "../entities/product-sauce.entity";
import { normalizeSauceIds } from "../sauces/sauce-selection";

@Injectable()
export class ProductSaucesService {
  constructor(
    @InjectRepository(ProductSauce) private readonly productSaucesRepo: Repository<ProductSauce>,
    @InjectRepository(Sauce) private readonly saucesRepo: Repository<Sauce>,
  ) {}

  async validateIds(sauceIds: string[] = []): Promise<string[]> {
    const normalizedIds = normalizeSauceIds(sauceIds);
    if (normalizedIds.length === 0) return [];

    const sauces = await this.saucesRepo.findBy({
      id: In(normalizedIds),
    });
    if (sauces.length !== normalizedIds.length) {
      throw new BadRequestException("One or more sauces do not exist");
    }

    return normalizedIds;
  }

  async replaceLinks(
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
}
