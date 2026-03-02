import { describe, expect, it, vi } from "vitest";
import { determineSpeedOrder } from "../js/scenes/battle/battleTurnFlow.ts";
import { StatusCondition } from "../js/scenes/battle/battleConstants.ts";

function createMonster(speed: number, speedStage = 0, statusCondition = StatusCondition.NONE) {
  return {
    species: {
      name: "TEST",
      baseStats: { maxHp: 40, attack: 30, defense: 30, speed },
    },
    level: 10,
    speedStage,
    statusCondition,
  };
}

describe("determineSpeedOrder", () => {
  it("優先度が異なる場合は素早さより優先度を優先する", () => {
    const scene = {
      getActivePlayer: () => createMonster(20),
      battle: { opponent: createMonster(200) },
      chooseOpponentMove: () => ({ priority: 0 }),
      _pendingOpponentMove: null,
    } as any;

    const result = determineSpeedOrder(scene, { priority: 1 });
    expect(result).toBe("player");
  });

  it("同優先度では素早さ補正（ステージ・まひ）を考慮する", () => {
    const scene = {
      getActivePlayer: () => createMonster(80, 1, StatusCondition.NONE),
      battle: { opponent: createMonster(120, 0, StatusCondition.PARALYSIS) },
      chooseOpponentMove: () => ({ priority: 0 }),
      _pendingOpponentMove: null,
    } as any;

    const result = determineSpeedOrder(scene, { priority: 0 });
    expect(result).toBe("player");
  });

  it("完全同速時はランダムで先攻が決まる", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.75);
    const scene = {
      getActivePlayer: () => createMonster(60),
      battle: { opponent: createMonster(60) },
      chooseOpponentMove: () => ({ priority: 0 }),
      _pendingOpponentMove: null,
    } as any;

    const result = determineSpeedOrder(scene, { priority: 0 });
    expect(result).toBe("opponent");

    randomSpy.mockRestore();
  });
});
