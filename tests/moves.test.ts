import { describe, expect, it } from "vitest";
import { MOVES, MOVE_CATEGORY, initMovesFromJson, getMoveById } from "../js/data/moves.ts";

describe("moves data", () => {
  it("JSONから技を初期化できる", () => {
    initMovesFromJson({
      moves: [
        {
          id: "EMBER",
          name: "ひのこ",
          type: "FIRE",
          power: 40,
          accuracy: 0.95,
          category: MOVE_CATEGORY.SPECIAL,
          staminaCost: 1,
        },
      ],
    });

    const move = getMoveById("EMBER");
    expect(move).not.toBeNull();
    expect(move?.name).toBe("ひのこ");
    expect(move?.category).toBe(MOVE_CATEGORY.SPECIAL);
    expect(MOVES.EMBER?.power).toBe(40);
  });

  it("不正なcategoryはphysicalへフォールバックする", () => {
    initMovesFromJson({
      moves: [
        {
          id: "BROKEN_CAT",
          name: "テスト",
          type: "NORMAL",
          category: "invalid",
        },
      ],
    });

    expect(getMoveById("BROKEN_CAT")?.category).toBe(MOVE_CATEGORY.PHYSICAL);
  });

  it("targetDefenseStageがJSONから正しく取り込まれる", () => {
    initMovesFromJson({
      moves: [
        {
          id: "SHELL_BREAK",
          name: "シェルブレイク",
          type: "NORMAL",
          category: MOVE_CATEGORY.STATUS,
          targetDefenseStage: -1,
        },
      ],
    });

    expect(getMoveById("SHELL_BREAK")?.targetDefenseStage).toBe(-1);
  });
});
