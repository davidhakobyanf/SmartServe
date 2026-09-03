import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Product } from "./product.entity";
import { Sauce } from "./sauce.entity";

@Entity("product_sauces")
@Index("IDX_product_sauces_sauceId", ["sauceId"])
export class ProductSauce {
  @PrimaryColumn({
    type: "uuid",
  })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.sauceLinks, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "productId",
  })
  product!: Product;

  @PrimaryColumn({
    type: "uuid",
  })
  sauceId!: string;

  @ManyToOne(() => Sauce, (sauce) => sauce.productLinks, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "sauceId",
  })
  sauce!: Sauce;
}
