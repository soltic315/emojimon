import {
  MONSTERS,
  calcStats,
  getLearnedMovesByLevelUp,
  syncMonsterMoves,
} from "../data/monsters.ts";

const SAVE_KEY = "emojimon_save_v2";
const SETTINGS_KEY = "emojimon_settings_v1";

const DEFAULT_GAMEPLAY_SETTINGS = {
  battleSpeed: "NORMAL",
  autoAdvanceMessages: false,
  shortEncounterEffect: false,
};

const MAX_MONSTER_LEVEL = 100;
const MAX_ITEM_QUANTITY = 999;
const MAX_MONEY = 9_999_999;
const MAX_COUNTER = 999_999;
const MAX_PLAY_TIME_MS = 31_536_000_000; // 365日分
const VALID_WEATHER_KEYS = ["NONE", "SUNNY", "RAINY", "WINDY"];

function sanitizeGameplaySettings(raw) {
  const speed = raw?.battleSpeed;
  return {
    battleSpeed: speed === "FAST" || speed === "TURBO" ? speed : "NORMAL",
    autoAdvanceMessages: !!raw?.autoAdvanceMessages,
    shortEncounterEffect: !!raw?.shortEncounterEffect,
  };
}

function clampInt(value, min, max, fallback = min) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function sanitizeIdList(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id) => typeof id === "string" && id.length > 0))];
}

function sanitizeInventory(raw) {
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

function buildLoadedMonster(saved) {
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
    attackStage: 0,
    defenseStage: 0,
    moveIds: Array.isArray(saved?.moveIds)
      ? saved.moveIds.filter((moveId) => typeof moveId === "string")
      : [],
    pp: Array.isArray(saved?.pp) ? saved.pp : [],
  };

  syncMonsterMoves(loaded);
  loaded.currentHp = clampInt(loaded.currentHp, 0, maxHp, maxHp);
  return loaded;
}

const DAILY_CHALLENGE_DEFS = [
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

function getLocalDateKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hashDateKey(dateKey) {
  return dateKey.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 13), 0);
}

function buildDailyChallenge(dateKey) {
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

const FUSION_RECIPES = {
  "BLAZEBIRD+STARLITE": "AURORO",
  "BLAZEBIRD+PYREBEAR": "AURORO",
  "CINDERCUB+FINBUB": "MISTRAY",
  "BLIZZCAT+DROPLET": "GLACIERA",
  "CRYSTALINE+THORNVINE": "BRAMBLEON",
  "SHADOWPAW+SKYPIP": "RUNEFOX",
};

function getFusionRecipeResult(speciesIdA, speciesIdB) {
  if (!speciesIdA || !speciesIdB) return null;
  const key = [speciesIdA, speciesIdB].sort().join("+");
  return FUSION_RECIPES[key] || null;
}

class GameState {
  constructor() {
    this.playerName = "ユウ";
    this.playerPosition = { x: 8, y: 10 };
    this.playerDirection = "down";
    this.currentMap = "EMOJI_TOWN";
    this.mapWeatherByMap = {};
    this.inBattle = false;
    this.activeBattle = null;
    this.party = [];
    this.inventory = [];
    this.money = 0;
    this.starQuestDone = false;
    this.gymCleared = false;
    this.arenaWins = 0;        // 闘技場の連勝数
    this.arenaHighScore = 0;   // 闘技場の最高連勝記録
    // 図鑑：捕まえた or 見つけたモンスター ID
    this.caughtIds = [];
    this.seenIds = [];
    // 累計統計
    this.totalBattles = 0;
    this.totalCatches = 0;
    this.playTimeMs = 0;
    this.wildWinStreak = 0;
    this.box = []; // パーティ上限(6)を超えたモンスター保管
    this.discoveredFusionRecipes = [];
    this.dailyChallenge = null;
    this.audioSettings = {
      muted: false,
      bgmVolume: 0.3,
      seVolume: 0.5,
    };
    this.gameplaySettings = { ...DEFAULT_GAMEPLAY_SETTINGS };
    // ── ストーリー進行フラグ ──
    this.storyFlags = {
      prologueDone: false,          // プロローグ（博士の話）完了
      starterChosen: false,         // スターターモンスター選択済み
      rivalIntroDone: false,        // ライバル「レン」との初対面済み
      townRivalBeaten: false,       // タウンでライバルを撃破
      forestCrystalFound: false,    // 森のエモじクリスタル解放
      forestRivalBeaten: false,     // 森でライバルを撃破
      caveEvilBeaten: false,        // 洞窟でダーク団幹部「シャドウ」撃破
      caveRivalBeaten3: false,      // 洞窟でライバル3戦目
      darkTowerGruntBeaten: false,  // ダーク団アジトしたっぱ撃破
      darkTowerVoidBeaten: false,   // ダーク団幹部「ヴォイド」撃破 [3/5]
      volcanoEvilBossBeaten: false, // マグマ峠でダーク団ボス「ライオット」撃破 [4/5]
      frozenPeakGymCleared: false,  // 氷峰ジムクリア
      frozenPeakRivalBeaten: false, // 氷峰でライバル撃破
      frozenPeakIceQuest: false,    // 氷峰こおりクエスト完了
      ruinsFinalDone: false,        // 遺跡で最終決戦完了 [5/5]
      legendaryDefeated: false,     // 伝説のモンスター撃破（ポストゲーム）
      forestScoutBeaten: false,     // 森の訓練トレーナー撃破
      caveScholarBeaten: false,     // 洞窟の戦術家トレーナー撃破
      darkTowerSentinelBeaten: false, // ダークタワーの番兵撃破
      volcanicScoutBeaten: false,   // マグマ峠の斥候トレーナー撃破
      frozenSageBeaten: false,      // 氷峰の賢者トレーナー撃破
      ruinsGuardianBeaten: false,   // 遺跡の守人トレーナー撃破
      starterSpeciesId: null,       // 選んだスターターの種族ID
      forestSwimTreasureTaken: false, // 森の泳ぎ探索報酬
      caveHiddenItemFound: false,     // 洞窟の暗闘アイテム
      // ── チュートリアル進行フラグ ──
      introNarrationDone: false,      // 初回ナレーション済み
      tutorialMoveDone: false,        // 移動チュートリアル済み
      tutorialBattleDone: false,      // 初回バトルチュートリアル済み
      tutorialCatchDone: false,       // 捕獲チュートリアル済み
      tutorialMenuDone: false,        // メニューチュートリアル済み
      momFarewellDone: false,         // 母の見送りイベント済み
    };
    this.refreshDailyChallenge();
    this.loadAudioSettings();
  }

  reset() {
    const prevAudioSettings = { ...this.audioSettings };
    const prevGameplaySettings = { ...this.gameplaySettings };

    this.playerName = "ユウ";
    this.playerPosition = { x: 8, y: 10 };
    this.playerDirection = "down";
    this.currentMap = "EMOJI_TOWN";
    this.mapWeatherByMap = {};
    this.inBattle = false;
    this.activeBattle = null;

    // ニューゲーム時はパーティなし（スターター選択後に追加）
    this.party = [];

    this.inventory = [
      { itemId: "POTION", quantity: 3 },
      { itemId: "EMO_BALL", quantity: 5 },
    ];
    this.money = 200;
    this.starQuestDone = false;
    this.gymCleared = false;
    this.arenaWins = 0;
    this.arenaHighScore = 0;
    this.caughtIds = [];
    this.seenIds = [];
    this.totalBattles = 0;
    this.totalCatches = 0;
    this.playTimeMs = 0;
    this.wildWinStreak = 0;
    this.box = [];
    this.discoveredFusionRecipes = [];
    this.dailyChallenge = null;
    this.refreshDailyChallenge();
    this.audioSettings = prevAudioSettings;
    this.gameplaySettings = sanitizeGameplaySettings(prevGameplaySettings);
    // ストーリーフラグをリセット
    this.storyFlags = {
      prologueDone: false,
      starterChosen: false,
      rivalIntroDone: false,
      townRivalBeaten: false,
      forestCrystalFound: false,
      forestRivalBeaten: false,
      caveEvilBeaten: false,
      caveRivalBeaten3: false,
      darkTowerGruntBeaten: false,
      darkTowerVoidBeaten: false,
      volcanoEvilBossBeaten: false,
      frozenPeakGymCleared: false,
      frozenPeakRivalBeaten: false,
      frozenPeakIceQuest: false,
      ruinsFinalDone: false,
      legendaryDefeated: false,
      forestScoutBeaten: false,
      caveScholarBeaten: false,
      darkTowerSentinelBeaten: false,
      volcanicScoutBeaten: false,
      frozenSageBeaten: false,
      ruinsGuardianBeaten: false,
      starterSpeciesId: null,
      forestSwimTreasureTaken: false,
      caveHiddenItemFound: false,
      // チュートリアルフラグ
      introNarrationDone: false,
      tutorialMoveDone: false,
      tutorialBattleDone: false,
      tutorialCatchDone: false,
      tutorialMenuDone: false,
      momFarewellDone: false,
    };
  }

  refreshDailyChallenge() {
    const today = getLocalDateKey();
    if (this.dailyChallenge?.dateKey === today) return false;
    this.dailyChallenge = buildDailyChallenge(today);
    return true;
  }

  getDailyChallenge() {
    this.refreshDailyChallenge();
    return this.dailyChallenge;
  }

  getDailyChallengeSummaryLines() {
    const challenge = this.getDailyChallenge();
    if (!challenge) {
      return ["本日のチャレンジ : なし"];
    }
    const stateText = challenge.completed
      ? challenge.rewardClaimed
        ? "✅ 報酬受け取り済み"
        : "🎁 報酬受け取り可能"
      : "📋 進行中";
    return [
      `本日のチャレンジ : ${challenge.label}`,
      `進捗　　　　 　 : ${challenge.progress}/${challenge.target} (${stateText})`,
      `報酬　　　　 　 : ${challenge.rewardMoney}G`,
    ];
  }

  updateDailyChallengeProgress(eventType, amount = 1) {
    const challenge = this.getDailyChallenge();
    if (!challenge || challenge.completed) {
      return {
        progressed: false,
        completedNow: false,
        challenge,
      };
    }
    if (challenge.type !== eventType) {
      return {
        progressed: false,
        completedNow: false,
        challenge,
      };
    }

    const safeAmount = Math.max(1, Math.floor(amount));
    const before = challenge.progress;
    challenge.progress = Math.min(challenge.target, challenge.progress + safeAmount);
    const completedNow = before < challenge.target && challenge.progress >= challenge.target;
    if (completedNow) challenge.completed = true;

    return {
      progressed: challenge.progress !== before,
      completedNow,
      challenge,
    };
  }

  claimDailyChallengeReward() {
    const challenge = this.getDailyChallenge();
    if (!challenge || !challenge.completed || challenge.rewardClaimed) {
      return {
        success: false,
        rewardMoney: 0,
        challenge,
      };
    }
    challenge.rewardClaimed = true;
    this.addMoney(challenge.rewardMoney);
    return {
      success: true,
      rewardMoney: challenge.rewardMoney,
      challenge,
    };
  }

  getLeader() {
    return this.party[0] || null;
  }

  /** 生きているモンスターのうち先頭を返す */
  getFirstAlive() {
    return this.party.find((m) => m.currentHp > 0) || null;
  }

  /** パーティ全滅かどうか */
  isPartyWiped() {
    return this.party.every((m) => m.currentHp <= 0);
  }

  setPlayerPosition(tileX, tileY) {
    this.playerPosition.x = tileX;
    this.playerPosition.y = tileY;
  }

  setBattle(battlePayload) {
    this.inBattle = !!battlePayload;
    if (!battlePayload) {
      this.activeBattle = null;
      return;
    }

    const mapWeather = this.getMapWeather(this.currentMap);
    if (mapWeather && !battlePayload.weather) {
      battlePayload.weather = mapWeather;
    }
    this.activeBattle = battlePayload;
  }

  _normalizeMapWeatherKey(mapKey) {
    return mapKey || "EMOJI_TOWN";
  }

  _normalizeWeatherKey(weather) {
    return VALID_WEATHER_KEYS.includes(weather) ? weather : null;
  }

  getMapWeather(mapKey) {
    const key = this._normalizeMapWeatherKey(mapKey);
    return this._normalizeWeatherKey(this.mapWeatherByMap?.[key]);
  }

  setMapWeather(mapKey, weather) {
    const key = this._normalizeMapWeatherKey(mapKey);
    const normalizedWeather = this._normalizeWeatherKey(weather);
    if (!normalizedWeather) return null;
    if (!this.mapWeatherByMap || typeof this.mapWeatherByMap !== "object") {
      this.mapWeatherByMap = {};
    }
    this.mapWeatherByMap[key] = normalizedWeather;
    return normalizedWeather;
  }

  ensureMapWeather(mapKey, weatherFactory) {
    const existing = this.getMapWeather(mapKey);
    if (existing) return existing;

    const rolledWeather = typeof weatherFactory === "function" ? weatherFactory() : null;
    return this.setMapWeather(mapKey, rolledWeather);
  }

  /** 図鑑: モンスターを見た */
  markSeen(speciesId) {
    if (speciesId && !this.seenIds.includes(speciesId)) {
      this.seenIds.push(speciesId);
    }
  }

  /** 図鑑: モンスターを捕まえた */
  markCaught(speciesId) {
    this.markSeen(speciesId);
    if (speciesId && !this.caughtIds.includes(speciesId)) {
      this.caughtIds.push(speciesId);
    }
  }

  /** 経験値追加、レベルアップ数を返す */
  addPartyExp(amount) {
    const leader = this.getLeader();
    if (!leader) return 0;
    return this.addExpToMonster(leader, amount);
  }

  /** 指定モンスターに経験値を追加、詳細結果を返す */
  addExpToMonsterDetailed(monster, amount) {
    if (!monster || !monster.species) {
      return {
        levelsGained: 0,
        learnedMoves: [],
      };
    }

    let levelsGained = 0;
    const learnedMoves = [];

    monster.exp = (monster.exp || 0) + amount;
    while (monster.exp >= monster.nextLevelExp) {
      const prevLevel = monster.level;
      monster.exp -= monster.nextLevelExp;
      monster.level += 1;
      levelsGained += 1;
      monster.nextLevelExp = 10 + 8 * monster.level;

      const learned = getLearnedMovesByLevelUp(monster, prevLevel, monster.level);
      learned.forEach((move) => {
        if (!learnedMoves.some((m) => m.id === move.id)) {
          learnedMoves.push(move);
        }
      });

      const stats = calcStats(monster.species, monster.level);
      monster.currentHp = stats.maxHp;
    }

    syncMonsterMoves(monster);

    return {
      levelsGained,
      learnedMoves,
    };
  }

  /** 指定モンスターに経験値を追加、レベルアップ数を返す */
  addExpToMonster(monster, amount) {
    return this.addExpToMonsterDetailed(monster, amount).levelsGained;
  }

  /** 通貨を加算 */
  addMoney(amount) {
    this.money = (this.money || 0) + amount;
  }

  /** インベントリにアイテムを追加（既存なら数量加算） */
  addItem(itemId, quantity = 1) {
    if (!itemId || quantity <= 0) return;
    const existing = this.inventory.find((entry) => entry.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.inventory.push({ itemId, quantity });
    }
  }

  /** 指定額を支払えれば true を返す */
  spendMoney(amount) {
    if ((this.money || 0) >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  getWildWinStreak() {
    return Math.max(0, Math.floor(this.wildWinStreak || 0));
  }

  addWildWinStreak(amount = 1) {
    const safeAmount = Math.max(1, Math.floor(amount));
    this.wildWinStreak = this.getWildWinStreak() + safeAmount;
    return this.wildWinStreak;
  }

  resetWildWinStreak() {
    this.wildWinStreak = 0;
  }

  /** パーティ内のモンスターの並びを入れ替え */
  swapPartyOrder(indexA, indexB) {
    if (indexA < 0 || indexA >= this.party.length) return;
    if (indexB < 0 || indexB >= this.party.length) return;
    const tmp = this.party[indexA];
    this.party[indexA] = this.party[indexB];
    this.party[indexB] = tmp;
  }

  /** ボックスのモンスターをパーティに移動（パーティに空きがある場合） */
  moveBoxToParty(boxIndex) {
    if (boxIndex < 0 || boxIndex >= (this.box || []).length) return false;
    if ((this.party || []).length >= 6) return false;
    const mon = this.box.splice(boxIndex, 1)[0];
    this.party.push(mon);
    return true;
  }

  /** ボックスのモンスターとパーティのモンスターを入れ替え */
  swapBoxWithParty(boxIndex, partyIndex) {
    if (boxIndex < 0 || boxIndex >= (this.box || []).length) return false;
    if (partyIndex < 0 || partyIndex >= (this.party || []).length) return false;
    // パーティに1体しかいない場合は交代禁止
    if (this.party.length <= 1) return false;
    const boxMon = this.box[boxIndex];
    this.box[boxIndex] = this.party[partyIndex];
    this.party[partyIndex] = boxMon;
    return true;
  }

  /** ボックスのモンスターを手放す（削除） */
  releaseFromBox(boxIndex) {
    if (boxIndex < 0 || boxIndex >= (this.box || []).length) return null;
    const released = this.box.splice(boxIndex, 1)[0];
    return released;
  }

  hasPartyType(type) {
    if (!type) return false;
    return this.party.some((monster) => monster?.species?.primaryType === type);
  }

  getFusionDiscoveries() {
    if (!Array.isArray(this.discoveredFusionRecipes)) {
      this.discoveredFusionRecipes = [];
    }
    return this.discoveredFusionRecipes;
  }

  discoverFusionRecipe(speciesIdA, speciesIdB) {
    if (!speciesIdA || !speciesIdB) return;
    const key = [speciesIdA, speciesIdB].sort().join("+");
    const list = this.getFusionDiscoveries();
    if (!list.includes(key)) {
      list.push(key);
    }
  }

  getFusionPreviewForParty(baseIndex) {
    const base = this.party[baseIndex];
    if (!base?.species) return [];

    const previews = [];
    this.party.forEach((candidate, index) => {
      if (index === baseIndex || !candidate?.species) return;
      const resultId = getFusionRecipeResult(base.species.id, candidate.species.id);
      if (!resultId || !MONSTERS[resultId]) return;
      previews.push({
        materialIndex: index,
        materialId: candidate.species.id,
        materialName: candidate.species.name,
        materialEmoji: candidate.species.emoji,
        resultId,
        resultName: MONSTERS[resultId].name,
        resultEmoji: MONSTERS[resultId].emoji,
      });
    });

    return previews;
  }

  /**
   * パーティ内のモンスターを合成する（素材1体を消費してベース1体を強化）
    * @returns {{success:boolean, reason?:string, baseName?:string, materialName?:string, levelUps?:number, healed?:number, baseIndex?:number, transformed?:boolean, resultName?:string}}
   */
  fusePartyMonsters(baseIndex, materialIndex) {
    if (this.party.length < 2) {
      return { success: false, reason: "モンスターが たりない" };
    }
    if (baseIndex === materialIndex) {
      return { success: false, reason: "おなじモンスターは えらべない" };
    }
    if (baseIndex < 0 || baseIndex >= this.party.length) {
      return { success: false, reason: "ベースの選択が不正" };
    }
    if (materialIndex < 0 || materialIndex >= this.party.length) {
      return { success: false, reason: "素材の選択が不正" };
    }

    const baseMonster = this.party[baseIndex];
    const materialMonster = this.party[materialIndex];
    if (!baseMonster?.species || !materialMonster?.species) {
      return { success: false, reason: "合成対象が不正" };
    }

    const baseSpeciesIdBeforeFusion = baseMonster.species.id;
    const baseName = baseMonster.species.name;
    const materialName = materialMonster.species.name;
    const recipeResultId = getFusionRecipeResult(baseMonster.species.id, materialMonster.species.id);
    let transformed = false;
    let resultName = null;
    if (recipeResultId && MONSTERS[recipeResultId]) {
      baseMonster.species = MONSTERS[recipeResultId];
      transformed = true;
      resultName = baseMonster.species.name;
      this.discoverFusionRecipe(baseSpeciesIdBeforeFusion, materialMonster.species.id);
      this.markCaught(baseMonster.species.id);
    }

    baseMonster.nextLevelExp = 10 + 8 * baseMonster.level;
    const materialBonus = Math.max(6, Math.floor((materialMonster.nextLevelExp || 0) * 0.5));
    const bonusExp = (materialMonster.exp || 0) + materialBonus;
    const levelUps = this.addExpToMonster(baseMonster, bonusExp);

    const stats = calcStats(baseMonster.species, baseMonster.level);
    const beforeHp = Math.max(0, Math.min(baseMonster.currentHp, stats.maxHp));
    const recoverAmount = Math.max(1, Math.floor(stats.maxHp * 0.35));
    baseMonster.currentHp = Math.min(stats.maxHp, beforeHp + recoverAmount);
    const healed = baseMonster.currentHp - beforeHp;

    this.party.splice(materialIndex, 1);

    const adjustedBaseIndex = materialIndex < baseIndex ? baseIndex - 1 : baseIndex;
    return {
      success: true,
      baseName,
      materialName,
      levelUps,
      healed,
      baseIndex: adjustedBaseIndex,
      transformed,
      resultName,
    };
  }

  // ── セーブ / ロード ──

  /** セーブデータがあるか */
  hasSaveData() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  loadAudioSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.audioSettings = {
        muted: !!parsed?.muted,
        bgmVolume: typeof parsed?.bgmVolume === "number" ? parsed.bgmVolume : 0.3,
        seVolume: typeof parsed?.seVolume === "number" ? parsed.seVolume : 0.5,
      };
      this.gameplaySettings = sanitizeGameplaySettings(parsed?.gameplaySettings);
    } catch {
      this.audioSettings = {
        muted: false,
        bgmVolume: 0.3,
        seVolume: 0.5,
      };
      this.gameplaySettings = { ...DEFAULT_GAMEPLAY_SETTINGS };
    }
  }

  saveAudioSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        ...this.audioSettings,
        gameplaySettings: sanitizeGameplaySettings(this.gameplaySettings),
      }));
      return true;
    } catch {
      return false;
    }
  }

  /** ゲーム状態をセーブ */
  save() {
    try {
      const data = {
        playerName: this.playerName,
        playerPosition: { ...this.playerPosition },
        playerDirection: this.playerDirection,
        currentMap: this.currentMap,
        mapWeatherByMap: { ...(this.mapWeatherByMap || {}) },
        party: this.party.map((m) => ({
          speciesId: m.species ? m.species.id : null,
          level: m.level,
          exp: m.exp,
          nextLevelExp: m.nextLevelExp,
          currentHp: m.currentHp,
          attackStage: 0,
          defenseStage: 0,
          moveIds: m.moveIds || [],
          pp: m.pp || [],
        })),
        box: (this.box || []).map((m) => ({
          speciesId: m.species ? m.species.id : null,
          level: m.level,
          exp: m.exp,
          nextLevelExp: m.nextLevelExp,
          currentHp: m.currentHp,
          moveIds: m.moveIds || [],
          pp: m.pp || [],
        })),
        inventory: this.inventory.map((it) => ({ ...it })),
        money: this.money,
        starQuestDone: this.starQuestDone,
        gymCleared: this.gymCleared,
        arenaWins: this.arenaWins,
        arenaHighScore: this.arenaHighScore,
        caughtIds: [...this.caughtIds],
        seenIds: [...this.seenIds],
        totalBattles: this.totalBattles,
        totalCatches: this.totalCatches,
        playTimeMs: this.playTimeMs,
        wildWinStreak: this.getWildWinStreak(),
        discoveredFusionRecipes: [...this.getFusionDiscoveries()],
        dailyChallenge: this.getDailyChallenge(),
        audioSettings: { ...this.audioSettings },
        gameplaySettings: sanitizeGameplaySettings(this.gameplaySettings),
        storyFlags: { ...(this.storyFlags || {}) },
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn("セーブに失敗:", e);
      return false;
    }
  }

  /** セーブデータをロード */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);

      this.playerName = typeof data.playerName === "string" && data.playerName.trim().length > 0
        ? data.playerName.trim().slice(0, 16)
        : "ユウ";
      this.playerPosition = {
        x: clampInt(data.playerPosition?.x, 0, 255, 8),
        y: clampInt(data.playerPosition?.y, 0, 255, 10),
      };
      const loadedDirection = data.playerDirection;
      this.playerDirection = ["up", "down", "left", "right"].includes(loadedDirection)
        ? loadedDirection
        : "down";
      this.currentMap = data.currentMap || "EMOJI_TOWN";
      const rawMapWeather = data.mapWeatherByMap;
      this.mapWeatherByMap = {};
      if (rawMapWeather && typeof rawMapWeather === "object") {
        Object.entries(rawMapWeather).forEach(([mapKey, weather]) => {
          const normalizedMapKey = this._normalizeMapWeatherKey(mapKey);
          const normalizedWeather = this._normalizeWeatherKey(weather);
          if (normalizedMapKey && normalizedWeather) {
            this.mapWeatherByMap[normalizedMapKey] = normalizedWeather;
          }
        });
      }
      this.inBattle = false;
      this.activeBattle = null;

      this.party = (Array.isArray(data.party) ? data.party : [])
        .map((saved) => buildLoadedMonster(saved))
        .filter(Boolean);
      this.box = (Array.isArray(data.box) ? data.box : [])
        .map((saved) => buildLoadedMonster(saved))
        .filter(Boolean);

      this.inventory = sanitizeInventory(data.inventory);
      this.money = clampInt(data.money, 0, MAX_MONEY, 0);
      this.starQuestDone = !!data.starQuestDone;
      this.gymCleared = !!data.gymCleared;
      this.arenaWins = clampInt(data.arenaWins, 0, MAX_COUNTER, 0);
      this.arenaHighScore = clampInt(data.arenaHighScore, 0, MAX_COUNTER, 0);
      this.caughtIds = sanitizeIdList(data.caughtIds);
      this.seenIds = sanitizeIdList(data.seenIds);
      this.totalBattles = clampInt(data.totalBattles, 0, MAX_COUNTER, 0);
      this.totalCatches = clampInt(data.totalCatches, 0, MAX_COUNTER, 0);
      this.playTimeMs = clampInt(data.playTimeMs, 0, MAX_PLAY_TIME_MS, 0);
      this.wildWinStreak = clampInt(data.wildWinStreak, 0, MAX_COUNTER, 0);
      this.discoveredFusionRecipes = Array.isArray(data.discoveredFusionRecipes)
        ? [...new Set(data.discoveredFusionRecipes.filter((v) => typeof v === "string"))]
        : [];
      this.dailyChallenge = data.dailyChallenge || null;
      this.refreshDailyChallenge();
      this.audioSettings = {
        muted: !!data.audioSettings?.muted,
        bgmVolume: typeof data.audioSettings?.bgmVolume === "number" ? data.audioSettings.bgmVolume : 0.3,
        seVolume: typeof data.audioSettings?.seVolume === "number" ? data.audioSettings.seVolume : 0.5,
      };
      this.gameplaySettings = sanitizeGameplaySettings(data.gameplaySettings);
      this.saveAudioSettings();
      // ストーリーフラグのロード（古いセーブデータには存在しない可能性）
      this.storyFlags = {
        prologueDone: !!data.storyFlags?.prologueDone,
        starterChosen: !!data.storyFlags?.starterChosen,
        rivalIntroDone: !!data.storyFlags?.rivalIntroDone,
        townRivalBeaten: !!data.storyFlags?.townRivalBeaten,
        forestCrystalFound: !!data.storyFlags?.forestCrystalFound,
        forestRivalBeaten: !!data.storyFlags?.forestRivalBeaten,
        caveEvilBeaten: !!data.storyFlags?.caveEvilBeaten,
        caveRivalBeaten3: !!data.storyFlags?.caveRivalBeaten3,
        darkTowerGruntBeaten: !!data.storyFlags?.darkTowerGruntBeaten,
        darkTowerVoidBeaten: !!data.storyFlags?.darkTowerVoidBeaten,
        volcanoEvilBossBeaten: !!data.storyFlags?.volcanoEvilBossBeaten,
        frozenPeakGymCleared: !!data.storyFlags?.frozenPeakGymCleared,
        frozenPeakRivalBeaten: !!data.storyFlags?.frozenPeakRivalBeaten,
        frozenPeakIceQuest: !!data.storyFlags?.frozenPeakIceQuest,
        ruinsFinalDone: !!data.storyFlags?.ruinsFinalDone,
        legendaryDefeated: !!data.storyFlags?.legendaryDefeated,
        forestScoutBeaten: !!data.storyFlags?.forestScoutBeaten,
        caveScholarBeaten: !!data.storyFlags?.caveScholarBeaten,
        darkTowerSentinelBeaten: !!data.storyFlags?.darkTowerSentinelBeaten,
        volcanicScoutBeaten: !!data.storyFlags?.volcanicScoutBeaten,
        frozenSageBeaten: !!data.storyFlags?.frozenSageBeaten,
        ruinsGuardianBeaten: !!data.storyFlags?.ruinsGuardianBeaten,
        starterSpeciesId: data.storyFlags?.starterSpeciesId || null,
        forestSwimTreasureTaken: !!data.storyFlags?.forestSwimTreasureTaken,
        caveHiddenItemFound: !!data.storyFlags?.caveHiddenItemFound,
        // チュートリアルフラグ
        introNarrationDone: !!data.storyFlags?.introNarrationDone,
        tutorialMoveDone: !!data.storyFlags?.tutorialMoveDone,
        tutorialBattleDone: !!data.storyFlags?.tutorialBattleDone,
        tutorialCatchDone: !!data.storyFlags?.tutorialCatchDone,
        tutorialMenuDone: !!data.storyFlags?.tutorialMenuDone,
        momFarewellDone: !!data.storyFlags?.momFarewellDone,
      };
      // 古いセーブ互換: パーティがある場合はstarterChosenをtrueに
      if (this.party.length > 0 && !this.storyFlags.starterChosen) {
        this.storyFlags.starterChosen = true;
        this.storyFlags.prologueDone = true;
        // 古いセーブではチュートリアルも完了扱い
        this.storyFlags.introNarrationDone = true;
        this.storyFlags.tutorialMoveDone = true;
        this.storyFlags.tutorialBattleDone = true;
        this.storyFlags.tutorialCatchDone = true;
        this.storyFlags.tutorialMenuDone = true;
        this.storyFlags.momFarewellDone = true;
      }

      return true;
    } catch (e) {
      console.warn("ロードに失敗:", e);
      return false;
    }
  }

  /** セーブデータを削除 */
  deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // 無視
    }
  }
}

export const gameState = new GameState();

