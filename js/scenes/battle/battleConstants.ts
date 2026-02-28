export const BattleState = {
  INTRO: "INTRO",
  PLAYER_TURN: "PLAYER_TURN",
  PLAYER_SELECT_MOVE: "PLAYER_SELECT_MOVE",
  PLAYER_SELECT_ITEM: "PLAYER_SELECT_ITEM",
  PLAYER_SELECT_SWITCH: "PLAYER_SELECT_SWITCH",
  OPPONENT_TURN: "OPPONENT_TURN",
  ANIMATING: "ANIMATING",
  RESULT: "RESULT",
};

// タイプ別パーティクルテクスチャ
export const TYPE_PARTICLE = {
  FIRE: "particle-fire",
  WATER: "particle-water",
  GRASS: "particle-grass",
  NORMAL: "particle-hit",
  ELECTRIC: "particle-electric",
  ICE: "particle-ice",
};

const STAGE_MIN = -6;
const STAGE_MAX = 6;

// ── バトルバランス定数 ──
/** 逃走基礎成功確率 */
export const RUN_SUCCESS_RATE = 0.6;
/** 逃走確率の下限 */
export const RUN_RATE_MIN = 0.35;
/** 逃走確率の上限 */
export const RUN_RATE_MAX = 0.85;
/** 急所発生確率 */
export const CRITICAL_HIT_RATE = 0.125;
/** 急所ダメージ倍率 */
export const CRITICAL_HIT_MULTIPLIER = 1.5;
/** ダメージ乱数レンジ（最小） */
export const DAMAGE_RANDOM_MIN = 0.88;
/** ダメージ乱数レンジ（最大） */
export const DAMAGE_RANDOM_MAX = 1.12;
/** STAB（タイプ一致）ボーナス */
export const STAB_BONUS = 1.2;
/** パーティ上限 */
export const PARTY_MAX = 6;
/** 経験値倍率: 野生 */
export const EXP_MULT_WILD = 5;
/** 経験値倍率: 闘技場 */
export const EXP_MULT_ARENA = 10;
/** 経験値倍率: ジム */
export const EXP_MULT_GYM = 15;
/** 経験値倍率: トレーナー */
export const EXP_MULT_TRAINER = 8;
/** パーティ共有経験値割合 */
export const SHARED_EXP_RATIO = 0.3;
/** エモ・スキップ発動に必要なレベル差 */
export const EMO_SKIP_LEVEL_GAP = 10;
/** エモ・スキップ長押し時間(ms) */
export const EMO_SKIP_HOLD_MS = 600;
/** やけどダメージ割合（最大HPに対する%） */
export const BURN_DAMAGE_RATIO = 0.10;
/** どくダメージ割合 */
export const POISON_DAMAGE_RATIO = 0.08;
/** まひで行動不能になる確率 */
export const PARALYSIS_SKIP_RATE = 0.25;
/** こおり解凍確率 */
export const FREEZE_THAW_RATE = 0.20;
/** ねむり起床確率 */
export const SLEEP_WAKE_RATE = 0.33;
/** やけど時の物理攻撃威力倍率 */
export const BURN_ATTACK_MULTIPLIER = 0.75;

export const StatusCondition = {
  NONE: "NONE",
  BURN: "BURN",
  POISON: "POISON",
  PARALYSIS: "PARALYSIS",
  FREEZE: "FREEZE",
  SLEEP: "SLEEP",
};

export const WEATHER_INFO = {
  NONE: { label: "", emoji: "", color: "#9ca3af" },
  SUNNY: { label: "はれ", emoji: "☀️", color: "#f97316" },
  RAINY: { label: "あめ", emoji: "🌧️", color: "#3b82f6" },
  WINDY: { label: "かぜ", emoji: "🌪️", color: "#22c55e" },
  SNOWY: { label: "ゆき", emoji: "❄️", color: "#93c5fd" },
};

// 天候によるタイプダメージ補正
export const WEATHER_TYPE_MODIFIER = {
  SUNNY: { FIRE: 1.3, WATER: 0.7, GRASS: 1.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 0.7 },
  RAINY: { FIRE: 0.7, WATER: 1.3, GRASS: 1.0, NORMAL: 1.0, ELECTRIC: 1.3, ICE: 1.0 },
  WINDY: { FIRE: 1.0, WATER: 1.0, GRASS: 1.3, NORMAL: 0.9, ELECTRIC: 1.0, ICE: 1.0 },
  SNOWY: { FIRE: 0.7, WATER: 1.0, GRASS: 0.7, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.3 },
  NONE: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.0 },
};

export function clampStageValue(value) {
  return Math.min(STAGE_MAX, Math.max(STAGE_MIN, value));
}

export function getStatusLabel(statusCondition) {
  if (statusCondition === StatusCondition.BURN) return "やけど";
  if (statusCondition === StatusCondition.POISON) return "どく";
  if (statusCondition === StatusCondition.PARALYSIS) return "まひ";
  if (statusCondition === StatusCondition.FREEZE) return "こおり";
  if (statusCondition === StatusCondition.SLEEP) return "ねむり";
  return "";
}

/** 状態異常に対応する絵文字アイコンを返す */
export function getStatusEmoji(statusCondition) {
  if (statusCondition === StatusCondition.BURN) return "🔥";
  if (statusCondition === StatusCondition.POISON) return "☠️";
  if (statusCondition === StatusCondition.PARALYSIS) return "⚡";
  if (statusCondition === StatusCondition.FREEZE) return "🧊";
  if (statusCondition === StatusCondition.SLEEP) return "💤";
  return "";
}

/** 状態異常に対応する色コードを返す */
export function getStatusColor(statusCondition) {
  if (statusCondition === StatusCondition.BURN) return "#ef4444";
  if (statusCondition === StatusCondition.POISON) return "#a855f7";
  if (statusCondition === StatusCondition.PARALYSIS) return "#eab308";
  if (statusCondition === StatusCondition.FREEZE) return "#38bdf8";
  if (statusCondition === StatusCondition.SLEEP) return "#94a3b8";
  return "#ffffff";
}

export function getMoveEffectLabel(move) {
  if (!move || !move.inflictStatus || !move.statusChance) return "追加効果: なし";
  const statusLabel = getStatusLabel(move.inflictStatus) || move.inflictStatus;
  const chance = move.statusChance <= 1 ? Math.round(move.statusChance * 100) : Math.round(move.statusChance);
  return `追加効果: ${statusLabel}${chance}%`;
}

export function formatMoveAccuracy(move) {
  if (!move || move.accuracy === undefined || move.accuracy === null) return "—";
  const raw = move.accuracy;
  const percent = raw <= 1 ? raw * 100 : raw;
  return `${Math.round(percent)}%`;
}

export function getEffectivenessLabel(effectiveness) {
  if (effectiveness >= 2) return "ばつぐん";
  if (effectiveness > 1) return "やや有利";
  if (effectiveness === 1) return "ふつう";
  if (effectiveness > 0) return "いまひとつ";
  return "こうかなし";
}

export function getWeatherModifier(weather, moveType) {
  const modifiers = WEATHER_TYPE_MODIFIER[weather] || WEATHER_TYPE_MODIFIER.NONE;
  return modifiers[moveType] || 1.0;
}
