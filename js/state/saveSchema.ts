/**
 * セーブデータスキーマとバリデーション
 * Zodを使ったセーブデータの型検証とサニタイズ処理
 */
import { z } from "zod";
import { MONSTERS, calcStats, rollMonsterAbilityId, syncMonsterMoves } from "../data/monsters.ts";

// ── 定数 ──
export const SAVE_KEY = "emojimon_save_v2";
export const SAVE_BACKUP_KEY = "emojimon_save_v2_backup";
export const SETTINGS_KEY = "emojimon_settings_v1";

export const DEFAULT_GAMEPLAY_SETTINGS = {
  battleSpeed: "NORMAL",
  autoAdvanceMessages: false,
  shortEncounterEffect: false,
  emoSkipEnabled: true,
  autoSaveEnabled: true,
  screenBrightness: 115,
};

export const MAX_MONSTER_LEVEL = 100;
export const MAX_ITEM_QUANTITY = 999;
export const MAX_MONEY = 9_999_999;
export const MAX_COUNTER = 999_999;
export const MAX_PLAY_TIME_MS = 31_536_000_000; // 365日分
export const VALID_WEATHER_KEYS = ["NONE", "SUNNY", "RAINY", "WINDY", "SNOWY"];
export const MINUTES_PER_DAY = 24 * 60;
export const DEFAULT_FIELD_TIME_MINUTES = 8 * 60;

// ── Zodスキーマ ──
const serializedMonsterSchema = z.object({
  speciesId: z.string().min(1).nullable().optional(),
  abilityId: z.string().min(1).optional(),
  level: z.number().finite().optional(),
  exp: z.number().finite().optional(),
  nextLevelExp: z.number().finite().optional(),
  currentHp: z.number().finite().optional(),
  bond: z.number().finite().optional(),
  nickname: z.string().nullable().optional(),
  moveIds: z.array(z.string()).optional(),
  pp: z.array(z.number().finite()).optional(),
}).passthrough();

const inventoryEntrySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().finite(),
}).passthrough();

const dailyChallengeSchema = z.object({
  dateKey: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  target: z.number().finite(),
  progress: z.number().finite(),
  rewardMoney: z.number().finite(),
  completed: z.boolean(),
  rewardClaimed: z.boolean(),
}).partial().passthrough();

const saveDataSchema = z.object({
  playerName: z.string().optional(),
  playerPosition: z.object({
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
  }).partial().optional(),
  playerDirection: z.enum(["up", "down", "left", "right"]).optional(),
  currentMap: z.string().optional(),
  lastHealPoint: z.object({
    mapKey: z.string().optional(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
  }).partial().optional(),
  visitedMapIds: z.array(z.string()).optional(),
  mapWeatherByMap: z.record(z.string(), z.unknown()).optional(),
  fieldTimeMinutes: z.number().finite().optional(),
  party: z.array(serializedMonsterSchema).optional(),
  box: z.array(serializedMonsterSchema).optional(),
  inventory: z.array(inventoryEntrySchema).optional(),
  money: z.number().finite().optional(),
  starQuestDone: z.boolean().optional(),
  gymCleared: z.boolean().optional(),
  arenaWins: z.number().finite().optional(),
  arenaHighScore: z.number().finite().optional(),
  arenaRound: z.number().finite().optional(),
  battleWinStreak: z.number().finite().optional(),
  caughtIds: z.array(z.string()).optional(),
  seenIds: z.array(z.string()).optional(),
  totalBattles: z.number().finite().optional(),
  totalCatches: z.number().finite().optional(),
  playTimeMs: z.number().finite().optional(),
  discoveredFusionRecipes: z.array(z.string()).optional(),
  unlockedAchievements: z.array(z.string()).optional(),
  dailyChallenge: dailyChallengeSchema.nullable().optional(),
  audioSettings: z.object({
    muted: z.boolean().optional(),
    bgmVolume: z.number().finite().optional(),
    seVolume: z.number().finite().optional(),
  }).partial().optional(),
  gameplaySettings: z.object({
    battleSpeed: z.string().optional(),
    autoAdvanceMessages: z.boolean().optional(),
    shortEncounterEffect: z.boolean().optional(),
    emoSkipEnabled: z.boolean().optional(),
    autoSaveEnabled: z.boolean().optional(),
    screenBrightness: z.number().finite().optional(),
  }).partial().optional(),
  storyFlags: z.record(z.string(), z.unknown()).optional(),
  savedAt: z.number().finite().optional(),
}).passthrough();

// ── バリデーション・サニタイズ関数 ──

export function parseAndValidateSaveData(raw, sourceLabel) {
  const result = saveDataSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const issuePath = issue?.path?.length ? issue.path.join(".") : "root";
    throw new Error(`${sourceLabel}の形式が不正です (${issuePath}: ${issue?.message || "unknown"})`);
  }
  return result.data;
}

export function sanitizeGameplaySettings(raw) {
  const speed = raw?.battleSpeed;
  const rawBrightness = Number.isFinite(raw?.screenBrightness) ? Math.round(raw.screenBrightness) : 115;
  const screenBrightness = Math.min(140, Math.max(60, rawBrightness));
  return {
    battleSpeed: speed === "FAST" || speed === "TURBO" ? speed : "NORMAL",
    autoAdvanceMessages: !!raw?.autoAdvanceMessages,
    shortEncounterEffect: !!raw?.shortEncounterEffect,
    emoSkipEnabled: raw?.emoSkipEnabled !== false,
    autoSaveEnabled: raw?.autoSaveEnabled !== false,
    screenBrightness,
  };
}

export function clampInt(value, min, max, fallback = min) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function normalizeFieldTimeMinutes(value) {
  if (!Number.isFinite(value)) return DEFAULT_FIELD_TIME_MINUTES;
  const normalized = Math.floor(value) % MINUTES_PER_DAY;
  return normalized >= 0 ? normalized : normalized + MINUTES_PER_DAY;
}

export function sanitizeIdList(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id) => typeof id === "string" && id.length > 0))];
}

export function sanitizeInventory(raw) {
  if (!Array.isArray(raw)) return [];
  const merged = new Map();

  raw.forEach((entry) => {
    const itemId = entry?.itemId;
    if (typeof itemId !== "string" || itemId.length === 0) return;
    const quantity = clampInt(entry?.quantity, 1, MAX_ITEM_QUANTITY, 1);
    const prev = merged.get(itemId) || 0;
    merged.set(itemId, Math.min(MAX_ITEM_QUANTITY, prev + quantity));
  });

  return [...merged.entries()].map(([itemId, quantity]) => ({ itemId, quantity }));
}

export function buildLoadedMonster(saved) {
  const species = MONSTERS[saved?.speciesId] || null;
  if (!species) return null;

  const level = clampInt(saved?.level, 1, MAX_MONSTER_LEVEL, 1);
  const stats = calcStats(species, level);
  const maxHp = Math.max(1, clampInt(stats?.maxHp, 1, 9999, 1));
  const baseNextLevelExp = 10 + 8 * level;

  const loaded = {
    species,
    level,
    exp: clampInt(saved?.exp, 0, 99_999_999, 0),
    nextLevelExp: Math.max(baseNextLevelExp, clampInt(saved?.nextLevelExp, 1, 99_999_999, baseNextLevelExp)),
    currentHp: clampInt(saved?.currentHp, 0, maxHp, maxHp),
    bond: clampInt(saved?.bond, 0, 100, 0),
    attackStage: 0,
    defenseStage: 0,
    abilityId: typeof saved?.abilityId === "string" && saved.abilityId.length > 0
      ? saved.abilityId
      : rollMonsterAbilityId(species),
    moveIds: Array.isArray(saved?.moveIds)
      ? saved.moveIds.filter((moveId) => typeof moveId === "string")
      : [],
    pp: Array.isArray(saved?.pp) ? saved.pp : [],
    nickname: typeof saved?.nickname === "string" && saved.nickname.trim().length > 0
      ? saved.nickname.trim().slice(0, 12)
      : null,
  };

  syncMonsterMoves(loaded);
  loaded.currentHp = clampInt(loaded.currentHp, 0, maxHp, maxHp);
  return loaded;
}
