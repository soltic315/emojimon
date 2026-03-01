/**
 * デイリーチャレンジ定義と生成ロジック
 */

export const DAILY_CHALLENGE_DEFS = [
  {
    type: "BATTLE",
    label: "バトル",
    targets: [4, 6, 8],
    baseReward: 140,
  },
  {
    type: "CATCH",
    label: "捕獲",
    targets: [1, 2, 3],
    baseReward: 180,
  },
  {
    type: "ARENA_CLEAR",
    label: "闘技場3連戦クリア",
    targets: [1],
    baseReward: 700,
  },
];

export function getLocalDateKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hashDateKey(dateKey) {
  return dateKey.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 13), 0);
}

export function buildDailyChallenge(dateKey) {
  const seed = hashDateKey(dateKey);
  const def = DAILY_CHALLENGE_DEFS[seed % DAILY_CHALLENGE_DEFS.length];
  const target = def.targets[(seed >> 3) % def.targets.length];
  const rewardMoney = def.baseReward + (target - 1) * 70;
  return {
    dateKey,
    type: def.type,
    label: def.label,
    target,
    progress: 0,
    rewardMoney,
    completed: false,
    rewardClaimed: false,
  };
}
