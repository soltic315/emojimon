import { MOVES } from "./moves.ts";

export const TYPES = ["NORMAL", "FIRE", "WATER", "GRASS", "ELECTRIC", "ICE"];

// 特性マスタ（8種）
const DEFAULT_ABILITIES = {
  BLAZE: {
    id: "BLAZE",
    name: "えんしん",
    description: "HPが1/3以下のとき、ほのおわざの威力が上がる。",
  },
  TORRENT: {
    id: "TORRENT",
    name: "りゅうすい",
    description: "HPが1/3以下のとき、みずわざの威力が上がる。",
  },
  OVERGROW: {
    id: "OVERGROW",
    name: "しげみ",
    description: "HPが1/3以下のとき、くさわざの威力が上がる。",
  },
  STURDY: {
    id: "STURDY",
    name: "いわかべ",
    description: "受けるダメージを少し軽減する。",
  },
  MOTOR_DRIVE: {
    id: "MOTOR_DRIVE",
    name: "らいどう",
    description: "HPが1/3以下のとき、でんきわざの威力が上がる。",
  },
  ICE_BODY: {
    id: "ICE_BODY",
    name: "ひょうがい",
    description: "HPが1/3以下のとき、こおりわざの威力が上がる。",
  },
  INTIMIDATE: {
    id: "INTIMIDATE",
    name: "あつりょく",
    description: "威圧感で相手の攻撃を弱め、受けるダメージを軽減する。",
  },
  SWIFT_SWIM: {
    id: "SWIFT_SWIM",
    name: "かそくひれ",
    description: "素早い身のこなしで、受けるダメージを少し軽減する。",
  },
};

export const ABILITIES = {};

function repairMojibakeText(value) {
  if (typeof value !== "string" || value.length === 0) return value;
  const mojibakePattern = /(?:Ã.|ã.|â.|ï.)/;
  if (!mojibakePattern.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (!repaired || repaired.includes("�")) return value;
    return repaired;
  } catch {
    return value;
  }
}

const DEFAULT_ABILITY_BY_TYPE = {
  FIRE: "BLAZE",
  WATER: "TORRENT",
  GRASS: "OVERGROW",
  NORMAL: "STURDY",
  ELECTRIC: "MOTOR_DRIVE",
  ICE: "ICE_BODY",
};

const DEFAULT_FUSION_RECIPES = {
  "BLAZEBIRD+PYREBEAR": "AURORO",
  "BLAZEBIRD+STARLITE": "AURORO",
  "CINDERCUB+FINBUB": "MISTRAY",
  "BLIZZCAT+DROPLET": "GLACIERA",
  "CRYSTALINE+THORNVINE": "BRAMBLEON",
  "SHADOWPAW+SKYPIP": "RUNEFOX",
};

// タイプ相性表 6×6（攻撃側 -> 防御側）
export const TYPE_EFFECTIVENESS = {
  FIRE: {
    GRASS: 2, ICE: 2,
    WATER: 0.5, FIRE: 0.5,
  },
  WATER: {
    FIRE: 2,
    GRASS: 0.5, WATER: 0.5,
  },
  GRASS: {
    WATER: 2,
    FIRE: 0.5, GRASS: 0.5,
  },
  ELECTRIC: {
    WATER: 2,
    GRASS: 0.5, ELECTRIC: 0.5,
  },
  ICE: {
    GRASS: 2, NORMAL: 1.5,
    FIRE: 0.5, ICE: 0.5,
  },
};

// JSON から初期化されるモンスター定義
export const MONSTERS = {};
let wildPool = [];
let forestPool = [];
let cavePool = [];
let volcanoPool = [];
let ruinsPool = [];
let darkTowerPool = [];
let frozenPeakPool = [];
let gardenPool = [];
let gymBossData = null;
let gymBoss2Data = null;
let fusionRecipes = { ...DEFAULT_FUSION_RECIPES };

function normalizeFusionKey(speciesIdA, speciesIdB) {
  if (!speciesIdA || !speciesIdB) return null;
  return [speciesIdA, speciesIdB].sort().join("+");
}

export function getFusionRecipeResult(speciesIdA, speciesIdB) {
  const key = normalizeFusionKey(speciesIdA, speciesIdB);
  if (!key) return null;
  return fusionRecipes[key] || null;
}

function normalizeAbilityRates(raw, fallbackAbilityId) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ abilityId: fallbackAbilityId, acquisitionRate: 1 }];
  }

  const normalized = raw
    .map((entry) => {
      const abilityId = typeof entry?.abilityId === "string" ? entry.abilityId : "";
      const acquisitionRate = Number.isFinite(entry?.acquisitionRate)
        ? Math.max(0, entry.acquisitionRate)
        : 0;
      if (!abilityId || acquisitionRate <= 0) return null;
      return { abilityId, acquisitionRate };
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    return [{ abilityId: fallbackAbilityId, acquisitionRate: 1 }];
  }

  return normalized;
}

function pickByWeight(entries, randomValue = Math.random()) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight || 0), 0);
  if (totalWeight <= 0) return entries[0];

  const safeRandom = Math.max(0, Math.min(0.999999, Number.isFinite(randomValue) ? randomValue : 0));
  let cursor = safeRandom * totalWeight;
  for (const entry of entries) {
    cursor -= Math.max(0, entry.weight || 0);
    if (cursor < 0) return entry;
  }

  return entries[entries.length - 1];
}

function pickWeightedMonster(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const weightedPool = pool.map((species) => ({
    value: species,
    weight: Number.isFinite(species?.spawnRate) ? Math.max(0, species.spawnRate) : 1,
  }));
  const picked = pickByWeight(weightedPool);
  return picked?.value || pool[0];
}

export function rollMonsterAbilityId(species) {
  if (!species) return "STURDY";
  const rates = Array.isArray(species.abilityRates) && species.abilityRates.length > 0
    ? species.abilityRates
    : [{
      abilityId: species.abilityId || DEFAULT_ABILITY_BY_TYPE[species.primaryType] || "STURDY",
      acquisitionRate: 1,
    }];
  const weighted = rates.map((entry) => ({
    value: entry.abilityId,
    weight: Number.isFinite(entry.acquisitionRate) ? Math.max(0, entry.acquisitionRate) : 0,
  }));
  const picked = pickByWeight(weighted);
  return picked?.value || rates[0].abilityId;
}

function createMonsterEntry(base, level, extra = {}) {
  const stats = calcStats(base, level);
  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    bond: 0,
    attackStage: 0,
    defenseStage: 0,
    abilityId: rollMonsterAbilityId(base),
    pp: (base.learnset || []).map((m) => m.pp || 10),
    ...extra,
  };
}

function normalizeSubEmoji(rawSubEmoji) {
  if (!Array.isArray(rawSubEmoji)) return [];

  return rawSubEmoji
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const emoji = typeof entry.emoji === "string" ? entry.emoji : "";
      if (!emoji) return null;

      const point = entry.point;
      const hasPointObject = point && typeof point === "object"
        && typeof point.x === "number" && typeof point.y === "number";
      const normalizedPoint = hasPointObject
        ? { x: point.x, y: point.y }
        : (typeof point === "string" ? point : "center");

      const size = typeof entry.size === "number" && Number.isFinite(entry.size)
        ? Math.max(0.1, entry.size)
        : 0.5;

      return {
        emoji,
        point: normalizedPoint,
        size,
      };
    })
    .filter(Boolean);
}

function setDefaultAbilities() {
  Object.keys(ABILITIES).forEach((key) => {
    delete ABILITIES[key];
  });

  Object.values(DEFAULT_ABILITIES).forEach((ability) => {
    ABILITIES[ability.id] = {
      id: ability.id,
      name: ability.name,
      description: ability.description,
    };
  });
}

export function initAbilitiesFromJson(json) {
  if (!json || !Array.isArray(json.abilities)) {
    setDefaultAbilities();
    return;
  }

  Object.keys(ABILITIES).forEach((key) => {
    delete ABILITIES[key];
  });

  json.abilities.forEach((raw) => {
    if (!raw || !raw.id) return;
    const repairedName = repairMojibakeText(raw.name || raw.id);
    const repairedDescription = repairMojibakeText(raw.description || "");
    ABILITIES[raw.id] = {
      id: raw.id,
      name: repairedName,
      description: repairedDescription,
    };
  });

  if (Object.keys(ABILITIES).length === 0) {
    setDefaultAbilities();
  }
}

setDefaultAbilities();

export function getAbilityById(abilityId) {
  if (!abilityId) return null;
  return ABILITIES[abilityId] || null;
}

// レベルに応じたステータス算出
export function calcStats(species, level) {
  const lvl = level || 1;
  return {
    maxHp: species.baseStats.maxHp + 3 * (lvl - 1),
    attack: species.baseStats.attack + (lvl - 1),
    defense: species.baseStats.defense + (lvl - 1),
    speed: species.baseStats.speed + Math.floor((lvl - 1) / 2),
  };
}

export function getUnlockedMoveCount(level, totalMoves) {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  const safeTotal = Math.max(0, Math.floor(totalMoves || 0));
  if (safeTotal === 0) return 0;
  return Math.min(safeTotal, Math.max(1, Math.floor((safeLevel + 1) / 2)));
}

export function getMovesForLevel(species, level) {
  if (!species || !Array.isArray(species.learnset)) return [];
  const safeLevel = Math.max(1, Math.floor(level || 1));
  const levels = Array.isArray(species.learnsetLevels) ? species.learnsetLevels : [];

  return species.learnset.filter((_, index) => {
    const fallbackLevel = 1 + index * 2;
    const rawLevel = levels[index];
    const learnLevel = Number.isFinite(rawLevel)
      ? Math.max(1, Math.floor(rawLevel))
      : fallbackLevel;
    return learnLevel <= safeLevel;
  });
}

export function getMonsterMoves(monsterEntry) {
  if (!monsterEntry?.species) return [];
  const levelMoves = getMovesForLevel(monsterEntry.species, monsterEntry.level || 1);
  if (!Array.isArray(monsterEntry.moveIds) || monsterEntry.moveIds.length === 0) {
    return levelMoves;
  }
  const moveById = new Map(levelMoves.map((move) => [move.id, move]));
  return monsterEntry.moveIds.map((moveId) => moveById.get(moveId)).filter(Boolean);
}

export function syncMonsterMoves(monsterEntry) {
  if (!monsterEntry?.species) return [];

  const levelMoves = getMovesForLevel(monsterEntry.species, monsterEntry.level || 1);
  const prevMoveIds = Array.isArray(monsterEntry.moveIds) ? monsterEntry.moveIds : [];
  const prevPp = Array.isArray(monsterEntry.pp) ? monsterEntry.pp : [];

  const ppById = new Map();
  if (prevMoveIds.length > 0) {
    prevMoveIds.forEach((moveId, index) => {
      if (typeof prevPp[index] === "number") ppById.set(moveId, prevPp[index]);
    });
  } else {
    (monsterEntry.species.learnset || []).forEach((move, index) => {
      if (move?.id && typeof prevPp[index] === "number") {
        ppById.set(move.id, prevPp[index]);
      }
    });
  }

  monsterEntry.moveIds = levelMoves.map((move) => move.id);
  monsterEntry.pp = levelMoves.map((move) => {
    const prev = ppById.get(move.id);
    const maxPp = Math.max(1, move.pp || 10);
    if (typeof prev === "number") {
      return Math.min(maxPp, Math.max(0, Math.floor(prev)));
    }
    return maxPp;
  });

  return levelMoves;
}

export function getLearnedMovesByLevelUp(monsterEntry, fromLevel, toLevel) {
  if (!monsterEntry?.species || toLevel <= fromLevel) return [];
  const beforeIds = new Set(getMovesForLevel(monsterEntry.species, fromLevel).map((move) => move.id));
  const afterMoves = getMovesForLevel(monsterEntry.species, toLevel);
  return afterMoves.filter((move) => !beforeIds.has(move.id));
}

export function initMonstersFromJson(json) {
  if (!json || !Array.isArray(json.monsters)) return;

  // 既存定義をクリア
  Object.keys(MONSTERS).forEach((key) => {
    delete MONSTERS[key];
  });

  fusionRecipes = { ...DEFAULT_FUSION_RECIPES };

  json.monsters.forEach((raw) => {
    const learnsetEntries = (raw.learnset || [])
      .map((entry, index) => {
        const moveId = entry?.move;
        const defaultLevel = 1 + index * 2;
        const rawLevel = entry?.level;
        const level = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : defaultLevel;
        const move = MOVES[moveId];
        if (!move) return null;
        return { move, level };
      })
      .filter(Boolean);

    const learnset = learnsetEntries.map((entry) => entry.move);
    const learnsetLevels = learnsetEntries.map((entry) => entry.level);
    const fallbackAbilityId = DEFAULT_ABILITY_BY_TYPE[raw.primaryType] || "STURDY";
    const abilityRates = normalizeAbilityRates(raw.ability, fallbackAbilityId);
    const abilityId = abilityRates[0]?.abilityId || fallbackAbilityId;
    const spawnRate = Number.isFinite(raw.spawnRate) ? Math.max(0, raw.spawnRate) : 1;
    const expYield = Math.max(1, Math.floor(raw.expYield));
    const heldItems = raw.heldItems
      .map((entry) => {
        const itemId = typeof entry?.itemId === "string" ? entry.itemId : "";
        const dropRate = Number.isFinite(entry?.dropRate)
          ? Math.max(0, Math.min(1, entry.dropRate))
          : 0;
        if (!itemId) return null;
        return { itemId, dropRate };
      })
      .filter(Boolean);
    const sizeScale = Math.max(0.1, raw.sizeScale);

    MONSTERS[raw.id] = {
      id: raw.id,
      name: raw.name,
      emoji: raw.emoji || "",
      subEmoji: normalizeSubEmoji(raw.sub_emoji),
      primaryType: raw.primaryType,
      abilityId,
      abilityRates,
      spawnRate,
      expYield,
      heldItems,
      sizeScale,
      baseStats: raw.baseStats,
      learnset,
      learnsetLevels,
      description: raw.description || "",
      catchRate: raw.catchRate,
      evolveTo: raw.evolveTo || null,
      evolveLevel: raw.evolveLevel || null,
    };

    if (Array.isArray(raw.recipe)) {
      raw.recipe.forEach((pair) => {
        if (!Array.isArray(pair) || pair.length < 2) return;
        const firstId = typeof pair[0]?.monsterId === "string" ? pair[0].monsterId : null;
        const secondId = typeof pair[1]?.monsterId === "string" ? pair[1].monsterId : null;
        const key = normalizeFusionKey(firstId, secondId);
        if (!key) return;
        fusionRecipes[key] = raw.id;
      });
    }
  });

  // 野生出現テーブル（町の草むら）
  const poolIds = Array.isArray(json.wildPoolIds)
    ? json.wildPoolIds
    : Object.keys(MONSTERS);
  wildPool = poolIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 森の出現テーブル
  const forestIds = Array.isArray(json.forestPoolIds) ? json.forestPoolIds : [];
  forestPool = forestIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 洞窟の出現テーブル
  const caveIds = Array.isArray(json.cavePoolIds) ? json.cavePoolIds : [];
  cavePool = caveIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 火山地帯の出現テーブル
  const volcanoIds = Array.isArray(json.volcanoPoolIds) ? json.volcanoPoolIds : [];
  volcanoPool = volcanoIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 遺跡エリアの出現テーブル
  const ruinsIds = Array.isArray(json.ruinsPoolIds) ? json.ruinsPoolIds : [];
  ruinsPool = ruinsIds.map((id) => MONSTERS[id]).filter(Boolean);

  // ダーク団アジトの出現テーブル
  const darkTowerIds = Array.isArray(json.darkTowerPoolIds) ? json.darkTowerPoolIds : [];
  darkTowerPool = darkTowerIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 氷峰の出現テーブル
  const frozenPeakIds = Array.isArray(json.frozenPeakPoolIds) ? json.frozenPeakPoolIds : [];
  frozenPeakPool = frozenPeakIds.map((id) => MONSTERS[id]).filter(Boolean);

  // 天空の花園の出現テーブル
  const gardenIds = Array.isArray(json.gardenPoolIds) ? json.gardenPoolIds : [];
  gardenPool = gardenIds.map((id) => MONSTERS[id]).filter(Boolean);

  // ジムボス
  gymBossData = json.gymBoss || null;
  gymBoss2Data = json.gymBoss2 || null;
}

/** 野生モンスター生成（町の草むら用） */
export function getRandomWildMonster(minLv = 3, maxLv = 5) {
  const pool = wildPool.length > 0 ? wildPool : Object.values(MONSTERS);
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(minLv, maxLv);

  return createMonsterEntry(base, level);
}

/** 森エリア用の野生モンスター */
export function getForestWildMonster() {
  const pool = forestPool.length > 0 ? forestPool : wildPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(5, 8);

  return createMonsterEntry(base, level);
}

/** 洞窟エリア用の野生モンスター */
export function getCaveWildMonster() {
  const pool = cavePool.length > 0 ? cavePool : forestPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(8, 12);

  return createMonsterEntry(base, level);
}

/** 火山エリア用の野生モンスター */
export function getVolcanoWildMonster() {
  const pool = volcanoPool.length > 0 ? volcanoPool : cavePool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(12, 16);

  return createMonsterEntry(base, level);
}

/** 遺跡エリア用の野生モンスター */
export function getRuinsWildMonster() {
  const pool = ruinsPool.length > 0 ? ruinsPool : volcanoPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(15, 20);

  return createMonsterEntry(base, level);
}

/** ダーク団アジト用の野生モンスター */
export function getDarkTowerWildMonster() {
  const pool = darkTowerPool.length > 0 ? darkTowerPool : cavePool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(18, 24);

  return createMonsterEntry(base, level);
}

/** 氷峰用の野生モンスター */
export function getFrozenPeakWildMonster() {
  const pool = frozenPeakPool.length > 0 ? frozenPeakPool : ruinsPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(22, 28);

  return createMonsterEntry(base, level);
}

/** 天空の花園用の野生モンスター */
export function getGardenWildMonster() {
  const pool = gardenPool.length > 0 ? gardenPool : ruinsPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(25, 35);

  return createMonsterEntry(base, level);
}

/** ジムボスモンスター */
export function getGymBossMonster() {
  if (!gymBossData) return getRandomWildMonster(10, 15);
  const base = MONSTERS[gymBossData.id];
  if (!base) return getRandomWildMonster(10, 15);
  const level = gymBossData.level || 15;

  return createMonsterEntry(base, level, { isBoss: true });
}

/** 第2ジムボスモンスター（氷峰ジム） */
export function getGymBoss2Monster() {
  if (!gymBoss2Data) return getRandomWildMonster(25, 32);
  const base = MONSTERS[gymBoss2Data.id];
  if (!base) return getRandomWildMonster(25, 32);
  const level = gymBoss2Data.level || 32;

  return createMonsterEntry(base, level, { isBoss: true });
}

/** 全モンスター一覧を返す（図鑑用） */
export function getAllMonsters() {
  return Object.values(MONSTERS);
}

/** 闘技場の対戦相手を生成（ラウンドに応じてレベル上昇） */
export function getArenaOpponent(round) {
  // 全モンスタープールから選出、ラウンドに応じて強くなる
  const allMons = Object.values(MONSTERS);
  if (allMons.length === 0) return getRandomWildMonster(10, 15);
  const base = pickWeightedMonster(allMons);
  if (!base) return getRandomWildMonster(10, 15);
  const baseLevel = 10 + round * 3;
  const level = Phaser.Math.Between(baseLevel, baseLevel + 2);

  return createMonsterEntry(base, level, { trainer: true });
}

/** 進化チェック: 進化可能な場合は進化後のspeciesを返す */
export function checkEvolution(monsterEntry) {
  if (!monsterEntry || !monsterEntry.species) return null;
  const species = monsterEntry.species;
  if (!species.evolveTo || !species.evolveLevel) return null;
  if (monsterEntry.level >= species.evolveLevel) {
    const evolved = MONSTERS[species.evolveTo];
    if (evolved) return evolved;
  }
  return null;
}

/** 進化を実行する */
export function evolveMonster(monsterEntry, newSpecies) {
  const oldName = monsterEntry.species.name;
  monsterEntry.species = newSpecies;
  // 進化後のHP全回復
  const newStats = calcStats(newSpecies, monsterEntry.level);
  monsterEntry.currentHp = newStats.maxHp;
  syncMonsterMoves(monsterEntry);
  return oldName;
}

