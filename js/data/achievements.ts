/**
 * 実績（アチーブメント）システム
 * ゲーム内の行動を追跡し、条件達成時にアンロックする
 */
import { gameState, PARTY_CAPACITY } from "../state/gameState.ts";
import { getItemById } from "./items.ts";

// ── 実績カテゴリ ──
export type AchievementCategory = "BATTLE" | "COLLECTION" | "EXPLORATION" | "MASTERY";

// ── 実績定義 ──
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  hint?: string;
  reward?: AchievementReward;
  icon: string;
  category: AchievementCategory;
  /** 達成判定関数 */
  check: () => boolean;
  /** 表示用のソート順 */
  order: number;
}

export interface AchievementReward {
  money?: number;
  itemId?: string;
  itemQty?: number;
}

const CATEGORY_HINT_PREFIX: Record<AchievementCategory, string> = {
  BATTLE: "ヒント: バトルに挑戦して戦績を伸ばそう",
  COLLECTION: "ヒント: 捕獲・図鑑登録・合成を進めよう",
  EXPLORATION: "ヒント: 各地を巡って会話とイベントを進めよう",
  MASTERY: "ヒント: やりこみ要素を継続して達成しよう",
};

const ACHIEVEMENT_HINT_OVERRIDES: Record<string, string> = {
  RIVAL_TOWN: "ヒント: エモじタウンでライバルとの再戦イベントを進める",
  DARK_TOWER_CLEAR: "ヒント: 闇の塔の最深部イベントをクリアする",
  VOLCANO_BOSS: "ヒント: 火山エリアのダーク団ボス戦に勝利する",
  LEGENDARY_BEATEN: "ヒント: 天空の花園で伝説イベントを勝利で終える",
  ELITE_FOUR_ONE: "ヒント: 四天王のいずれか1人に勝利する",
  ELITE_FOUR_ALL: "ヒント: 四天王4人すべてに勝利する",
  FINAL_RIVAL: "ヒント: 星降りの盆地の最終ライバル戦を突破する",
};

// ── カテゴリ表示ラベル ──
export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  BATTLE: { label: "バトル", icon: "⚔️" },
  COLLECTION: { label: "コレクション", icon: "📚" },
  EXPLORATION: { label: "探索", icon: "🗺️" },
  MASTERY: { label: "マスター", icon: "🏆" },
};

// ── 実績一覧 ──
export const ACHIEVEMENTS: AchievementDef[] = [
  // ── バトル系 ──
  {
    id: "FIRST_VICTORY",
    name: "はじめての勝利",
    description: "バトルに1回勝利する",
    icon: "⚔️",
    category: "BATTLE",
    check: () => (gameState.totalBattles || 0) >= 1,
    order: 100,
  },
  {
    id: "BATTLE_10",
    name: "かけだしファイター",
    description: "バトルを10回おこなう",
    icon: "🥊",
    category: "BATTLE",
    check: () => (gameState.totalBattles || 0) >= 10,
    order: 110,
  },
  {
    id: "BATTLE_50",
    name: "てだれのファイター",
    description: "バトルを50回おこなう",
    icon: "💪",
    category: "BATTLE",
    check: () => (gameState.totalBattles || 0) >= 50,
    order: 120,
  },
  {
    id: "BATTLE_100",
    name: "ひゃくせんれんま",
    description: "バトルを100回おこなう",
    icon: "🔥",
    category: "BATTLE",
    check: () => (gameState.totalBattles || 0) >= 100,
    order: 130,
  },
  {
    id: "WIN_STREAK_5",
    name: "れんしょうの風",
    description: "バトルで5連勝する",
    icon: "🌪️",
    category: "BATTLE",
    check: () => (gameState.battleWinStreak || 0) >= 5,
    order: 140,
  },
  {
    id: "WIN_STREAK_10",
    name: "むてきの嵐",
    description: "バトルで10連勝する",
    icon: "⚡",
    category: "BATTLE",
    check: () => (gameState.battleWinStreak || 0) >= 10,
    order: 150,
  },
  {
    id: "GYM_CLEAR_1",
    name: "はじめてのジムバッジ",
    description: "最初のジムを制覇する",
    icon: "🏅",
    category: "BATTLE",
    check: () => !!gameState.gymCleared,
    order: 160,
  },
  {
    id: "GYM_CLEAR_2",
    name: "氷のジムバッジ",
    description: "2つ目のジムを制覇する",
    icon: "❄️",
    category: "BATTLE",
    check: () => !!gameState.storyFlags?.frozenPeakGymCleared,
    order: 170,
  },
  {
    id: "ARENA_3",
    name: "闘技場の挑戦者",
    description: "闘技場で3連勝する",
    icon: "🏟️",
    category: "BATTLE",
    check: () => (gameState.arenaHighScore || 0) >= 3,
    order: 180,
  },
  {
    id: "ARENA_5",
    name: "闘技場の覇者",
    description: "闘技場で5連勝する",
    icon: "👑",
    category: "BATTLE",
    check: () => (gameState.arenaHighScore || 0) >= 5,
    order: 190,
  },

  // ── コレクション系 ──
  {
    id: "FIRST_CATCH",
    name: "はじめての仲間",
    description: "モンスターを1体捕まえる",
    icon: "🎯",
    category: "COLLECTION",
    check: () => (gameState.totalCatches || 0) >= 1,
    order: 200,
  },
  {
    id: "CATCH_10",
    name: "モンスターコレクター",
    description: "モンスターを10体捕まえる",
    icon: "📦",
    category: "COLLECTION",
    check: () => (gameState.totalCatches || 0) >= 10,
    order: 210,
  },
  {
    id: "CATCH_30",
    name: "じゅくれんハンター",
    description: "モンスターを30体捕まえる",
    icon: "🎖️",
    category: "COLLECTION",
    check: () => (gameState.totalCatches || 0) >= 30,
    order: 220,
  },
  {
    id: "SEEN_20",
    name: "モンスターウォッチャー",
    description: "20種類のモンスターと出会う",
    icon: "👀",
    category: "COLLECTION",
    check: () => (gameState.seenIds?.length || 0) >= 20,
    order: 230,
  },
  {
    id: "SEEN_40",
    name: "モンスターリサーチャー",
    description: "40種類のモンスターと出会う",
    icon: "🔬",
    category: "COLLECTION",
    check: () => (gameState.seenIds?.length || 0) >= 40,
    order: 240,
  },
  {
    id: "POKEDEX_30",
    name: "図鑑コレクター",
    description: "30種類のモンスターを捕まえる",
    icon: "📖",
    category: "COLLECTION",
    check: () => (gameState.caughtIds?.length || 0) >= 30,
    order: 250,
  },
  {
    id: "POKEDEX_50",
    name: "図鑑マスター",
    description: "50種類のモンスターを捕まえる",
    icon: "📕",
    category: "COLLECTION",
    check: () => (gameState.caughtIds?.length || 0) >= 50,
    order: 260,
  },
  {
    id: "FUSION_FIRST",
    name: "はじめての合成",
    description: "合成レシピを1つ発見する",
    icon: "🧪",
    category: "COLLECTION",
    check: () => (gameState.getFusionDiscoveries?.()?.length || 0) >= 1,
    order: 270,
  },
  {
    id: "FUSION_5",
    name: "合成研究者",
    description: "合成レシピを5つ発見する",
    icon: "🔮",
    category: "COLLECTION",
    check: () => (gameState.getFusionDiscoveries?.()?.length || 0) >= 5,
    order: 280,
  },

  // ── 探索系 ──
  {
    id: "MAP_3",
    name: "旅のはじまり",
    description: "3つのエリアを訪問する",
    icon: "🚶",
    category: "EXPLORATION",
    check: () => (gameState.visitedMapIds?.length || 0) >= 3,
    order: 300,
  },
  {
    id: "MAP_7",
    name: "広がる世界",
    description: "7つのエリアを訪問する",
    icon: "🌍",
    category: "EXPLORATION",
    check: () => (gameState.visitedMapIds?.length || 0) >= 7,
    order: 310,
  },
  {
    id: "MAP_12",
    name: "世界の旅人",
    description: "12以上のエリアを訪問する",
    icon: "✈️",
    category: "EXPLORATION",
    check: () => (gameState.visitedMapIds?.length || 0) >= 12,
    order: 320,
  },
  {
    id: "RIVAL_TOWN",
    name: "ライバルとの初戦",
    description: "街でライバルに勝利する",
    icon: "🤝",
    category: "EXPLORATION",
    check: () => !!gameState.storyFlags?.townRivalBeaten,
    order: 330,
  },
  {
    id: "DARK_TOWER_CLEAR",
    name: "闇の塔を突破",
    description: "闇の塔のヴォイドを倒す",
    icon: "🗼",
    category: "EXPLORATION",
    check: () => !!gameState.storyFlags?.darkTowerVoidBeaten,
    order: 340,
  },
  {
    id: "VOLCANO_BOSS",
    name: "火山の王を討つ",
    description: "火山のダーク団ボスを倒す",
    icon: "🌋",
    category: "EXPLORATION",
    check: () => !!gameState.storyFlags?.volcanoEvilBossBeaten,
    order: 350,
  },
  {
    id: "LEGENDARY_BEATEN",
    name: "伝説との邂逅",
    description: "伝説のモンスターを倒す",
    icon: "🌟",
    category: "EXPLORATION",
    check: () => !!gameState.storyFlags?.legendaryDefeated,
    order: 360,
  },

  // ── マスター系 ──
  {
    id: "MONEY_10000",
    name: "小金持ち",
    description: "所持金10,000Gを達成する",
    icon: "💰",
    category: "MASTERY",
    check: () => (gameState.money || 0) >= 10000,
    order: 400,
  },
  {
    id: "MONEY_100000",
    name: "大富豪",
    description: "所持金100,000Gを達成する",
    icon: "💎",
    category: "MASTERY",
    check: () => (gameState.money || 0) >= 100000,
    order: 410,
  },
  {
    id: "PARTY_FULL",
    name: "フルパーティ",
    description: "パーティを3体にする",
    icon: "👥",
    category: "MASTERY",
    check: () => (gameState.party?.length || 0) >= PARTY_CAPACITY,
    order: 420,
  },
  {
    id: "ELITE_FOUR_ONE",
    name: "四天王への道",
    description: "四天王の1人を倒す",
    icon: "🏛️",
    category: "MASTERY",
    check: () => !!(
      gameState.storyFlags?.eliteFourWind ||
      gameState.storyFlags?.eliteFourFlame ||
      gameState.storyFlags?.eliteFourTide ||
      gameState.storyFlags?.eliteFourFrost
    ),
    order: 430,
  },
  {
    id: "ELITE_FOUR_ALL",
    name: "四天王を制覇",
    description: "四天王すべてを倒す",
    icon: "🏆",
    category: "MASTERY",
    check: () => !!(
      gameState.storyFlags?.eliteFourWind &&
      gameState.storyFlags?.eliteFourFlame &&
      gameState.storyFlags?.eliteFourTide &&
      gameState.storyFlags?.eliteFourFrost
    ),
    order: 440,
  },
  {
    id: "FINAL_RIVAL",
    name: "真のチャンピオン",
    description: "最終ライバル戦をクリアする",
    icon: "🎖️",
    category: "MASTERY",
    check: () => !!gameState.storyFlags?.basinFinalRival,
    order: 450,
  },
  {
    id: "DAILY_CHALLENGE",
    name: "日課達人",
    description: "日替わりチャレンジを達成する",
    icon: "📅",
    category: "MASTERY",
    check: () => !!gameState.dailyChallenge?.completed,
    order: 460,
  },
  {
    id: "PLAYTIME_1H",
    name: "じっくり冒険",
    description: "累計プレイ時間が1時間を超える",
    icon: "⏰",
    category: "MASTERY",
    check: () => (gameState.playTimeMs || 0) >= 3_600_000,
    order: 470,
  },
];

// ── 実績チェック & 通知 ──

/** 新しく達成された実績IDのリストを返す */
export function checkNewAchievements(unlockedIds: string[]): string[] {
  const unlockedSet = new Set(unlockedIds);
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedSet.has(achievement.id)) continue;
    try {
      if (achievement.check()) {
        newlyUnlocked.push(achievement.id);
      }
    } catch {
      // チェック中のエラーは無視
    }
  }

  return newlyUnlocked;
}

/** 実績IDから定義を取得 */
export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** カテゴリ別に実績をグループ化して返す */
export function getAchievementsByCategory(unlockedIds: string[]): Map<AchievementCategory, { def: AchievementDef; unlocked: boolean }[]> {
  const unlockedSet = new Set(unlockedIds);
  const result = new Map<AchievementCategory, { def: AchievementDef; unlocked: boolean }[]>();

  const categories: AchievementCategory[] = ["BATTLE", "COLLECTION", "EXPLORATION", "MASTERY"];
  for (const cat of categories) {
    result.set(cat, []);
  }

  const sorted = [...ACHIEVEMENTS].sort((a, b) => a.order - b.order);
  for (const def of sorted) {
    const list = result.get(def.category);
    if (list) {
      list.push({ def, unlocked: unlockedSet.has(def.id) });
    }
  }

  return result;
}

/** 達成率を返す（アンロック数 / 全実績数） */
export function getAchievementProgress(unlockedIds: string[]): { unlocked: number; total: number; percent: number } {
  const unlocked = unlockedIds.length;
  const total = ACHIEVEMENTS.length;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  return { unlocked, total, percent };
}

/** 実績ヒントを返す（未設定時はカテゴリ別の既定ヒント） */
export function getAchievementHint(def: AchievementDef): string {
  if (!def) return "ヒント: いろいろな遊び方を試してみよう";
  if (typeof def.hint === "string" && def.hint.trim().length > 0) return def.hint;
  const override = ACHIEVEMENT_HINT_OVERRIDES[def.id];
  if (override) return override;
  return CATEGORY_HINT_PREFIX[def.category] || "ヒント: 条件を満たす行動を進めよう";
}

/** 実績報酬を返す（未設定時はカテゴリ/段階ベースの既定値） */
export function getAchievementReward(def: AchievementDef): AchievementReward {
  if (!def) return {};
  if (def.reward) {
    return {
      money: Math.max(0, Math.floor(def.reward.money || 0)),
      itemId: def.reward.itemId,
      itemQty: Math.max(1, Math.floor(def.reward.itemQty || 1)),
    };
  }

  const step = Math.max(1, Math.floor((def.order % 100) / 10) + 1);
  if (def.category === "BATTLE") {
    return { money: 80 + step * 30, itemId: "EMO_BALL", itemQty: step >= 6 ? 2 : 1 };
  }
  if (def.category === "COLLECTION") {
    return { money: 90 + step * 35, itemId: "POTION", itemQty: step >= 6 ? 2 : 1 };
  }
  if (def.category === "EXPLORATION") {
    return { money: 100 + step * 40, itemId: "GREAT_BALL", itemQty: step >= 5 ? 2 : 1 };
  }
  return { money: 120 + step * 50, itemId: "SUPER_POTION", itemQty: step >= 5 ? 2 : 1 };
}

/** 実績報酬を表示用文字列に整形 */
export function getAchievementRewardText(def: AchievementDef): string {
  const reward = getAchievementReward(def);
  const parts: string[] = [];
  if ((reward.money || 0) > 0) {
    parts.push(`${reward.money}G`);
  }
  if (reward.itemId) {
    const item = getItemById(reward.itemId);
    const itemName = item?.name || reward.itemId;
    const itemQty = Math.max(1, Math.floor(reward.itemQty || 1));
    parts.push(`${itemName}×${itemQty}`);
  }
  return parts.length > 0 ? parts.join(" / ") : "なし";
}
