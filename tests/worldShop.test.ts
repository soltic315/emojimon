import { describe, expect, it } from "vitest";
import { getShopInventory } from "../js/scenes/world/worldShop.ts";

describe("worldShop inventory", () => {
  it("マップごとに在庫を返し、未知マップはデフォルト在庫へフォールバックする", () => {
    const town = getShopInventory("TOWN_SHOP");
    const unknown = getShopInventory("UNKNOWN_MAP");

    expect(town.length).toBeGreaterThan(0);
    expect(unknown.length).toBe(town.length);
    expect(unknown[0].itemId).toBe(town[0].itemId);
  });

  it("在庫配列は毎回新しい参照を返す", () => {
    const first = getShopInventory("VOLCANO_SHOP");
    const second = getShopInventory("VOLCANO_SHOP");

    expect(first).not.toBe(second);
    first[0].itemId = "BROKEN";
    expect(second[0].itemId).not.toBe("BROKEN");
  });
});
