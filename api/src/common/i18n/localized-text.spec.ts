import { cleanLocalizedText, normalizeContentLocale, primaryLocalizedText, resolveLocalizedText, withLegacyEnglish, updatedLocalizedText } from "./localized-text";
import { localizedNameResponse } from "./localized-response";

describe("Content localization contract", () => {
  it("distinguishes translation replacement from a legacy English update", () => {
    const current = { en: "Old", ru: "Русский" };
    expect(updatedLocalizedText(current, undefined, " New ")).toEqual({ en: "New", ru: "Русский" });
    expect(updatedLocalizedText(current, { am: " Հայերեն " }, "ignored")).toEqual({ am: "Հայերեն" });
    expect(updatedLocalizedText(current, {}, undefined)).toEqual({});
    expect(updatedLocalizedText(current, null, undefined)).toEqual({});
    expect(updatedLocalizedText(current, undefined, " ")).toEqual({ en: "", ru: "Русский" });
    expect(current).toEqual({ en: "Old", ru: "Русский" });
  });
  it.each([["hy-AM", "am"], ["ru-RU,en;q=0.9", "ru"], ["de", "en"], [undefined, "en"]])("normalizes %s to %s", (header, expected) => {
    expect(normalizeContentLocale(header)).toBe(expected);
  });
  it("preserves fallback order, whitespace cleaning and legacy names", () => {
    expect(resolveLocalizedText({ ru: " Русский ", am: " Հայերեն " }, "Legacy", "de")).toBe("Հայերեն");
    expect(resolveLocalizedText({}, " Legacy ", "ru")).toBe("Legacy");
    expect(withLegacyEnglish({ en: "Existing", ru: " Русский " }, "New")).toEqual({ en: "Existing", ru: "Русский" });
    expect(primaryLocalizedText({ ru: "Русский", am: "Հայերեն" })).toBe("Հայերեն");
    expect(cleanLocalizedText({ en: " ", ru: " Русский " })).toEqual({ ru: "Русский" });
    expect(localizedNameResponse({ id: "1", name: null })).toEqual({ id: "1", name: null });
  });
});
