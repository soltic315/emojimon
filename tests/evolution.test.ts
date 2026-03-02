import { beforeEach, describe, expect, it } from "vitest";
import { MONSTERS } from "../js/data/monsters.ts";
import { checkEvolution, checkItemEvolution } from "../js/data/evolution.ts";

describe("evolution checks", () => {
  beforeEach(() => {
    Object.keys(MONSTERS).forEach((key) => {
      delete MONSTERS[key];
    });
  });

  it("LEVEL条件を満たすと進化先を返す", () => {
    const base = {
      id: "BASE_MON",
      name: "ベース",
      evolution: {
        evolvesTo: "EVOLVED_MON",
        condition: {
          type: "LEVEL",
          value: 10,
        },
      },
    };
    const evolved = { id: "EVOLVED_MON", name: "しんか" };
    MONSTERS.EVOLVED_MON = evolved;

    const result = checkEvolution({ species: base, level: 10 });
    expect(result).toBe(evolved);
  });

  it("LEVEL条件を満たさない場合は進化しない", () => {
    const base = {
      id: "BASE_MON",
      name: "ベース",
      evolution: {
        evolvesTo: "EVOLVED_MON",
        condition: {
          type: "LEVEL",
          value: 12,
        },
      },
    };
    MONSTERS.EVOLVED_MON = { id: "EVOLVED_MON", name: "しんか" };

    const result = checkEvolution({ species: base, level: 11 });
    expect(result).toBeNull();
  });

  it("ITEM条件が一致すると進化先を返す", () => {
    const base = {
      id: "ITEM_BASE",
      name: "アイテムベース",
      evolution: {
        evolvesTo: "ITEM_EVOLVED",
        condition: {
          type: "ITEM",
          value: "FIRE_CRYSTAL",
        },
      },
    };
    const evolved = { id: "ITEM_EVOLVED", name: "アイテムしんか" };
    MONSTERS.ITEM_EVOLVED = evolved;

    const result = checkItemEvolution({ species: base, level: 1 }, "FIRE_CRYSTAL");
    expect(result).toBe(evolved);
  });

  it("ITEM条件が不一致なら進化しない", () => {
    const base = {
      id: "ITEM_BASE",
      name: "アイテムベース",
      evolution: {
        evolvesTo: "ITEM_EVOLVED",
        condition: {
          type: "ITEM",
          value: "THUNDER_CRYSTAL",
        },
      },
    };
    MONSTERS.ITEM_EVOLVED = { id: "ITEM_EVOLVED", name: "アイテムしんか" };

    const result = checkItemEvolution({ species: base, level: 1 }, "ICE_CRYSTAL");
    expect(result).toBeNull();
  });
});
