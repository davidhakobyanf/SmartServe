import { Product } from "src/entities/product.entity";

export function productResponse(product: Product, activeSaucesOnly = false) {
  const { sauceLinks, ...data } = product;
  const sauces = (sauceLinks ?? [])
    .map((link) => link.sauce)
    .filter((sauce) => !activeSaucesOnly || sauce.isActive)
    .map((sauce) => ({
      id: sauce.id,
      name: sauce.name,
      price: sauce.price,
      isActive: sauce.isActive,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { ...data, sauces };
}

export function productsResponse(
  products: Product[],
  activeSaucesOnly = false,
) {
  return products.map((product) =>
    productResponse(product, activeSaucesOnly),
  );
}
