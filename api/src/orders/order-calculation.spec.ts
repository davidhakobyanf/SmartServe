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
      unitPrice: 0.1, quantity: 3, sauces: input.sauces, lineTotal: 0.9,
    });
    input.product.title = "New title";
    expect(snapshot.titleSnapshot).toBe("Burger");
    expect(calculateOrderTotal([snapshot, { lineTotal: 0.2 }])).toBe(1.1);
    expect(calculateOrderTotal([])).toBe(0);
  });

  it("preserves the existing Math.round algorithm, including floating-point edge cases", () => {
    expect(roundMoney(1.005)).toBe(1);
    expect(roundMoney(12.345)).toBe(12.35);
  });
});
