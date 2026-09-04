import type { LocalizedText } from "./localized-text";
import { resolveLocalizedText } from "./localized-text";

export interface LocalizedNameRecord {
  name: string | null;
  nameTranslations?: LocalizedText;
}

export function localizedNameResponse<T extends LocalizedNameRecord>(
  value: T,
  requestedLocale?: string,
): T {
  return {
    ...value,
    name: resolveLocalizedText(
      value.nameTranslations,
      value.name,
      requestedLocale,
    ) || null,
  };
}
