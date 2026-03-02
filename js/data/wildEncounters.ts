/**
 * 野生モンスターエンカウント管理
 * エリア別出現テーブル・ジムボス・闘技場対戦相手の生成
 */
import { calcStats, rollMonsterAbilityId, MONSTERS } from "./monsters.ts";
import { pickByWeight } from "./weightedRandom.ts";

// ── 内部ユーティリティ ──

function pickWeightedMonster(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const picked = pickByWeight(
    pool,
    (species) => (Number.isFinite(species?.spawnRate) ? species.spawnRate : 1),
  );
  return picked || pool[0];
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

// ── エリア別出現プール（モジュール状態） ──

let wildPool = [];
let forestPool = [];
let cavePool = [];
let volcanoPool = [];
let ruinsPool = [];
let darkTowerPool = [];
let frozenPeakPool = [];
let gardenPool = [];
let swampPool = [];
let coralPool = [];
let sandValleyPool = [];
let shadowGrovePool = [];
let libraryPool = [];
let basinPool = [];
let gymBossData = null;
let gymBoss2Data = null;

/**
 * initMonstersFromJson から呼ばれる: 各エリアの出現プールを構築する
 */
export function initWildPools(json, monstersRegistry) {
  const poolIds = Array.isArray(json.wildPoolIds)
    ? json.wildPoolIds
    : Object.keys(monstersRegistry);
  wildPool = poolIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const forestIds = Array.isArray(json.forestPoolIds) ? json.forestPoolIds : [];
  forestPool = forestIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const caveIds = Array.isArray(json.cavePoolIds) ? json.cavePoolIds : [];
  cavePool = caveIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const volcanoIds = Array.isArray(json.volcanoPoolIds) ? json.volcanoPoolIds : [];
  volcanoPool = volcanoIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const ruinsIds = Array.isArray(json.ruinsPoolIds) ? json.ruinsPoolIds : [];
  ruinsPool = ruinsIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const darkTowerIds = Array.isArray(json.darkTowerPoolIds) ? json.darkTowerPoolIds : [];
  darkTowerPool = darkTowerIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const frozenPeakIds = Array.isArray(json.frozenPeakPoolIds) ? json.frozenPeakPoolIds : [];
  frozenPeakPool = frozenPeakIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const gardenIds = Array.isArray(json.gardenPoolIds) ? json.gardenPoolIds : [];
  gardenPool = gardenIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const swampIds = Array.isArray(json.swampPoolIds) ? json.swampPoolIds : [];
  swampPool = swampIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const coralIds = Array.isArray(json.coralPoolIds) ? json.coralPoolIds : [];
  coralPool = coralIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const sandValleyIds = Array.isArray(json.sandValleyPoolIds) ? json.sandValleyPoolIds : [];
  sandValleyPool = sandValleyIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const shadowGroveIds = Array.isArray(json.shadowGrovePoolIds) ? json.shadowGrovePoolIds : [];
  shadowGrovePool = shadowGroveIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const libraryIds = Array.isArray(json.libraryPoolIds) ? json.libraryPoolIds : [];
  libraryPool = libraryIds.map((id) => monstersRegistry[id]).filter(Boolean);

  const basinIds = Array.isArray(json.basinPoolIds) ? json.basinPoolIds : [];
  basinPool = basinIds.map((id) => monstersRegistry[id]).filter(Boolean);

  gymBossData = json.gymBoss || null;
  gymBoss2Data = json.gymBoss2 || null;
}

// ── エリア別野生モンスター生成 ──

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

/** 霧の湿地用の野生モンスター */
export function getSwampWildMonster() {
  const pool = swampPool.length > 0 ? swampPool : forestPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(7, 11);
  return createMonsterEntry(base, level);
}

/** 珊瑚の浜用の野生モンスター */
export function getCoralWildMonster() {
  const pool = coralPool.length > 0 ? coralPool : forestPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(8, 13);
  return createMonsterEntry(base, level);
}

/** 砂塵の谷用の野生モンスター */
export function getSandValleyWildMonster() {
  const pool = sandValleyPool.length > 0 ? sandValleyPool : volcanoPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(15, 20);
  return createMonsterEntry(base, level);
}

/** 影の森用の野生モンスター */
export function getShadowGroveWildMonster() {
  const pool = shadowGrovePool.length > 0 ? shadowGrovePool : darkTowerPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(20, 26);
  return createMonsterEntry(base, level);
}

/** 古代図書館用の野生モンスター */
export function getLibraryWildMonster() {
  const pool = libraryPool.length > 0 ? libraryPool : ruinsPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(24, 30);
  return createMonsterEntry(base, level);
}

/** 星降り盆地用の野生モンスター */
export function getBasinWildMonster() {
  const pool = basinPool.length > 0 ? basinPool : gardenPool;
  const base = pickWeightedMonster(pool);
  if (!base) return null;
  const level = Phaser.Math.Between(35, 45);
  return createMonsterEntry(base, level);
}

// ── ジムボス・闘技場 ──

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

/** 闘技場の対戦相手を生成（ラウンドに応じてレベル上昇） */
export function getArenaOpponent(round) {
  const allMons = Object.values(MONSTERS);
  if (allMons.length === 0) return getRandomWildMonster(10, 15);
  const base = pickWeightedMonster(allMons);
  if (!base) return getRandomWildMonster(10, 15);
  const baseLevel = 10 + round * 3;
  const level = Phaser.Math.Between(baseLevel, baseLevel + 2);
  return createMonsterEntry(base, level, { trainer: true });
}
