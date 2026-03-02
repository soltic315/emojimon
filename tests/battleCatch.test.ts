import { describe, expect, it } from "vitest";
import { calculateCatchRate } from "../js/scenes/battle/battleCatch.ts";
import { StatusCondition } from "../js/scenes/battle/battleConstants.ts";

function createSpecies(catchRate = 0.4) {
  return {
    id: "TEST_MON",
    name: "テストモン",
    baseStats: {
      maxHp: 100,
      attack: 50,
      defense: 50,
      speed: 50,
    },
    catchRate,
  };
}

describe("battle catch rate", () => {
  it("HPが低いほど捕獲率が上がる", () => {
    const species = createSpecies(0.4);
    const highHp = {
      species,
      level: 10,
      currentHp: 120,
      statusCondition: StatusCondition.NONE,
      catchRateMultiplier: 1,
    };
    const lowHp = {
      species,
      level: 10,
      currentHp: 20,
      statusCondition: StatusCondition.NONE,
      catchRateMultiplier: 1,
    };

    const high = calculateCatchRate(highHp, 1);
    const low = calculateCatchRate(lowHp, 1);

    expect(low).toBeGreaterThan(high);
  });

  it("ボール補正が高いほど捕獲率が上がる", () => {
    const opponent = {
      species: createSpecies(0.35),
      level: 10,
      currentHp: 30,
      statusCondition: StatusCondition.NONE,
      catchRateMultiplier: 1,
    };

    const basicBall = calculateCatchRate(opponent, 1);
    const betterBall = calculateCatchRate(opponent, 1.8);

    expect(betterBall).toBeGreaterThan(basicBall);
  });

  it("状態異常時は捕獲率が上がる", () => {
    const species = createSpecies(0.3);
    const normal = {
      species,
      level: 10,
      currentHp: 35,
      statusCondition: StatusCondition.NONE,
      catchRateMultiplier: 1,
    };
    const asleep = {
      ...normal,
      statusCondition: StatusCondition.SLEEP,
    };

    const normalRate = calculateCatchRate(normal, 1);
    const sleepRate = calculateCatchRate(asleep, 1);

    expect(sleepRate).toBeGreaterThan(normalRate);
  });

  it("マスターボール相当は確定捕獲になる", () => {
    const opponent = {
      species: createSpecies(0.03),
      level: 20,
      currentHp: 80,
      statusCondition: StatusCondition.NONE,
      catchRateMultiplier: 1,
    };

    expect(calculateCatchRate(opponent, 100)).toBe(1);
  });
});
