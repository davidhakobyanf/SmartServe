import type { LocalizedText } from "../i18n/localized-text";

export interface SauceSnapshot {
  id: string;
  name: string;
  nameTranslations?: LocalizedText;
  unitPrice: number;
}
