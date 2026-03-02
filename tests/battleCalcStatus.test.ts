import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateDamage } from "../js/scenes/battle/battleCalcStatus.ts";
import { StatusCondition } from "../js/scenes/battle/battleConstants.ts";

function createSpecies(primaryType: string) {
  return {
    id: `${primaryType}_MON`,
    name: `${primaryType}モン`,
    primaryType,
    secondaryType: null,
    baseStats: {
      maxHp: 100,
      attack: 60,
      defense: 60,
      speed: 60,
    },
  };
}

function mockPhaser(randomFactor = 1) {
  (globalThis as any).Phaser = {
    Math: {
      FloatBetween: vi.fn(() => randomFactor),
      Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
    },
  };
}

describe("battle damage calculation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("STAB時は非STABよりダメージが高い", () => {
    mockPhaser(1);
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const attacker = {
      species: createSpecies("FIRE"),
      level: 10,
      statusCondition: StatusCondition.NONE,
      abilityId: null,
    };
    const defender = {
      species: createSpecies("NORMAL"),
      level: 10,
      abilityId: null,
    };
    const scene = { weather: "NONE", battle: { player: attacker } };

    const stabMove = { power: 50, type: "FIRE", category: "physical" };
    const nonStabMove = { power: 50, type: "WATER", category: "physical" };

    const stab = calculateDamage(scene, attacker, defender, stabMove);
    const nonStab = calculateDamage(scene, attacker, defender, nonStabMove);

    expect(stab.damage).toBeGreaterThan(nonStab.damage);
  });

  it("SUNNY下のほのお技は天候補正で強化される", () => {
    mockPhaser(1);
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const attacker = {
      species: createSpecies("FIRE"),
      level: 10,
      statusCondition: StatusCondition.NONE,
      abilityId: null,
    };
    const defender = {
      species: createSpecies("NORMAL"),
      level: 10,
      abilityId: null,
    };
    const move = { power: 50, type: "FIRE", category: "physical" };

    const sunny = calculateDamage({ weather: "SUNNY", battle: { player: attacker } }, attacker, defender, move);
    const none = calculateDamage({ weather: "NONE", battle: { player: attacker } }, attacker, defender, move);

    expect(sunny.weatherBoosted).toBe(true);
    expect(sunny.damage).toBeGreaterThan(none.damage);
  });

  it("急所時は通常時よりダメージが高い", () => {
    mockPhaser(1);

    const attacker = {
      species: createSpecies("NORMAL"),
      level: 10,
      statusCondition: StatusCondition.NONE,
      abilityId: null,
      bond: 0,
    };
    const defender = {
      species: createSpecies("NORMAL"),
      level: 10,
      abilityId: null,
    };
    const scene = { weather: "NONE", battle: { player: attacker } };
    const move = { power: 50, type: "NORMAL", category: "physical" };

    vi.spyOn(Math, "random").mockReturnValueOnce(0.0);
    const critical = calculateDamage(scene, attacker, defender, move);

    vi.restoreAllMocks();
    mockPhaser(1);
    vi.spyOn(Math, "random").mockReturnValueOnce(0.99);
    const normal = calculateDamage(scene, attacker, defender, move);

    expect(critical.critical).toBe(true);
    expect(critical.damage).toBeGreaterThan(normal.damage);
  });

  it("やけど時の物理技はダメージが減衰する", () => {
    mockPhaser(1);
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const attackerNormal = {
      species: createSpecies("NORMAL"),
      level: 10,
      statusCondition: StatusCondition.NONE,
      abilityId: null,
    };
    const attackerBurn = {
      ...attackerNormal,
      statusCondition: StatusCondition.BURN,
    };
    const defender = {
      species: createSpecies("NORMAL"),
      level: 10,
      abilityId: null,
    };
    const move = { power: 50, type: "NORMAL", category: "physical" };

    const normal = calculateDamage({ weather: "NONE", battle: { player: attackerNormal } }, attackerNormal, defender, move);
    const burn = calculateDamage({ weather: "NONE", battle: { player: attackerBurn } }, attackerBurn, defender, move);

    expect(burn.damage).toBeLessThan(normal.damage);
  });
});
