import type { SauceSnapshot } from "../common/types/sauce-snapshot";
import type { LocalizedText } from "../common/i18n/localized-text";

interface SelectableSauce {
  id: string;
  name: string;
  nameTranslations?: LocalizedText;
  price: number;
  isActive: boolean;
}

export function normalizeSauceIds(sauceIds: string[] = []): string[] {
  return [...new Set(sauceIds)].sort();
}

// selectedIds has already been normalized. Stored duplicates remain significant.
export function matchesSauceSelection(sauces: SauceSnapshot[], selectedIds: string[]): boolean {
  return JSON.stringify(sauces.map((sauce) => sauce.id).sort()) === JSON.stringify(selectedIds);
}

export function selectSauceSnapshots(
  links: Array<{ sauce: SelectableSauce }> | undefined,
  selectedIds: string[],
): SauceSnapshot[] | null {
  const activeSauces = new Map(
    (links ?? [])
      .map((link) => link.sauce)
      .filter((sauce) => sauce.isActive)
      .map((sauce) => [sauce.id, sauce]),
  );
  if (selectedIds.some((id) => !activeSauces.has(id))) return null;

  return selectedIds.map((id) => {
    const sauce = activeSauces.get(id)!;
    return { id: sauce.id, name: sauce.name, nameTranslations: sauce.nameTranslations, unitPrice: sauce.price };
  });
}
