const ROLE_FACE_POOL = {
  villager: ["🙂", "😊", "😄", "😌", "😺"],
  healer: ["😇", "😊", "🧑‍⚕️", "💆"],
  merchant: ["🧑‍💼", "😏", "🙂", "🤝"],
  quest: ["🧭", "🤔", "😼", "🧠"],
  rival: ["😤", "😼", "🧑‍🎤", "🔥"],
  gym: ["🧑‍🏫", "😠", "💪", "🏅"],
  arena: ["🤩", "😆", "🎯", "🏟️"],
};

const ROLE_SPEAKERS = {
  villager: "町のひと",
  healer: "かいふく係",
  merchant: "ショップ店員",
  quest: "案内人",
  rival: "トレーナー",
  gym: "ジム挑戦者",
  arena: "闘技場スタッフ",
};

const ROLE_DIALOGS = {
  villager: [
    "朝の散歩は、気分転換にぴったりだよ。",
    "メニューの図鑑を埋めると、旅の景色がもっと楽しくなるよ。",
    "強い相手に勝てないときは、いったん戻って準備しよう。",
  ],
  healer: [
    "無理しすぎる前に、いつでも休みに来てね。",
    "状態異常は早めに治すのがコツだよ。",
    "回復しておくと、急な連戦でも安心だよ。",
  ],
  merchant: [
    "捕獲用と回復用、どちらも少しずつ持っていくのが安心だよ。",
    "遠出するときは、ボールを多めに持っていこう。",
    "所持金には余裕を残して買い物するのがコツだよ。",
  ],
  quest: [
    "周囲をよく観察すると、進行のヒントが見つかるよ。",
    "困ったら、いま来た道を見直すのも有効だよ。",
    "焦らず一歩ずつ進めば、ちゃんと道は開けるよ。",
  ],
  rival: [
    "バトルは勢いだけじゃなく、読み合いも大事だぜ。",
    "レベルが同じでも、技の相性で勝負は変わるんだ。",
    "準備を整えてから再戦しようぜ！",
  ],
  gym: [
    "ジム戦は持久力も試される。回復手段を忘れないように。",
    "相手の得意タイプを読んで、編成を組み替えよう。",
    "挑戦前に、直前マップで経験値を稼ぐのも有効だ。",
  ],
  arena: [
    "連戦では、消耗管理がそのまま勝率になるぞ！",
    "一戦ごとに立て直す意識が重要だ！",
    "勝ち筋を決めてから挑むと安定するぞ。",
  ],
};

const MAP_DIALOGS = {
  EMOJI_TOWN: [
    "この町は朝と夜で雰囲気がけっこう変わるんだ。",
    "研究所の近くは、いつも新しい話題でにぎやかだね。",
  ],
  FOREST: [
    "森の奥ほど、すばやいモンスターが出やすい気がする。",
    "草むらでの連戦前は、回復を確認しておこう。",
  ],
  CRYSTAL_CAVE: [
    "洞窟では視界が狭いぶん、足元のルート確認が大事だよ。",
    "反響する足音で、強敵の気配がわかることもあるよ。",
  ],
  VOLCANIC_PASS: [
    "火山地帯は短期決戦が有利。長引かせないのがコツだ。",
    "暑い場所では、回復アイテムの残数を特に意識しよう。",
  ],
  FROZEN_PEAK: [
    "氷峰は一手のミスが響きやすい。慎重に進もう。",
    "冷える場所では、行動順の管理がとても大事だよ。",
  ],
  MISTY_SWAMP: [
    "湿地では足場が悪い。焦って進まず、地形を見よう。",
    "毒沼を抜ける前に、全体のHPを確認しておこう。",
  ],
};

const INDOOR_MAPS = new Set([
  "HOUSE1",
  "LAB",
  "TOWN_SHOP",
  "VOLCANO_SHOP",
  "FROZEN_GYM",
  "FROZEN_SHOP",
  "GARDEN_SHOP",
  "SWAMP_SHOP",
  "SAND_VALLEY_SHOP",
  "BASIN_SHOP",
  "FOREST_GYM",
]);

function hashSeed(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function pickStable(pool, seed) {
  if (!Array.isArray(pool) || pool.length === 0) return "";
  const idx = hashSeed(seed) % pool.length;
  return pool[idx];
}

function uniqueLines(lines) {
  const seen = new Set();
  const filtered = [];
  for (const line of lines || []) {
    const text = String(line || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    filtered.push(text);
  }
  return filtered;
}

function inferRole(npc) {
  if (npc.heal) return "healer";
  if (npc.shop) return "merchant";
  if (npc.gymLeader) return "gym";
  if (npc.arena) return "arena";
  if (npc.rivalBattle) return "rival";
  if (npc.quest || npc.story) return "quest";
  return "villager";
}

function shouldWanderByDefault(npc) {
  if (npc.shop || npc.heal || npc.gymLeader || npc.arena || npc.rivalBattle || npc.quest) return false;
  if (typeof npc.story === "string" && npc.story.length > 0) return false;
  return true;
}

export function enhanceMapNpcs(mapKey, npcs) {
  return (npcs || []).map((npc) => {
    const role = inferRole(npc);
    const seed = `${mapKey}:${npc.x}:${npc.y}:${role}:${npc.story || ""}:${npc.trainerName || ""}`;
    const roleFaces = ROLE_FACE_POOL[role] || ROLE_FACE_POOL.villager;
    const face = npc.face || pickStable(roleFaces, seed);
    const speakerName = npc.speakerName || ROLE_SPEAKERS[role] || ROLE_SPEAKERS.villager;

    const baseLines = [];
    if (typeof npc.text === "string" && npc.text.trim().length > 0) {
      baseLines.push(npc.text.trim());
    }
    baseLines.push(...(ROLE_DIALOGS[role] || []));
    baseLines.push(...(MAP_DIALOGS[mapKey] || []));
    const dialogPool = Array.isArray(npc.dialogPool) && npc.dialogPool.length > 0
      ? uniqueLines(npc.dialogPool)
      : uniqueLines(baseLines);

    const canWander = typeof npc.canWander === "boolean" ? npc.canWander : shouldWanderByDefault(npc);
    const indoor = INDOOR_MAPS.has(mapKey);
    const wanderRadius = canWander
      ? (npc.wanderRadius ?? (indoor ? 1 : 2))
      : 0;
    const wanderCooldownMinMs = npc.wanderCooldownMinMs ?? (indoor ? 2200 : 1500);
    const wanderCooldownMaxMs = npc.wanderCooldownMaxMs ?? (indoor ? 4200 : 3200);

    return {
      ...npc,
      face,
      speakerName,
      dialogPool,
      canWander,
      wanderRadius,
      wanderCooldownMinMs,
      wanderCooldownMaxMs,
      homeX: npc.homeX ?? npc.x,
      homeY: npc.homeY ?? npc.y,
    };
  });
}

export function pickNpcDialogLine(npc, rng = Math.random) {
  const pool = Array.isArray(npc?.dialogPool)
    ? npc.dialogPool.filter((line) => String(line || "").trim().length > 0)
    : [];
  if (pool.length === 0) return String(npc?.text || "こんにちは！").trim() || "こんにちは！";
  const index = Math.max(0, Math.min(pool.length - 1, Math.floor(rng() * pool.length)));
  return pool[index];
}

export function resolveNpcSpeakerLabel(npc) {
  const baseName = String(npc?.speakerName || "").trim();
  const face = String(npc?.face || "").trim();
  if (!baseName) return "";
  if (!face) return baseName;
  return `${baseName} ${face}`;
}
