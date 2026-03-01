/**
 * Emojimon ゲーム型定義
 * プロジェクト全体で使用する主要な型を一元管理
 */

// ── タイプシステム ──

/** モンスターのタイプ */
export type MonsterType = "NORMAL" | "FIRE" | "WATER" | "GRASS" | "ELECTRIC" | "ICE";

/** 状態異常 */
export type StatusConditionType = "NONE" | "BURN" | "POISON" | "PARALYSIS" | "FREEZE" | "SLEEP";

/** 天候 */
export type WeatherType = "NONE" | "SUNNY" | "RAINY" | "WINDY" | "SNOWY";

/** バトル状態 */
export type BattleStateType =
  | "INTRO"
  | "PLAYER_TURN"
  | "PLAYER_SELECT_MOVE"
  | "PLAYER_SELECT_ITEM"
  | "PLAYER_SELECT_SWITCH"
  | "OPPONENT_TURN"
  | "ANIMATING"
  | "RESULT";

// ── 基本ステータス ──

/** モンスターの基本ステータス */
export interface BaseStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

/** 計算後のステータス */
export interface CalculatedStats extends BaseStats {}

// ── 特性 ──

/** 特性定義 */
export interface Ability {
  id: string;
  name: string;
  description: string;
}

// ── 技 ──

/** 技の定義 */
export interface Move {
  id: string;
  name: string;
  type: MonsterType;
  power: number;
  accuracy: number;
  pp: number;
  category: "attack" | "status";
  priority?: number;
  description?: string;
  /** 攻撃ステージ変動（自分） */
  selfAttackStage?: number;
  /** 防御ステージ変動（自分） */
  selfDefenseStage?: number;
  /** 相手攻撃ステージ変動 */
  targetAttackStage?: number;
  /** 相手防御ステージ変動 */
  targetDefenseStage?: number;
  /** 自己回復割合 */
  selfHealRatio?: number;
  /** 状態異常付与タイプ */
  inflictStatus?: StatusConditionType;
  /** 状態異常付与確率 */
  statusChance?: number;
}

// ── モンスター ──

/** モンスター種族データ（マスター） */
export interface MonsterSubEmoji {
  emoji: string;
  point?: string | { x: number; y: number };
  size?: number;
}

export interface MonsterSpecies {
  id: string;
  name: string;
  emoji: string;
  subEmoji?: MonsterSubEmoji[];
  primaryType: MonsterType;
  abilityId: string;
  baseStats: BaseStats;
  learnset: Move[];
  description: string;
  catchRate: number;
  evolveTo: string | null;
  evolveLevel: number | null;
}

/** パーティ/バトルのモンスターインスタンス */
export interface MonsterInstance {
  species: MonsterSpecies;
  level: number;
  exp: number;
  nextLevelExp: number;
  currentHp: number;
  attackStage: number;
  defenseStage: number;
  moveIds: string[];
  pp: number[];
  statusCondition?: StatusConditionType;
  /** やけどダメージ半減フラグ等 */
  _sleepTurns?: number;
  _sleepDuration?: number;
  accuracyDownTurns?: number;
  /** エレメント連鎖用状態 */
  isWet?: boolean;
  lastUsedMoveType?: MonsterType;
  /** キズナ (0-100) */
  bond?: number;
}

// ── アイテム ──

/** アイテム定義 */
export interface Item {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  healAmount?: number;
  healStatus?: StatusConditionType;
  fullRestore?: boolean;
  revive?: boolean;
  attackStage?: number;
  defenseStage?: number;
  speedStage?: number;
  catchBonus?: number;
}

/** インベントリアイテム */
export interface InventoryItem {
  id: string;
  count: number;
}

// ── バトル ──

/** バトル初期化データ */
export interface BattleData {
  player: MonsterInstance;
  opponent: MonsterInstance & {
    trainer?: boolean;
    isRareEncounter?: boolean;
    catchRateMultiplier?: number;
    rewardMultiplier?: number;
  };
  isBoss?: boolean;
  isArena?: boolean;
  isTrainer?: boolean;
  trainerName?: string;
  isFinalBoss?: boolean;
  arenaRound?: number;
}

/** ダメージ計算結果 */
export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
  weatherBoosted: boolean;
  weatherWeakened: boolean;
  abilityMessages: string[];
}

/** 特性ダメージ修正結果 */
export interface AbilityDamageModifier {
  attackerMul: number;
  defenderMul: number;
  messages: string[];
}

// ── マップ ──

/** マップキー */
export type MapKey = "TOWN" | "HOME" | "FOREST" | "CAVE" | "VOLCANO" | "RUINS" | "LAB";

/** タイルコード */
export type TileCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** NPC定義 */
export interface NpcDef {
  x: number;
  y: number;
  emoji?: string;
  texture?: string;
  dialog: string | string[];
  shopkeeper?: boolean;
  healer?: boolean;
  quest?: boolean;
  arenaHost?: boolean;
  rivalBattle?: {
    party: Array<{ speciesId: string; level: number }>;
    trainerName: string;
    storyFlag: string;
  };
}

/** ドア遷移定義 */
export interface DoorDef {
  fromX: number;
  fromY: number;
  toMap: MapKey;
  toX: number;
  toY: number;
}

/** マップレイアウト */
export interface MapLayout {
  mapKey: MapKey;
  name: string;
  width: number;
  height: number;
  tiles: number[][];
  npcs: NpcDef[];
  doors: DoorDef[];
}

// ── セーブデータ ──

/** セーブデータ */
export interface SaveData {
  party: MonsterInstance[];
  box: MonsterInstance[];
  inventory: InventoryItem[];
  money: number;
  playerX: number;
  playerY: number;
  currentMap: MapKey;
  gymCleared: boolean;
  starQuestDone: boolean;
  seenIds: string[];
  caughtIds: string[];
  totalBattles: number;
  totalCatches: number;
  playTime: number;
  arenaHighScore: number;
  storyFlags: Record<string, boolean>;
}

// ── 天候情報 ──

/** 天候表示情報 */
export interface WeatherInfo {
  label: string;
  emoji: string;
  color: string;
}

// ── レベルアップ結果 ──

/** 経験値追加の詳細結果 */
export interface LevelUpResult {
  levelsGained: number;
  learnedMoves: Move[];
}
