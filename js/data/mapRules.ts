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

export const MAP_KEYS = {
  EMOJI_TOWN: "EMOJI_TOWN",
  HOUSE1: "HOUSE1",
  FOREST: "FOREST",
  MISTY_SWAMP: "MISTY_SWAMP",
  CORAL_REEF: "CORAL_REEF",
  CRYSTAL_CAVE: "CRYSTAL_CAVE",
  VOLCANIC_PASS: "VOLCANIC_PASS",
  SAND_VALLEY: "SAND_VALLEY",
  SKY_RUINS: "SKY_RUINS",
  DARK_TOWER: "DARK_TOWER",
  SHADOW_GROVE: "SHADOW_GROVE",
  ANCIENT_LIBRARY: "ANCIENT_LIBRARY",
  FROZEN_PEAK: "FROZEN_PEAK",
  CELESTIAL_GARDEN: "CELESTIAL_GARDEN",
  STARFALL_BASIN: "STARFALL_BASIN",
};

export const WEATHER = {
  NONE: "NONE",
  SUNNY: "SUNNY",
  RAINY: "RAINY",
  WINDY: "WINDY",
  SNOWY: "SNOWY",
};

const DEFAULT_MAP_KEY = MAP_KEYS.EMOJI_TOWN;

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

const BATTLE_BACKGROUND_THEME_BY_MAP = {
  [MAP_KEYS.CRYSTAL_CAVE]: "CAVE",
  [MAP_KEYS.VOLCANIC_PASS]: "VOLCANO",
  [MAP_KEYS.SKY_RUINS]: "RUINS",
  [MAP_KEYS.FOREST]: "FOREST",
  [MAP_KEYS.DARK_TOWER]: "CAVE",
  [MAP_KEYS.FROZEN_PEAK]: "CAVE",
  [MAP_KEYS.CELESTIAL_GARDEN]: "RUINS",
  [MAP_KEYS.MISTY_SWAMP]: "FOREST",
  [MAP_KEYS.CORAL_REEF]: "FOREST",
  [MAP_KEYS.SAND_VALLEY]: "VOLCANO",
  [MAP_KEYS.SHADOW_GROVE]: "CAVE",
  [MAP_KEYS.ANCIENT_LIBRARY]: "RUINS",
  [MAP_KEYS.STARFALL_BASIN]: "RUINS",
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

export function getBattleBackgroundTheme(mapKey) {
  const safeMapKey = normalizeMapKey(mapKey);
  return BATTLE_BACKGROUND_THEME_BY_MAP[safeMapKey] || "TOWN";
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

  const totalWeight = weightedTable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return WEATHER.NONE;

  const safeRandom = Math.min(0.999999, Math.max(0, Number.isFinite(randomValue) ? randomValue : 0));
  let cursor = safeRandom * totalWeight;
  for (const entry of weightedTable) {
    cursor -= entry.weight;
    if (cursor < 0) return entry.weather;
  }

  return weightedTable[weightedTable.length - 1]?.weather || WEATHER.NONE;
}

export function createWildMonsterForEncounter(mapKey, isForest = false) {
  if (!isForest) return getRandomWildMonster();

  const safeMapKey = normalizeMapKey(mapKey);
  const factory = FOREST_ENCOUNTER_FACTORY_BY_MAP[safeMapKey] || getForestWildMonster;
  return factory();
}
