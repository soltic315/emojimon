import {
  getRandomWildMonster,
  getForestWildMonster,
  getCaveWildMonster,
  getVolcanoWildMonster,
  getRuinsWildMonster,
  getDarkTowerWildMonster,
  getFrozenPeakWildMonster,
  getGardenWildMonster,
} from "./monsters.ts";

export const MAP_KEYS = {
  EMOJI_TOWN: "EMOJI_TOWN",
  HOUSE1: "HOUSE1",
  FOREST: "FOREST",
  CRYSTAL_CAVE: "CRYSTAL_CAVE",
  VOLCANIC_PASS: "VOLCANIC_PASS",
  SKY_RUINS: "SKY_RUINS",
  DARK_TOWER: "DARK_TOWER",
  FROZEN_PEAK: "FROZEN_PEAK",
  CELESTIAL_GARDEN: "CELESTIAL_GARDEN",
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
};

const FOREST_ENCOUNTER_FACTORY_BY_MAP = {
  [MAP_KEYS.CRYSTAL_CAVE]: getCaveWildMonster,
  [MAP_KEYS.VOLCANIC_PASS]: getVolcanoWildMonster,
  [MAP_KEYS.SKY_RUINS]: getRuinsWildMonster,
  [MAP_KEYS.DARK_TOWER]: getDarkTowerWildMonster,
  [MAP_KEYS.FROZEN_PEAK]: getFrozenPeakWildMonster,
  [MAP_KEYS.CELESTIAL_GARDEN]: getGardenWildMonster,
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

export function createWildMonsterForEncounter(mapKey, isForest = false) {
  if (!isForest) return getRandomWildMonster();

  const safeMapKey = normalizeMapKey(mapKey);
  const factory = FOREST_ENCOUNTER_FACTORY_BY_MAP[safeMapKey] || getForestWildMonster;
  return factory();
}
