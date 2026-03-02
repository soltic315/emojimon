import { beforeAll, describe, expect, it } from "vitest";
import {
  initWildPools,
  getForestWildMonster,
  getCaveWildMonster,
  getVolcanoWildMonster,
  getRuinsWildMonster,
  getDarkTowerWildMonster,
  getFrozenPeakWildMonster,
  getGardenWildMonster,
  getSwampWildMonster,
  getCoralWildMonster,
  getSandValleyWildMonster,
  getShadowGroveWildMonster,
  getLibraryWildMonster,
  getBasinWildMonster,
  getGymBoss2Monster,
} from "../js/data/wildEncounters.ts";
import { MONSTERS } from "../js/data/monsters.ts";

function makeSpecies(id: string) {
  return {
    id,
    name: id,
    primaryType: "NORMAL",
    baseStats: { maxHp: 30, attack: 20, defense: 20, speed: 20 },
    abilityRates: [{ abilityId: "STURDY", acquisitionRate: 1 }],
    spawnRate: 1,
    learnset: [],
  };
}

beforeAll(() => {
  globalThis.Phaser = {
    Math: {
      Between: (min: number) => min,
    },
  } as any;
});

describe("wildEncounters pools", () => {
  const registry = {
    FOREST_MON: makeSpecies("FOREST_MON"),
    CAVE_MON: makeSpecies("CAVE_MON"),
    VOLCANO_MON: makeSpecies("VOLCANO_MON"),
    RUINS_MON: makeSpecies("RUINS_MON"),
    DARK_MON: makeSpecies("DARK_MON"),
    ICE_MON: makeSpecies("ICE_MON"),
    GARDEN_MON: makeSpecies("GARDEN_MON"),
    SWAMP_MON: makeSpecies("SWAMP_MON"),
    CORAL_MON: makeSpecies("CORAL_MON"),
    SAND_MON: makeSpecies("SAND_MON"),
    SHADOW_MON: makeSpecies("SHADOW_MON"),
    LIBRARY_MON: makeSpecies("LIBRARY_MON"),
    BASIN_MON: makeSpecies("BASIN_MON"),
  };

  initWildPools({
    forestPoolIds: ["FOREST_MON"],
    cavePoolIds: ["CAVE_MON"],
    volcanoPoolIds: ["VOLCANO_MON"],
    ruinsPoolIds: ["RUINS_MON"],
    darkTowerPoolIds: ["DARK_MON"],
    frozenPeakPoolIds: ["ICE_MON"],
    gardenPoolIds: ["GARDEN_MON"],
    swampPoolIds: ["SWAMP_MON"],
    coralPoolIds: ["CORAL_MON"],
    sandValleyPoolIds: ["SAND_MON"],
    shadowGrovePoolIds: ["SHADOW_MON"],
    libraryPoolIds: ["LIBRARY_MON"],
    basinPoolIds: ["BASIN_MON"],
    gymBoss2: { id: "ICE_MON", level: 32 },
  }, registry);

  it("各エリアの出現プールから対応モンスターが生成される", () => {
    expect(getForestWildMonster()?.species.id).toBe("FOREST_MON");
    expect(getCaveWildMonster()?.species.id).toBe("CAVE_MON");
    expect(getVolcanoWildMonster()?.species.id).toBe("VOLCANO_MON");
    expect(getRuinsWildMonster()?.species.id).toBe("RUINS_MON");
    expect(getDarkTowerWildMonster()?.species.id).toBe("DARK_MON");
    expect(getFrozenPeakWildMonster()?.species.id).toBe("ICE_MON");
    expect(getGardenWildMonster()?.species.id).toBe("GARDEN_MON");
    expect(getSwampWildMonster()?.species.id).toBe("SWAMP_MON");
    expect(getCoralWildMonster()?.species.id).toBe("CORAL_MON");
    expect(getSandValleyWildMonster()?.species.id).toBe("SAND_MON");
    expect(getShadowGroveWildMonster()?.species.id).toBe("SHADOW_MON");
    expect(getLibraryWildMonster()?.species.id).toBe("LIBRARY_MON");
    expect(getBasinWildMonster()?.species.id).toBe("BASIN_MON");
  });

  it("第2ジムボスがgymBoss2定義を参照する", () => {
    MONSTERS.ICE_MON = registry.ICE_MON as any;
    expect(getGymBoss2Monster()?.species.id).toBe("ICE_MON");
    expect(getGymBoss2Monster()?.isBoss).toBe(true);
    delete MONSTERS.ICE_MON;
  });
});
