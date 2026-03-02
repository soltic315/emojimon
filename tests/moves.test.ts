import { describe, expect, it } from "vitest";
import {
  MOVES,
  MOVE_CATEGORY,
  initMovesFromJson,
  getMoveById,
  getMoveStaminaCost,
} from "../js/data/moves.ts";

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

  it("既知フィールド以外の追加プロパティも保持する", () => {
    initMovesFromJson({
      moves: [
        {
          id: "FUTURE_MOVE",
          name: "みらいテスト",
          type: "NORMAL",
          category: MOVE_CATEGORY.STATUS,
          customTag: "future",
        },
      ],
    });

    const move = getMoveById("FUTURE_MOVE") as Record<string, unknown>;
    expect(move.customTag).toBe("future");
  });

  it("高威力技はスタミナコストが高く算出される", () => {
    const cost = getMoveStaminaCost({
      id: "TEST_BIG",
      category: MOVE_CATEGORY.SPECIAL,
      power: 95,
      pp: 5,
      accuracy: 0.8,
    });

    expect(cost).toBe(5);
  });

  it("変化技は同PP帯の攻撃技より軽いコストになる", () => {
    const statusCost = getMoveStaminaCost({
      id: "TEST_STATUS",
      category: MOVE_CATEGORY.STATUS,
      power: 0,
      pp: 20,
      selfDefenseStage: 1,
    });
    const attackCost = getMoveStaminaCost({
      id: "TEST_ATTACK",
      category: MOVE_CATEGORY.SPECIAL,
      power: 60,
      pp: 20,
    });

    expect(statusCost).toBeLessThan(attackCost);
    expect(statusCost).toBe(1);
    expect(attackCost).toBe(2);
  });
});
