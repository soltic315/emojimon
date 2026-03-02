import { describe, expect, it, vi } from "vitest";
import { determineSpeedOrder, chooseOpponentMove } from "../js/scenes/battle/battleTurnFlow.ts";
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

describe("chooseOpponentMove", () => {
  it("スタミナ不足で全技が使えない場合はnullを返す", () => {
    const heavyMove = {
      id: "HEAVY_TEST",
      name: "ヘビーテスト",
      type: "NORMAL",
      category: "special",
      power: 95,
      accuracy: 1,
      pp: 5,
    };
    const opponent = {
      species: {
        baseStats: { maxHp: 60, attack: 55, defense: 50, speed: 50 },
        primaryType: "NORMAL",
        learnset: [heavyMove],
      },
      level: 12,
      currentHp: 40,
      attackStage: 0,
      defenseStage: 0,
      statusCondition: StatusCondition.NONE,
      stamina: 0,
      moveIds: ["HEAVY_TEST"],
    };
    const player = {
      species: { baseStats: { maxHp: 60, attack: 50, defense: 50, speed: 50 }, primaryType: "NORMAL" },
      level: 12,
      currentHp: 40,
      attackStage: 0,
      defenseStage: 0,
      statusCondition: StatusCondition.NONE,
    };
    const scene = {
      isBoss: false,
      isArena: false,
      isTrainer: false,
      isFinalBoss: false,
      getEffectiveness: () => 1,
      calculateDamage: () => ({ damage: 10 }),
    } as any;

    const originalPhaser = (globalThis as any).Phaser;
    (globalThis as any).Phaser = {
      Math: { Clamp: (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)) },
      Utils: { Array: { GetRandom: (arr: any[]) => arr[0] } },
    };

    const result = chooseOpponentMove(scene, opponent as any, player as any);
    (globalThis as any).Phaser = originalPhaser;

    expect(result).toBeNull();
  });
});
