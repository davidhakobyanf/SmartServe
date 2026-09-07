export const CONTENT_LOCALES = ["en", "am", "ru"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];
export type LocalizedText = Partial<Record<ContentLocale, string>>;

export function normalizeContentLocale(value?: string): ContentLocale {
  const locale = value?.split(",")[0]?.trim().toLowerCase().split("-")[0];
  if (locale === "hy") return "am";
  return CONTENT_LOCALES.includes(locale as ContentLocale)
    ? (locale as ContentLocale)
    : "en";
}

export function cleanLocalizedText(
  translations?: LocalizedText | null,
): LocalizedText {
  const cleaned: LocalizedText = {};

  for (const locale of CONTENT_LOCALES) {
    const value = translations?.[locale]?.trim();
    if (value) cleaned[locale] = value;
  }

  return cleaned;
}

export function withLegacyEnglish(
  translations?: LocalizedText | null,
  legacyValue?: string | null,
): LocalizedText {
  const cleaned = cleanLocalizedText(translations);
  const legacy = legacyValue?.trim();

  if (legacy && !cleaned.en) cleaned.en = legacy;
  return cleaned;
}

export function primaryLocalizedText(
  translations?: LocalizedText | null,
  legacyValue = "",
): string {
  const cleaned = cleanLocalizedText(translations);
  return cleaned.en ?? cleaned.am ?? cleaned.ru ?? legacyValue.trim();
}

// An explicit translation object replaces all translations; a legacy string
// only changes English. Keep this distinct from creation's fallback behavior.
export function updatedLocalizedText(
  current: LocalizedText | null | undefined,
  translations: LocalizedText | null | undefined,
  legacyValue: string | undefined,
): LocalizedText {
  const result = translations !== undefined
    ? cleanLocalizedText(translations)
    : withLegacyEnglish(current, legacyValue);
  if (legacyValue !== undefined && translations === undefined) {
    result.en = legacyValue.trim();
  }
  return result;
}

export function resolveLocalizedText(
  translations: LocalizedText | null | undefined,
  legacyValue: string | null | undefined,
  requestedLocale?: string,
): string {
  const cleaned = cleanLocalizedText(translations);
  const locale = normalizeContentLocale(requestedLocale);

  return (
    cleaned[locale] ??
    cleaned.en ??
    cleaned.am ??
    cleaned.ru ??
    legacyValue?.trim() ??
    ""
  );
}
