import {
  MONSTERS,
  calcStats,
  getFusionRecipeResult,
  getMonsterMaxStamina,
  getLearnedMovesByLevelUp,
  normalizeMonsterStamina,
  rollMonsterAbilityId,
  syncMonsterMoves,
} from "../data/monsters.ts";
import { checkNewAchievements, getAchievementById, getAchievementReward } from "../data/achievements.ts";
import {
  SAVE_KEY,
  SAVE_BACKUP_KEY,
  SETTINGS_KEY,
  DEFAULT_GAMEPLAY_SETTINGS,
  MAX_MONEY,
  MAX_COUNTER,
  MAX_PLAY_TIME_MS,
  DEFAULT_FIELD_TIME_MINUTES,
  VALID_WEATHER_KEYS,
  parseAndValidateSaveData,
  sanitizeGameplaySettings,
  clampInt,
  normalizeFieldTimeMinutes,
  sanitizeIdList,
  sanitizeInventory,
  buildLoadedMonster,
} from "./saveSchema.ts";
import { createDefaultStoryFlags, sanitizeStoryFlags } from "./storyFlags.ts";
import { getLocalDateKey, buildDailyChallenge } from "./dailyChallenge.ts";

export const PARTY_CAPACITY = 3;
const SAVE_TEMP_KEY = `${SAVE_KEY}_tmp`;

/** モンスターの表示名を取得（ニックネーム優先） */
export function getMonsterDisplayName(monster) {
  if (!monster) return "？";
  if (monster.nickname && typeof monster.nickname === "string" && monster.nickname.trim().length > 0) {
    return monster.nickname.trim();
  }
  return monster.species?.name || "？";
}

class GameState {
  constructor() {
    this.playerName = "ユウ";
    this.playerPosition = { x: 8, y: 10 };
    this.playerDirection = "down";
    this.currentMap = "EMOJI_TOWN";
    this.lastHealPoint = { mapKey: "EMOJI_TOWN", x: 10, y: 10 };
    this.visitedMapIds = ["EMOJI_TOWN"];
    this.mapWeatherByMap = {};
    this.fieldTimeMinutes = DEFAULT_FIELD_TIME_MINUTES;
    this.inBattle = false;
    this.activeBattle = null;
    this.lastBattleResult = null;
    this.party = [];
    this.inventory = [];
    this.money = 0;
    this.starQuestDone = false;
    this.gymCleared = false;
    this.arenaWins = 0;        // 闘技場の連勝数
    this.arenaHighScore = 0;   // 闘技場の最高連勝記録
    this.arenaRound = 0;
    this.battleWinStreak = 0;
    // 図鑑：捕まえた or 見つけたモンスター ID
    this.caughtIds = [];
    this.seenIds = [];
    // 累計統計
    this.totalBattles = 0;
    this.totalCatches = 0;
    this.playTimeMs = 0;
    this.box = []; // パーティ上限(3)を超えたモンスター保管
    this.discoveredFusionRecipes = [];
    this.dailyChallenge = null;
    this.unlockedAchievements = []; // 解除済み実績ID
    this._pendingAchievementNotifications = []; // 表示待ちの新実績
    this.audioSettings = {
      muted: false,
      bgmVolume: 0.3,
      seVolume: 0.5,
    };
    this.gameplaySettings = { ...DEFAULT_GAMEPLAY_SETTINGS };
    this.storyFlags = createDefaultStoryFlags();
    this.menuLastIndex = 0;
    this.lastSaveErrorCode = null;
    this.lastSaveErrorMessage = "";
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
    this.lastHealPoint = { mapKey: "EMOJI_TOWN", x: 10, y: 10 };
    this.visitedMapIds = ["EMOJI_TOWN"];
    this.mapWeatherByMap = {};
    this.fieldTimeMinutes = DEFAULT_FIELD_TIME_MINUTES;
    this.inBattle = false;
    this.activeBattle = null;
    this.lastBattleResult = null;

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
    this.arenaRound = 0;
    this.battleWinStreak = 0;
    this.caughtIds = [];
    this.seenIds = [];
    this.totalBattles = 0;
    this.totalCatches = 0;
    this.playTimeMs = 0;
    this.box = [];
    this.discoveredFusionRecipes = [];
    this.dailyChallenge = null;
    this.unlockedAchievements = [];
    this._pendingAchievementNotifications = [];
    this.refreshDailyChallenge();
    this.audioSettings = prevAudioSettings;
    this.gameplaySettings = sanitizeGameplaySettings(prevGameplaySettings);
    this.storyFlags = createDefaultStoryFlags();
    this.menuLastIndex = 0;
    this.lastSaveErrorCode = null;
    this.lastSaveErrorMessage = "";
  }

  getLastSaveErrorCode() {
    return this.lastSaveErrorCode;
  }

  getLastSaveErrorMessage() {
    return this.lastSaveErrorMessage;
  }

  _setSaveError(error) {
    const name = error?.name || "";
    const message = String(error?.message || "");
    const isQuota = name === "QuotaExceededError"
      || message.includes("QuotaExceededError")
      || message.includes("quota");
    this.lastSaveErrorCode = isQuota ? "QUOTA_EXCEEDED" : "UNKNOWN";
    this.lastSaveErrorMessage = message;
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

  setLastHealPoint(mapKey, x, y) {
    this.lastHealPoint = {
      mapKey: typeof mapKey === "string" && mapKey.length > 0 ? mapKey : "EMOJI_TOWN",
      x: clampInt(x, 0, 255, 10),
      y: clampInt(y, 0, 255, 10),
    };
    return { ...this.lastHealPoint };
  }

  getLastHealPoint() {
    const point = this.lastHealPoint;
    if (!point || typeof point !== "object") {
      return { mapKey: "EMOJI_TOWN", x: 10, y: 10 };
    }
    return {
      mapKey: typeof point.mapKey === "string" && point.mapKey.length > 0 ? point.mapKey : "EMOJI_TOWN",
      x: clampInt(point.x, 0, 255, 10),
      y: clampInt(point.y, 0, 255, 10),
    };
  }

  isAutoSaveEnabled() {
    return this.gameplaySettings?.autoSaveEnabled !== false;
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
    if (battlePayload.player) {
      syncMonsterMoves(battlePayload.player);
      normalizeMonsterStamina(battlePayload.player);
    }
    if (battlePayload.opponent) {
      syncMonsterMoves(battlePayload.opponent);
      normalizeMonsterStamina(battlePayload.opponent);
    }
    this.activeBattle = battlePayload;
    this.lastBattleResult = null;
  }

  setLastBattleResult(result) {
    if (!result || typeof result !== "object") {
      this.lastBattleResult = null;
      return;
    }
    this.lastBattleResult = {
      isTrainer: !!result.isTrainer,
      trainerBattleKey: typeof result.trainerBattleKey === "string" ? result.trainerBattleKey : null,
      storyBattleKey: typeof result.storyBattleKey === "string" ? result.storyBattleKey : null,
      won: !!result.won,
    };
  }

  updateBattleWinStreak(won) {
    if (won) {
      this.battleWinStreak = Math.max(0, (this.battleWinStreak || 0)) + 1;
    } else {
      this.battleWinStreak = 0;
    }
    return this.battleWinStreak;
  }

  consumeLastBattleResult() {
    const result = this.lastBattleResult;
    this.lastBattleResult = null;
    return result;
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

  getFieldTimeMinutes() {
    return normalizeFieldTimeMinutes(this.fieldTimeMinutes);
  }

  setFieldTimeMinutes(minutes) {
    this.fieldTimeMinutes = normalizeFieldTimeMinutes(minutes);
    return this.fieldTimeMinutes;
  }

  advanceFieldTime(minutes) {
    const previousMinutes = this.getFieldTimeMinutes();
    const nextMinutes = normalizeFieldTimeMinutes(previousMinutes + (Number.isFinite(minutes) ? minutes : 0));
    this.fieldTimeMinutes = nextMinutes;
    const previousHour = Math.floor(previousMinutes / 60);
    const currentHour = Math.floor(nextMinutes / 60);
    return {
      previousMinutes,
      currentMinutes: nextMinutes,
      previousHour,
      currentHour,
      hourChanged: previousHour !== currentHour,
    };
  }

  getFieldTime() {
    const totalMinutes = this.getFieldTimeMinutes();
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return {
      totalMinutes,
      hour,
      minute,
    };
  }

  getFieldTimeLabel() {
    const { hour, minute } = this.getFieldTime();
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  // ── 実績システム ──

  /**
   * 実績の達成状況をチェックし、新しく達成されたものを通知キューに追加する
   * @returns 新しく達成された実績IDの配列
   */
  checkAchievements() {
    if (!Array.isArray(this.unlockedAchievements)) {
      this.unlockedAchievements = [];
    }
    const newIds = checkNewAchievements(this.unlockedAchievements);
    if (newIds.length > 0) {
      this.unlockedAchievements.push(...newIds);
      if (!Array.isArray(this._pendingAchievementNotifications)) {
        this._pendingAchievementNotifications = [];
      }
      newIds.forEach((id) => {
        const def = getAchievementById(id);
        if (def) {
          this._grantAchievementReward(def);
          this._pendingAchievementNotifications.push(def);
        }
      });
    }
    return newIds;
  }

  /** 実績報酬を付与する */
  _grantAchievementReward(achievementDef) {
    if (!achievementDef) return;
    const reward = getAchievementReward(achievementDef);
    const money = Math.max(0, Math.floor(reward?.money || 0));
    if (money > 0) {
      this.addMoney(money);
    }

    const itemId = reward?.itemId;
    const itemQty = Math.max(1, Math.floor(reward?.itemQty || 1));
    if (itemId && itemQty > 0) {
      this.addItem(itemId, itemQty);
    }
  }

  /** 未表示の実績通知を取得して消費する */
  consumeAchievementNotifications() {
    if (!Array.isArray(this._pendingAchievementNotifications)) {
      this._pendingAchievementNotifications = [];
      return [];
    }
    const pending = [...this._pendingAchievementNotifications];
    this._pendingAchievementNotifications = [];
    return pending;
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

  /** 訪問済みマップを記録 */
  markMapVisited(mapKey) {
    if (typeof mapKey !== "string" || mapKey.length === 0) return;
    if (!Array.isArray(this.visitedMapIds)) this.visitedMapIds = ["EMOJI_TOWN"];
    if (!this.visitedMapIds.includes(mapKey)) {
      this.visitedMapIds.push(mapKey);
    }
  }

  /** 訪問済みかどうか */
  hasVisitedMap(mapKey) {
    if (typeof mapKey !== "string" || mapKey.length === 0) return false;
    if (!Array.isArray(this.visitedMapIds)) return mapKey === "EMOJI_TOWN";
    return this.visitedMapIds.includes(mapKey);
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
      
      // レベルアップでキズナが深まる
      this.addBond(monster, 5);
    }

    syncMonsterMoves(monster);

    return {
      levelsGained,
      learnedMoves,
    };
  }
  /** モンスターにキズナポイントを追加（0〜100に収める） */
  addBond(monster, amount) {
    if (!monster) return;
    const current = monster.bond || 0;
    monster.bond = Math.max(0, Math.min(100, current + amount));
  }

  /** 手持ちのモンスター全員にキズナポイントを追加 */
  addBondToParty(amount) {
    this.party.forEach((m) => this.addBond(m, amount));
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

  /** インベントリからアイテムを消費（不足時はfalse） */
  removeItem(itemId, quantity = 1) {
    if (!itemId || quantity <= 0) return false;
    const existing = this.inventory.find((entry) => entry.itemId === itemId);
    if (!existing || existing.quantity < quantity) return false;
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      this.inventory = this.inventory.filter((entry) => entry.quantity > 0);
    }
    return true;
  }

  /** 指定額を支払えれば true を返す */
  spendMoney(amount) {
    if ((this.money || 0) >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
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
    if ((this.party || []).length >= PARTY_CAPACITY) return false;
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
    return this.party.some((monster) =>
      monster?.species?.primaryType === type || monster?.species?.secondaryType === type
    );
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
      baseMonster.abilityId = rollMonsterAbilityId(baseMonster.species);
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
      return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_TEMP_KEY));
    } catch (error) {
      console.warn("gameState: セーブ有無確認に失敗", error);
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
    } catch (error) {
      console.warn("gameState: オーディオ設定ロードに失敗", error);
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
    } catch (error) {
      console.warn("gameState: オーディオ設定保存に失敗", error);
      return false;
    }
  }

  /** ゲーム状態をセーブ */
  save() {
    this.lastSaveErrorCode = null;
    this.lastSaveErrorMessage = "";
    try {
      const data = {
        playerName: this.playerName,
        playerPosition: { ...this.playerPosition },
        playerDirection: this.playerDirection,
        currentMap: this.currentMap,
        lastHealPoint: this.getLastHealPoint(),
        visitedMapIds: [...new Set(Array.isArray(this.visitedMapIds) ? this.visitedMapIds : ["EMOJI_TOWN"])],
        mapWeatherByMap: { ...this.mapWeatherByMap },
        fieldTimeMinutes: this.getFieldTimeMinutes(),
        party: this.party.map((m) => ({
          speciesId: m.species ? m.species.id : null,
          abilityId: typeof m.abilityId === "string" && m.abilityId.length > 0
            ? m.abilityId
            : rollMonsterAbilityId(m.species),
          level: m.level,
          exp: m.exp,
          nextLevelExp: m.nextLevelExp,
          currentHp: m.currentHp,
          bond: m.bond || 0,
          nickname: m.nickname || null,
          moveIds: m.moveIds || [],
          stamina: Number.isFinite(m.stamina)
            ? Math.floor(m.stamina)
            : getMonsterMaxStamina(),
        })),
        box: (this.box || []).map((m) => ({
          speciesId: m.species ? m.species.id : null,
          abilityId: typeof m.abilityId === "string" && m.abilityId.length > 0
            ? m.abilityId
            : rollMonsterAbilityId(m.species),
          level: m.level,
          exp: m.exp,
          nextLevelExp: m.nextLevelExp,
          currentHp: m.currentHp,
          bond: m.bond || 0,
          nickname: m.nickname || null,
          moveIds: m.moveIds || [],
          stamina: Number.isFinite(m.stamina)
            ? Math.floor(m.stamina)
            : getMonsterMaxStamina(),
        })),
        inventory: this.inventory.map((it) => ({ ...it })),
        money: this.money,
        starQuestDone: this.starQuestDone,
        gymCleared: this.gymCleared,
        arenaWins: this.arenaWins,
        arenaHighScore: this.arenaHighScore,
        arenaRound: this.arenaRound,
        battleWinStreak: this.battleWinStreak,
        caughtIds: [...this.caughtIds],
        seenIds: [...this.seenIds],
        totalBattles: this.totalBattles,
        totalCatches: this.totalCatches,
        playTimeMs: this.playTimeMs,
        discoveredFusionRecipes: [...this.getFusionDiscoveries()],
        unlockedAchievements: Array.isArray(this.unlockedAchievements) ? [...this.unlockedAchievements] : [],
        dailyChallenge: this.getDailyChallenge(),
        audioSettings: { ...this.audioSettings },
        gameplaySettings: sanitizeGameplaySettings(this.gameplaySettings),
        storyFlags: { ...this.storyFlags },
        savedAt: Date.now(),
      };
      const serialized = JSON.stringify(data);
      const previous = localStorage.getItem(SAVE_KEY);

      localStorage.setItem(SAVE_TEMP_KEY, serialized);
      if (previous) {
        localStorage.setItem(SAVE_BACKUP_KEY, previous);
      }
      localStorage.setItem(SAVE_KEY, serialized);
      localStorage.removeItem(SAVE_TEMP_KEY);
      return true;
    } catch (e) {
      this._setSaveError(e);
      try {
        localStorage.removeItem(SAVE_TEMP_KEY);
      } catch (cleanupError) {
        console.warn("gameState: 一時セーブ削除に失敗", cleanupError);
      }
      console.warn("セーブに失敗:", e);
      return false;
    }
  }

  /** セーブデータをロード */
  load() {
    const applyLoadedData = (data) => {
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
      this.lastHealPoint = {
        mapKey: typeof data.lastHealPoint?.mapKey === "string" && data.lastHealPoint.mapKey.length > 0
          ? data.lastHealPoint.mapKey
          : "EMOJI_TOWN",
        x: clampInt(data.lastHealPoint?.x, 0, 255, 10),
        y: clampInt(data.lastHealPoint?.y, 0, 255, 10),
      };
      this.visitedMapIds = sanitizeIdList(data.visitedMapIds);
      if (!this.visitedMapIds.includes("EMOJI_TOWN")) {
        this.visitedMapIds.unshift("EMOJI_TOWN");
      }
      this.markMapVisited(this.currentMap);
      this.fieldTimeMinutes = normalizeFieldTimeMinutes(data.fieldTimeMinutes);
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
      this.lastBattleResult = null;

      this.party = (Array.isArray(data.party) ? data.party : [])
        .map((saved) => buildLoadedMonster(saved))
        .filter(Boolean);
      this.box = (Array.isArray(data.box) ? data.box : [])
        .map((saved) => buildLoadedMonster(saved))
        .filter(Boolean);
      if (this.party.length > PARTY_CAPACITY) {
        const overflow = this.party.splice(PARTY_CAPACITY);
        this.box = [...overflow, ...this.box];
      }

      this.inventory = sanitizeInventory(data.inventory);
      this.money = clampInt(data.money, 0, MAX_MONEY, 0);
      this.starQuestDone = !!data.starQuestDone;
      this.gymCleared = !!data.gymCleared;
      this.arenaWins = clampInt(data.arenaWins, 0, MAX_COUNTER, 0);
      this.arenaHighScore = clampInt(data.arenaHighScore, 0, MAX_COUNTER, 0);
      this.arenaRound = clampInt(data.arenaRound, 0, MAX_COUNTER, 0);
      this.battleWinStreak = clampInt(data.battleWinStreak, 0, MAX_COUNTER, 0);
      this.caughtIds = sanitizeIdList(data.caughtIds);
      this.seenIds = sanitizeIdList(data.seenIds);
      this.totalBattles = clampInt(data.totalBattles, 0, MAX_COUNTER, 0);
      this.totalCatches = clampInt(data.totalCatches, 0, MAX_COUNTER, 0);
      this.playTimeMs = clampInt(data.playTimeMs, 0, MAX_PLAY_TIME_MS, 0);
      this.discoveredFusionRecipes = Array.isArray(data.discoveredFusionRecipes)
        ? [...new Set(data.discoveredFusionRecipes.filter((v) => typeof v === "string"))]
        : [];
      this.unlockedAchievements = Array.isArray(data.unlockedAchievements)
        ? [...new Set(data.unlockedAchievements.filter((v) => typeof v === "string"))]
        : [];
      this._pendingAchievementNotifications = [];
      this.dailyChallenge = data.dailyChallenge || null;
      this.refreshDailyChallenge();
      this.audioSettings = {
        muted: !!data.audioSettings?.muted,
        bgmVolume: typeof data.audioSettings?.bgmVolume === "number" ? data.audioSettings.bgmVolume : 0.3,
        seVolume: typeof data.audioSettings?.seVolume === "number" ? data.audioSettings.seVolume : 0.5,
      };
      this.gameplaySettings = sanitizeGameplaySettings(data.gameplaySettings);
      this.saveAudioSettings();
      // ストーリーフラグのロード
      this.storyFlags = sanitizeStoryFlags(data.storyFlags);
      return true;
    };

    const saveCandidates = [
      { key: SAVE_KEY, label: "メインセーブ" },
      { key: SAVE_TEMP_KEY, label: "一時セーブ" },
      { key: SAVE_BACKUP_KEY, label: "バックアップセーブ" },
    ];

    let hasAnyCandidate = false;
    for (const candidate of saveCandidates) {
      const raw = localStorage.getItem(candidate.key);
      if (!raw) continue;
      hasAnyCandidate = true;
      try {
        const parsed = JSON.parse(raw);
        const data = parseAndValidateSaveData(parsed, candidate.label);
        const loaded = applyLoadedData(data);
        if (loaded && candidate.key !== SAVE_KEY) {
          console.warn(`${candidate.label}から復旧しました。`);
        }
        if (loaded) return true;
      } catch (e) {
        console.warn(`${candidate.label}のロードに失敗:`, e);
      }
    }

    if (!hasAnyCandidate) return false;
    return false;
  }

  /** セーブデータを削除 */
  deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(SAVE_BACKUP_KEY);
      localStorage.removeItem(SAVE_TEMP_KEY);
    } catch (error) {
      console.warn("gameState: セーブ削除に失敗", error);
    }
  }
}

export const gameState = new GameState();

