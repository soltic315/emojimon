import { beforeEach, describe, expect, it } from "vitest";
import { MONSTERS } from "../js/data/monsters.ts";
import { checkEvolution, checkItemEvolution } from "../js/data/evolution.ts";
import { evolveMonster, syncMonsterMoves } from "../js/data/monsters.ts";

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

  it("evolveMonsterは種を更新しHPを全回復する", () => {
    const oldSpecies = {
      id: "OLD_MON",
      name: "まえ",
      baseStats: { maxHp: 20, attack: 10, defense: 10, speed: 10 },
      learnset: [],
      learnsetLevels: [],
    };
    const newSpecies = {
      id: "NEW_MON",
      name: "あと",
      baseStats: { maxHp: 40, attack: 20, defense: 20, speed: 20 },
      learnset: [],
      learnsetLevels: [],
    };
    const monsterEntry = {
      species: oldSpecies,
      level: 5,
      currentHp: 1,
      moveIds: [],
    } as any;

    const oldName = evolveMonster(monsterEntry, newSpecies as any);

    expect(oldName).toBe("まえ");
    expect(monsterEntry.species).toBe(newSpecies);
    expect(monsterEntry.currentHp).toBeGreaterThan(1);
  });

  it("syncMonsterMovesは現在レベルで覚える技を最大4件まで同期する", () => {
    const species = {
      id: "SYNC_MON",
      name: "どうき",
      learnset: [
        { id: "M1", name: "わざ1" },
        { id: "M2", name: "わざ2" },
        { id: "M3", name: "わざ3" },
        { id: "M4", name: "わざ4" },
        { id: "M5", name: "わざ5" },
      ],
      learnsetLevels: [1, 3, 5, 7, 9],
      baseStats: { maxHp: 20, attack: 10, defense: 10, speed: 10 },
    };
    const monsterEntry = {
      species,
      level: 10,
      moveIds: ["M1", "UNKNOWN"],
      stamina: 10,
    } as any;

    syncMonsterMoves(monsterEntry);

    expect(monsterEntry.moveIds).toEqual(["M1", "M2", "M3", "M4"]);
  });
});
