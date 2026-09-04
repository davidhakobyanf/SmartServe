import { Product } from "src/entities/product.entity";
import { resolveLocalizedText } from "src/common/i18n/localized-text";
import { localizedNameResponse } from "src/common/i18n/localized-response";

export function productResponse(
  product: Product,
  activeSaucesOnly = false,
  requestedLocale?: string,
) {
  const { sauceLinks, ...data } = product;
  const sauces = (sauceLinks ?? [])
    .map((link) => link.sauce)
    .filter((sauce) => !activeSaucesOnly || sauce.isActive)
    .map((sauce) => localizedNameResponse({
      id: sauce.id,
      name: sauce.name,
      nameTranslations: sauce.nameTranslations,
      price: sauce.price,
      isActive: sauce.isActive,
    }, requestedLocale))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    ...data,
    title: resolveLocalizedText(
      product.titleTranslations,
      product.title,
      requestedLocale,
    ),
    description: resolveLocalizedText(
      product.descriptionTranslations,
      product.description,
      requestedLocale,
    ),
    category: localizedNameResponse(product.category, requestedLocale),
    sauces,
  };
}

export function productsResponse(
  products: Product[],
  activeSaucesOnly = false,
  requestedLocale?: string,
) {
  return products.map((product) =>
    productResponse(product, activeSaucesOnly, requestedLocale),
  );
}
