import { describe, expect, it } from "vitest";
import { validateGameData } from "../js/data/dataValidation.ts";

function createValidData() {
  return {
    moves: {
      moves: [
        {
          id: "TACKLE",
          name: "たいあたり",
          type: "NORMAL",
          power: 40,
          accuracy: 1,
          category: "physical",
          pp: 35,
        },
      ],
    },
    monsters: {
      monsters: [
        {
          id: "TESTMON",
          name: "テストモン",
          sub_emoji: [],
          primaryType: "NORMAL",
          baseStats: {
            maxHp: 40,
            attack: 40,
            defense: 40,
            speed: 40,
          },
          learnset: [{ move: "TACKLE", level: 1 }],
          catchRate: 0.3,
        },
      ],
      wildPoolIds: ["TESTMON"],
    },
    items: {
      items: [
        {
          id: "POTION",
          name: "ポーション",
          battleUsable: true,
          price: 100,
          effect: { type: "heal", amount: 20 },
        },
      ],
    },
    abilities: {
      abilities: [
        {
          id: "STURDY",
          name: "いわかべ",
          description: "ダメージ軽減",
        },
      ],
    },
  };
}

describe("data validation", () => {
  it("正しいゲームデータは検証を通過する", () => {
    const raw = createValidData();
    const parsed = validateGameData(raw);
    expect(parsed.moves.moves[0].id).toBe("TACKLE");
    expect(parsed.monsters.monsters[0].id).toBe("TESTMON");
  });

  it("不正な値がある場合はエラーを投げる", () => {
    const raw = createValidData();
    raw.moves.moves[0].accuracy = 1.5;
    expect(() => validateGameData(raw)).toThrowError(/検証に失敗/);
  });
});