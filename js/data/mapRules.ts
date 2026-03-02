import {
  getRandomWildMonster,
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
} from "./monsters.ts";
import { pickByWeight } from "./weightedRandom.ts";

export const MAP_KEYS = {
  EMOJI_TOWN: "EMOJI_TOWN",
  HOUSE1: "HOUSE1",
  LAB: "LAB",
  TOWN_SHOP: "TOWN_SHOP",
  FOREST: "FOREST",
  FOREST_GYM: "FOREST_GYM",
  MISTY_SWAMP: "MISTY_SWAMP",
  SWAMP_SHOP: "SWAMP_SHOP",
  CORAL_REEF: "CORAL_REEF",
  CRYSTAL_CAVE: "CRYSTAL_CAVE",
  VOLCANIC_PASS: "VOLCANIC_PASS",
  VOLCANO_SHOP: "VOLCANO_SHOP",
  SAND_VALLEY: "SAND_VALLEY",
  SAND_VALLEY_SHOP: "SAND_VALLEY_SHOP",
  SKY_RUINS: "SKY_RUINS",
  DARK_TOWER: "DARK_TOWER",
  SHADOW_GROVE: "SHADOW_GROVE",
  ANCIENT_LIBRARY: "ANCIENT_LIBRARY",
  FROZEN_PEAK: "FROZEN_PEAK",
  FROZEN_GYM: "FROZEN_GYM",
  FROZEN_SHOP: "FROZEN_SHOP",
  CELESTIAL_GARDEN: "CELESTIAL_GARDEN",
  GARDEN_SHOP: "GARDEN_SHOP",
  STARFALL_BASIN: "STARFALL_BASIN",
  BASIN_SHOP: "BASIN_SHOP",
};

export const WEATHER = {
  NONE: "NONE",
  SUNNY: "SUNNY",
  RAINY: "RAINY",
  WINDY: "WINDY",
  SNOWY: "SNOWY",
};

const DEFAULT_MAP_KEY = MAP_KEYS.EMOJI_TOWN;

export const AREA_THEME = {
  TOWN: "TOWN",
  FOREST: "FOREST",
  CAVE: "CAVE",
  VOLCANO: "VOLCANO",
  ICE: "ICE",
  RUINS: "RUINS",
};

const WEATHER_ROLL_TABLE_BY_MAP = {
  [MAP_KEYS.CRYSTAL_CAVE]: [
    { weather: WEATHER.NONE, threshold: 0.75 },
    { weather: WEATHER.WINDY, threshold: 0.9 },
    { weather: WEATHER.SUNNY, threshold: 1 },
  ],
  [MAP_KEYS.VOLCANIC_PASS]: [
    { weather: WEATHER.NONE, threshold: 0.75 },
    { weather: WEATHER.WINDY, threshold: 0.9 },
    { weather: WEATHER.SUNNY, threshold: 1 },
  ],
  [MAP_KEYS.SKY_RUINS]: [
    { weather: WEATHER.WINDY, threshold: 0.45 },
    { weather: WEATHER.SUNNY, threshold: 0.7 },
    { weather: WEATHER.RAINY, threshold: 0.82 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.DARK_TOWER]: [
    { weather: WEATHER.NONE, threshold: 0.7 },
    { weather: WEATHER.WINDY, threshold: 0.9 },
    { weather: WEATHER.RAINY, threshold: 1 },
  ],
  [MAP_KEYS.FROZEN_PEAK]: [
    { weather: WEATHER.SNOWY, threshold: 0.45 },
    { weather: WEATHER.WINDY, threshold: 0.65 },
    { weather: WEATHER.NONE, threshold: 0.85 },
    { weather: WEATHER.RAINY, threshold: 1 },
  ],
  [MAP_KEYS.CELESTIAL_GARDEN]: [
    { weather: WEATHER.SUNNY, threshold: 0.5 },
    { weather: WEATHER.WINDY, threshold: 0.75 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.FOREST]: [
    { weather: WEATHER.RAINY, threshold: 0.3 },
    { weather: WEATHER.WINDY, threshold: 0.55 },
    { weather: WEATHER.SUNNY, threshold: 0.7 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.MISTY_SWAMP]: [
    { weather: WEATHER.RAINY, threshold: 0.5 },
    { weather: WEATHER.WINDY, threshold: 0.7 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.CORAL_REEF]: [
    { weather: WEATHER.SUNNY, threshold: 0.4 },
    { weather: WEATHER.RAINY, threshold: 0.65 },
    { weather: WEATHER.WINDY, threshold: 0.8 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.SAND_VALLEY]: [
    { weather: WEATHER.SUNNY, threshold: 0.55 },
    { weather: WEATHER.WINDY, threshold: 0.8 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  [MAP_KEYS.SHADOW_GROVE]: [
    { weather: WEATHER.NONE, threshold: 0.6 },
    { weather: WEATHER.RAINY, threshold: 0.8 },
    { weather: WEATHER.WINDY, threshold: 1 },
  ],
  [MAP_KEYS.ANCIENT_LIBRARY]: [
    { weather: WEATHER.NONE, threshold: 0.7 },
    { weather: WEATHER.WINDY, threshold: 0.85 },
    { weather: WEATHER.SUNNY, threshold: 1 },
  ],
  [MAP_KEYS.STARFALL_BASIN]: [
    { weather: WEATHER.WINDY, threshold: 0.35 },
    { weather: WEATHER.SNOWY, threshold: 0.55 },
    { weather: WEATHER.SUNNY, threshold: 0.75 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
  DEFAULT: [
    { weather: WEATHER.SUNNY, threshold: 0.25 },
    { weather: WEATHER.RAINY, threshold: 0.4 },
    { weather: WEATHER.WINDY, threshold: 0.5 },
    { weather: WEATHER.NONE, threshold: 1 },
  ],
};

const AREA_THEME_BY_MAP = {
  [MAP_KEYS.FOREST]: AREA_THEME.FOREST,
  [MAP_KEYS.MISTY_SWAMP]: AREA_THEME.FOREST,
  [MAP_KEYS.CORAL_REEF]: AREA_THEME.FOREST,
  [MAP_KEYS.CRYSTAL_CAVE]: AREA_THEME.CAVE,
  [MAP_KEYS.DARK_TOWER]: AREA_THEME.CAVE,
  [MAP_KEYS.SHADOW_GROVE]: AREA_THEME.CAVE,
  [MAP_KEYS.VOLCANIC_PASS]: AREA_THEME.VOLCANO,
  [MAP_KEYS.VOLCANO_SHOP]: AREA_THEME.VOLCANO,
  [MAP_KEYS.SAND_VALLEY]: AREA_THEME.VOLCANO,
  [MAP_KEYS.SAND_VALLEY_SHOP]: AREA_THEME.VOLCANO,
  [MAP_KEYS.FROZEN_PEAK]: AREA_THEME.ICE,
  [MAP_KEYS.FROZEN_GYM]: AREA_THEME.ICE,
  [MAP_KEYS.FROZEN_SHOP]: AREA_THEME.ICE,
  [MAP_KEYS.SKY_RUINS]: AREA_THEME.RUINS,
  [MAP_KEYS.CELESTIAL_GARDEN]: AREA_THEME.RUINS,
  [MAP_KEYS.GARDEN_SHOP]: AREA_THEME.RUINS,
  [MAP_KEYS.ANCIENT_LIBRARY]: AREA_THEME.RUINS,
  [MAP_KEYS.STARFALL_BASIN]: AREA_THEME.RUINS,
  [MAP_KEYS.BASIN_SHOP]: AREA_THEME.RUINS,
};

const BATTLE_BACKGROUND_THEME_BY_AREA_THEME = {
  [AREA_THEME.TOWN]: "TOWN",
  [AREA_THEME.FOREST]: "FOREST",
  [AREA_THEME.CAVE]: "CAVE",
  [AREA_THEME.VOLCANO]: "VOLCANO",
  [AREA_THEME.ICE]: "CAVE",
  [AREA_THEME.RUINS]: "RUINS",
};

const FOREST_ENCOUNTER_FACTORY_BY_MAP = {
  [MAP_KEYS.CRYSTAL_CAVE]: getCaveWildMonster,
  [MAP_KEYS.VOLCANIC_PASS]: getVolcanoWildMonster,
  [MAP_KEYS.SKY_RUINS]: getRuinsWildMonster,
  [MAP_KEYS.DARK_TOWER]: getDarkTowerWildMonster,
  [MAP_KEYS.FROZEN_PEAK]: getFrozenPeakWildMonster,
  [MAP_KEYS.CELESTIAL_GARDEN]: getGardenWildMonster,
  [MAP_KEYS.MISTY_SWAMP]: getSwampWildMonster,
  [MAP_KEYS.CORAL_REEF]: getCoralWildMonster,
  [MAP_KEYS.SAND_VALLEY]: getSandValleyWildMonster,
  [MAP_KEYS.SHADOW_GROVE]: getShadowGroveWildMonster,
  [MAP_KEYS.ANCIENT_LIBRARY]: getLibraryWildMonster,
  [MAP_KEYS.STARFALL_BASIN]: getBasinWildMonster,
};

export function normalizeMapKey(mapKey) {
  return mapKey || DEFAULT_MAP_KEY;
}

export function getAreaTheme(mapKey) {
  const safeMapKey = normalizeMapKey(mapKey);
  return AREA_THEME_BY_MAP[safeMapKey] || AREA_THEME.TOWN;
}

export function getBattleBackgroundTheme(mapKey) {
  const areaTheme = getAreaTheme(mapKey);
  return BATTLE_BACKGROUND_THEME_BY_AREA_THEME[areaTheme] || "TOWN";
}

export function rollWeatherForMap(mapKey, randomValue = Math.random()) {
  const safeMapKey = normalizeMapKey(mapKey);
  const table = WEATHER_ROLL_TABLE_BY_MAP[safeMapKey] || WEATHER_ROLL_TABLE_BY_MAP.DEFAULT;
  const found = table.find((entry) => randomValue < entry.threshold);
  return found ? found.weather : WEATHER.NONE;
}

function normalizeHour(hour) {
  if (!Number.isFinite(hour)) return 12;
  const normalized = Math.floor(hour) % 24;
  return normalized >= 0 ? normalized : normalized + 24;
}

function getTimeWeatherMultiplier(weather, hour) {
  const h = normalizeHour(hour);
  const isMorning = h >= 6 && h < 11;
  const isDaytime = h >= 11 && h < 17;
  const isEvening = h >= 17 && h < 20;

  if (isMorning) {
    if (weather === WEATHER.SUNNY) return 1.45;
    if (weather === WEATHER.RAINY) return 0.85;
    if (weather === WEATHER.WINDY) return 0.95;
    return 1;
  }

  if (isDaytime) {
    if (weather === WEATHER.SUNNY) return 1.3;
    if (weather === WEATHER.RAINY) return 0.9;
    if (weather === WEATHER.SNOWY) return 0.95;
    if (weather === WEATHER.NONE) return 0.95;
    return 1;
  }

  if (isEvening) {
    if (weather === WEATHER.WINDY) return 1.25;
    if (weather === WEATHER.RAINY) return 1.1;
    if (weather === WEATHER.SUNNY) return 0.9;
    return 1;
  }

  if (weather === WEATHER.RAINY) return 1.25;
  if (weather === WEATHER.WINDY) return 1.2;
  if (weather === WEATHER.SNOWY) return 1.3;
  if (weather === WEATHER.SUNNY) return 0.55;
  if (weather === WEATHER.NONE) return 1.05;
  return 1;
}

export function rollWeatherForMapByHour(mapKey, hour, randomValue = Math.random()) {
  const safeMapKey = normalizeMapKey(mapKey);
  const table = WEATHER_ROLL_TABLE_BY_MAP[safeMapKey] || WEATHER_ROLL_TABLE_BY_MAP.DEFAULT;

  let previousThreshold = 0;
  const weightedTable = table.map((entry) => {
    const baseWeight = Math.max(0, entry.threshold - previousThreshold);
    previousThreshold = entry.threshold;
    const adjustedWeight = baseWeight * getTimeWeatherMultiplier(entry.weather, hour);
    return {
      weather: entry.weather,
      weight: adjustedWeight,
    };
  });

  const picked = pickByWeight(weightedTable, (entry) => entry.weight, randomValue);
  return picked?.weather || WEATHER.NONE;
}

export function createWildMonsterForEncounter(mapKey, isForest = false) {
  if (!isForest) return getRandomWildMonster();

  const safeMapKey = normalizeMapKey(mapKey);
  const factory = FOREST_ENCOUNTER_FACTORY_BY_MAP[safeMapKey] || getForestWildMonster;
  return factory();
}
