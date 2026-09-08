import { calculateOrderTotal, createOrderItemSnapshot, roundMoney } from "./order-calculation";

describe("Order calculation", () => {
  it("uses captured basket prices and includes sauces for every unit", () => {
    const input = {
      productId: "product", product: { title: "Burger", description: "Beef", price: 999 },
      unitPrice: 0.1, quantity: 3,
      sauces: [{ id: "sauce", name: "Sauce", unitPrice: 0.2 }],
    };
    const snapshot = createOrderItemSnapshot(input);
    expect(snapshot).toEqual({
      productId: "product", product: input.product,
      titleSnapshot: "Burger", descriptionSnapshot: "Beef",
      titleTranslationsSnapshot: { en: "Burger" },
      descriptionTranslationsSnapshot: { en: "Beef" },
      unitPrice: 0.1, quantity: 3, sauces: input.sauces, lineTotal: 0.9,
    });
    input.product.title = "New title";
    expect(snapshot.titleSnapshot).toBe("Burger");
    expect(calculateOrderTotal([snapshot, { lineTotal: 0.2 }])).toBe(1.1);
    expect(calculateOrderTotal([])).toBe(0);
  });

  it("captures independent translations so later menu edits do not change past orders", () => {
    const product = {
      title: "Burger", description: "Beef",
      titleTranslations: { en: "Burger", am: "Բուրգեր", ru: "Бургер" },
      descriptionTranslations: { en: "Beef", am: "Տավարի միս", ru: "Говядина" },
    };
    const snapshot = createOrderItemSnapshot({
      productId: "product", product, unitPrice: 1000, quantity: 1, sauces: [],
    });
    product.titleTranslations.am = "Changed";
    product.descriptionTranslations.ru = "Changed";
    expect(snapshot.titleTranslationsSnapshot).toEqual({ en: "Burger", am: "Բուրգեր", ru: "Бургер" });
    expect(snapshot.descriptionTranslationsSnapshot).toEqual({ en: "Beef", am: "Տավարի միս", ru: "Говядина" });
  });

  it("preserves the existing Math.round algorithm, including floating-point edge cases", () => {
    expect(roundMoney(1.005)).toBe(1);
    expect(roundMoney(12.345)).toBe(12.35);
  });
});
