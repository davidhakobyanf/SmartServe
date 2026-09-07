import { matchesSauceSelection, normalizeSauceIds, selectSauceSnapshots } from "./sauce-selection";

describe("Sauce selection", () => {
  it("normalizes without mutating input and compares against stored IDs", () => {
    const ids = ["b", "a", "b"];
    const normalized = normalizeSauceIds(ids);
    expect(normalized).toEqual(["a", "b"]);
    expect(ids).toEqual(["b", "a", "b"]);
    const snapshots = ids.slice(0, 2).map((id) => ({ id, name: id, unitPrice: 1 }));
    expect(matchesSauceSelection(snapshots, normalized)).toBe(true);
    expect(matchesSauceSelection([...snapshots, snapshots[0]], normalized)).toBe(false);
    expect(normalizeSauceIds()).toEqual([]);
  });

  it("rejects inactive/unlinked sauces and preserves selected order, prices and translations", () => {
    const links = [
      { sauce: { id: "a", name: "A", price: 12.5, isActive: true, nameTranslations: { ru: "А" } } },
      { sauce: { id: "b", name: "B", price: 20, isActive: false } },
    ];
    expect(selectSauceSnapshots(links, ["b"])).toBeNull();
    expect(selectSauceSnapshots(links, ["missing"])).toBeNull();
    expect(selectSauceSnapshots(links, ["a"])).toEqual([{ id: "a", name: "A", nameTranslations: { ru: "А" }, unitPrice: 12.5 }]);
    expect(selectSauceSnapshots(undefined, [])).toEqual([]);
  });
});
