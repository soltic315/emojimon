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

const DEFAULT_ABILITY_BY_TYPE = {
  FIRE: "BLAZE",
  WATER: "TORRENT",
  GRASS: "OVERGROW",
  NORMAL: "STURDY",
  ELECTRIC: "MOTOR_DRIVE",
  ICE: "ICE_BODY",
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
    GRASS: 2,
    FIRE: 0.5, WATER: 0.5, ICE: 0.5,
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
    ABILITIES[raw.id] = {
      id: raw.id,
      name: raw.name || raw.id,
      description: raw.description || "",
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
  const unlockedCount = getUnlockedMoveCount(level, species.learnset.length);
  return species.learnset.slice(0, unlockedCount);
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
    if (typeof prev === "number") return Math.max(0, prev);
    return move.pp || 10;
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

  json.monsters.forEach((raw) => {
    const learnset = (raw.learnset || []).map((moveId) => MOVES[moveId]).filter(Boolean);
    const abilityId = raw.abilityId || DEFAULT_ABILITY_BY_TYPE[raw.primaryType] || "STURDY";

    MONSTERS[raw.id] = {
      id: raw.id,
      name: raw.name,
      emoji: raw.emoji || "",
      primaryType: raw.primaryType,
      abilityId,
      baseStats: raw.baseStats,
      learnset,
      description: raw.description || "",
      catchRate: raw.catchRate,
      evolveTo: raw.evolveTo || null,
      evolveLevel: raw.evolveLevel || null,
    };
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
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(minLv, maxLv);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 森エリア用の野生モンスター */
export function getForestWildMonster() {
  const pool = forestPool.length > 0 ? forestPool : wildPool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(5, 8);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 洞窟エリア用の野生モンスター */
export function getCaveWildMonster() {
  const pool = cavePool.length > 0 ? cavePool : forestPool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(8, 12);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 火山エリア用の野生モンスター */
export function getVolcanoWildMonster() {
  const pool = volcanoPool.length > 0 ? volcanoPool : cavePool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(12, 16);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 遺跡エリア用の野生モンスター */
export function getRuinsWildMonster() {
  const pool = ruinsPool.length > 0 ? ruinsPool : volcanoPool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(15, 20);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** ダーク団アジト用の野生モンスター */
export function getDarkTowerWildMonster() {
  const pool = darkTowerPool.length > 0 ? darkTowerPool : cavePool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(18, 24);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 氷峰用の野生モンスター */
export function getFrozenPeakWildMonster() {
  const pool = frozenPeakPool.length > 0 ? frozenPeakPool : ruinsPool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(22, 28);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 天空の花園用の野生モンスター */
export function getGardenWildMonster() {
  const pool = gardenPool.length > 0 ? gardenPool : ruinsPool;
  const base = Phaser.Utils.Array.GetRandom(pool);
  const level = Phaser.Math.Between(25, 35);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** ジムボスモンスター */
export function getGymBossMonster() {
  if (!gymBossData) return getRandomWildMonster(10, 15);
  const base = MONSTERS[gymBossData.id];
  if (!base) return getRandomWildMonster(10, 15);
  const level = gymBossData.level || 15;
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    isBoss: true,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
}

/** 第2ジムボスモンスター（氷峰ジム） */
export function getGymBoss2Monster() {
  if (!gymBoss2Data) return getRandomWildMonster(25, 32);
  const base = MONSTERS[gymBoss2Data.id];
  if (!base) return getRandomWildMonster(25, 32);
  const level = gymBoss2Data.level || 32;
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    isBoss: true,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
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
  const base = Phaser.Utils.Array.GetRandom(allMons);
  const baseLevel = 10 + round * 3;
  const level = Phaser.Math.Between(baseLevel, baseLevel + 2);
  const stats = calcStats(base, level);

  return {
    species: base,
    level,
    currentHp: stats.maxHp,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    attackStage: 0,
    defenseStage: 0,
    trainer: true,
    pp: (base.learnset || []).map(m => m.pp || 10),
  };
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

