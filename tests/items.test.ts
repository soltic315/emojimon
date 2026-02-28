import { beforeEach, describe, expect, it } from "vitest";
import { ITEMS, getItemById, initItemsFromJson } from "../js/data/items.ts";

describe("items data", () => {
  beforeEach(() => {
    Object.keys(ITEMS).forEach((key) => {
      delete ITEMS[key];
    });
  });

  it("JSONからアイテムを初期化できる", () => {
    initItemsFromJson({
      items: [
        {
          id: "POTION",
          name: "ポーション",
          emoji: "🧪",
          description: "HPを20回復",
          battleUsable: true,
          price: 200,
          effect: { heal: 20 },
          catchBonus: 0.1,
        },
      ],
    });

    const item = getItemById("POTION");
    expect(item).not.toBeNull();
    expect(item?.name).toBe("ポーション");
    expect(item?.battleUsable).toBe(true);
    expect(item?.price).toBe(200);
    expect(item?.effect).toEqual({ heal: 20 });
    expect(item?.catchBonus).toBe(0.1);
  });

  it("未指定プロパティはデフォルト値で補完される", () => {
    initItemsFromJson({
      items: [
        {
          id: "BASIC_BALL",
          name: "ベーシックボール",
        },
      ],
    });

    expect(getItemById("BASIC_BALL")).toEqual({
      id: "BASIC_BALL",
      name: "ベーシックボール",
      emoji: "",
      description: "",
      battleUsable: false,
      price: 0,
      effect: null,
      catchBonus: 0,
    });
  });
});
