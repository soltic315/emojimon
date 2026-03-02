import { gameState } from "../state/gameState.ts";
import {
  getGymBossMonster,
  getGymBoss2Monster,
  calcStats,
  getMonsterMaxStamina,
  MONSTERS,
  rollMonsterAbilityId,
  syncMonsterMoves,
} from "../data/monsters.ts";
import { createWildMonsterForEncounter, rollWeatherForMapByHour } from "../data/mapRules.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { TouchControls } from "../ui/TouchControls.ts";
import { NAV_REPEAT_INTERVAL_MS } from "../ui/inputConstants.ts";
import {
  FONT,
  COLORS,
  TEXT_COLORS,
  UI_LAYOUT,
  UI_FONT_SIZE,
  drawPanel,
  drawSelection,
  createMonsterEmojiDisplay,
  applyCanvasBrightness,
} from "../ui/UIHelper.ts";
import { addCameraBloom, createParticleBurst } from "../ui/FXHelper.ts";
import {
  TILE_SIZE,
  T,
  MAPS,
  MAP_FACILITY_MARKERS,
  MAP_BUILDING_DECOR,
  getMapNpcs,
  createMapLayout,
  DOOR_TRANSITIONS,
  SWIMMABLE_WATER_TILES,
  FIRE_ICE_BLOCKS,
  FIELD_HIDDEN_ITEMS,
  TELEPORT_PADS,
  POISON_SWAMP_DAMAGE,
} from "./world/worldMapData.ts";
import {
  getShopInventory,
  openShopMenu,
  closeShopMenu,
  clearShopMenu,
  renderShopMenu,
  handleShopInput,
} from "./world/worldShop.ts";
import {
  getFieldPeriodByHour,
  getFieldWeatherView,
  refreshFieldTimeWeatherEffects,
} from "./world/worldFieldEffects.ts";
import { renderMinimap, updateMinimapDot } from "./world/worldMinimap.ts";
import {
  handleTrainerInteraction as runTrainerInteraction,
  launchTrainerBattle as runLaunchTrainerBattle,
  buildTrainerOpponent as runBuildTrainerOpponent,
  handleTrainerBattleResult as runTrainerBattleResult,
  addEternaToParty as runAddEternaToParty,
  handleArenaInteraction as runArenaInteraction,
  startArenaRound as runStartArenaRound,
  checkArenaProgress as runCheckArenaProgress,
} from "./world/worldTrainerArena.ts";
import { canInteractInWorld, canOpenWorldMenu } from "./world/worldInputGuards.ts";
import { getAchievementRewardText } from "../data/achievements.ts";

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
  }

  init(data) {
    this.mapKey = data.mapKey || gameState.currentMap || "EMOJI_TOWN";
    if (data.startX !== undefined && data.startY !== undefined) {
      gameState.playerPosition.x = data.startX;
      gameState.playerPosition.y = data.startY;
    }
  }

  create() {
    gameState.currentMap = this.mapKey;
    gameState.markMapVisited(this.mapKey);
    gameState.ensureMapWeather(this.mapKey, () => rollWeatherForMapByHour(this.mapKey, gameState.getFieldTime().hour));
    audioManager.applySettings(gameState.audioSettings || {});
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);

    const mapDef = MAPS[this.mapKey] || MAPS.EMOJI_TOWN;
    this.mapWidth = mapDef.width;
    this.mapHeight = mapDef.height;

    this.shopActive = false;
    this.shopItems = [];
    this.shopSelectedIndex = 0;
    this.messageTimer = null;

    this.mapLayout = createMapLayout(this.mapKey);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Z,ENTER,SPACE,X,P,W,A,S,D,ESC");
    this.isMoving = false;
    this.isEncounterTransitioning = false;
    this._trainerBattlePending = false;
    this.encounterCooldown = 0;
    this.stepsSinceLastEncounter = 0;
    this.stepCount = 0;
    this.moveInputCooldown = 0;
    this.moveRepeatDelay = 130;
    this.fieldMinuteTickMs = 0;

    this.activeIceBlocks = this._buildActiveIceBlocks();
    this.hiddenItems = this._buildHiddenItems();
    this.fieldMarkers = [];
    this._shownFieldHints = new Set();
    this._labIntroTriggered = false;
    this._darkOverlayShown = false;
    this._darkOverlay = null;
    this._poisonStepCount = 0;

    this.createTilemap();
    this.createFieldAtmosphere();
    this.createPlayer();
    this.createNpcSprites();
    this.createUi();
    this._renderFieldActionMarkers();

    // PostFX: ブルームで映像美を向上
    addCameraBloom(this.cameras.main, { strength: 0.8, blurStrength: 0.5, steps: 3 });

    // フェードイン
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // BGM 再生（エリア別BGM）
    this.events.off("resume", this.handleSceneResume, this);
    this.events.on("resume", this.handleSceneResume, this);
    this.events.once("shutdown", this.handleSceneShutdown, this);
    this.events.once("destroy", this.handleSceneShutdown, this);
    audioManager.playAreaBgm(this.mapKey);

    // タッチコントロール
    this.touchControls = new TouchControls(this);
    this.touchControls.create();
    this._touchStarterChoiceNavCooldown = 0;

    // キー入力
    this._registerWorldInputHandlers();

    // セーブキー
    this._onWorldSaveDown = () => {
      if (this.shopActive) return;
      // オートセーブ通知
      const ok = gameState.save();
      audioManager.playSave();
      this.showMessage(ok ? "セーブしました！" : "セーブに失敗しました…", 2000);
    };
    this.keys.P.on("down", this._onWorldSaveDown);

    // ── 初回ナレーション自動発火 ──
    this._checkAutoIntro();

    // ── 研究所の博士説明自動発火 ──
    this._checkLabProfessorIntro();

    // 時刻・天候表示を初期化
    this._refreshFieldTimeWeatherEffects(true);
  }

  /**
   * 初起動時の自動イントロ（タウンにスポーンした直後）
   * ストーリー未開始 + ナレーション未了の場合のみ発火
   */
  _checkAutoIntro() {
    const sf = gameState.storyFlags;
    if (sf.introNarrationDone || sf.prologueDone) return;
    if (this.mapKey !== "EMOJI_TOWN") return;

    // 少し間を置いてからナレーション開始
    this.time.delayedCall(600, () => {
      this.showDialogSequence([
        "── ここは『エモじワールド』。",
        "── 人とモンスターが共に暮らす、不思議な世界。",
        "── モンスターたちは『エモじ』と呼ばれる絵文字の姿をしており、",
        "── それぞれが 炎、水、草…さまざまな力を宿している。",
        "── この世界の秩序は 5つの『エモじクリスタル』によって保たれてきた。",
        "── しかし今、悪の組織『ダーク団』がクリスタルを狙い 暗躍を始めている…。",
        "── クリスタルは 森、洞窟、塔、火山、遺跡に封じられているという。",
        "── すべての結晶が揃うと、天空の花園に古い扉が開くらしい…。",
        `── そんな中、${gameState.playerName}は ハカセからの手紙を受け取り、`,
        "── エモじタウンの研究所を訪れることになった。",
        "▶ WASDキーで移動、Zキーで話しかける。北の研究所に向かおう！",
      ], () => {
        sf.introNarrationDone = true;
        gameState.save();
      });
    });
  }

  /**
   * プロローグ後に研究所へ到着したら、博士説明を自動で開始
   */
  _checkLabProfessorIntro() {
    const sf = gameState.storyFlags;
    if (this.mapKey !== "LAB") return;
    if (sf.prologueDone || sf.starterChosen) return;
    if (this._labIntroTriggered) return;

    this._labIntroTriggered = true;
    this.time.delayedCall(420, () => {
      if (this._dialogActive || this._starterChoiceActive) return;
      this._doProfessorPrologue();
    });
  }

  handleSceneResume() {
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.isMoving = false;
    this.isEncounterTransitioning = false;
    this._trainerBattlePending = false;
    this.shopActive = false;
    this.clearShopMenu();
    if (this.messageTimer) {
      this.messageTimer.remove();
      this.messageTimer = null;
    }
    this.createUi();
    this._renderFieldActionMarkers();
    this.updateDefaultInfoMessage();
    this.setInfoText(this.defaultInfoMessage);
    this._refreshFieldTimeWeatherEffects(true);
    audioManager.playAreaBgm(this.mapKey);

    // 闘技場の進行チェック
    this._checkArenaProgress();

    // バトル結果チェック
    this._checkBattleResult();

    // 実績チェック & 通知
    this._checkAndShowAchievements();
  }

  /** オートセーブ時に画面右上にインジケーターを表示 */
  _showAutoSaveIndicator() {
    if (this._autoSaveIndicator && !this._autoSaveIndicator.scene) {
      this._autoSaveIndicator = null;
    }
    if (this._autoSaveIndicator) return; // 表示中の場合は重複しない

    const { width } = this.scale;
    const indicator = this.add.text(width - 12, 8, "💾 セーブ中…", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#86efac",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100).setAlpha(0);

    this._autoSaveIndicator = indicator;

    this.tweens.add({
      targets: indicator,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 600,
      onComplete: () => {
        if (indicator.scene) indicator.destroy();
        this._autoSaveIndicator = null;
      },
    });
  }

  /** オートセーブ（インジケーター付き） */
  autoSave() {
    if (!gameState.isAutoSaveEnabled()) return false;
    const ok = gameState.save();
    if (ok) this._showAutoSaveIndicator();
    return ok;
  }

  /** 実績をチェックし、新たに達成されたものをトースト表示する */
  _checkAndShowAchievements() {
    const newIds = gameState.checkAchievements();
    if (newIds.length === 0) return;

    // 通知をキューから取り出して順番に表示
    const notifications = gameState.consumeAchievementNotifications();
    notifications.forEach((def, i) => {
      this.time.delayedCall(i * 1800, () => {
        this._showAchievementToast(def);
      });
    });

    // 実績アンロック後にオートセーブ
    this.autoSave();
  }

  /** 実績達成のトースト通知を表示 */
  _showAchievementToast(achievementDef) {
    const { width } = this.scale;
    const toastW = 260;
    const toastH = 58;
    const toastX = width / 2 - toastW / 2;
    const toastY = -toastH;
    const rewardText = getAchievementRewardText(achievementDef);

    const container = this.add.container(toastX, toastY).setScrollFactor(0).setDepth(200);

    // 背景
    const bg = this.add.graphics();
    drawPanel(bg, 0, 0, toastW, toastH, {
      radius: 8,
      bgAlpha: 0.98,
      borderColor: COLORS.GOLD,
      borderWidth: 2,
      shadow: true,
      glow: true,
    });
    container.add(bg);

    // テキスト
    const icon = this.add.text(10, toastH / 2, achievementDef.icon, {
      fontFamily: FONT.EMOJI,
      fontSize: 20,
    }).setOrigin(0, 0.5);
    container.add(icon);

    const title = this.add.text(36, 8, "🏆 実績解除！", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#fbbf24",
    });
    container.add(title);

    const name = this.add.text(36, 24, achievementDef.name, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#e5e7eb",
    });
    container.add(name);

    const reward = this.add.text(36, 40, `🎁 ${rewardText}`, {
      fontFamily: FONT.UI,
      fontSize: 9,
      color: "#86efac",
    });
    container.add(reward);

    // スライドインアニメーション
    this.tweens.add({
      targets: container,
      y: 8,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: container,
            y: -toastH - 10,
            alpha: 0,
            duration: 350,
            ease: "Power2",
            onComplete: () => container.destroy(),
          });
        });
      },
    });
  }

  /** バトル後の結果処理 */
  _checkBattleResult() {
    const result = gameState.consumeLastBattleResult?.();
    if (!result) return;

    if (result.isTrainer && result.trainerBattleKey) {
      this._handleTrainerBattleResult(result.trainerBattleKey, !!result.won);
      this.time.delayedCall(200, () => {
        this.createNpcSprites();
      });
      return;
    }

    if (result.storyBattleKey === "garden_legendary") {
      const sf = gameState.storyFlags;
      if (result.won && !sf.legendaryDefeated) {
        sf.legendaryDefeated = true;
        gameState.save();
        this.showDialogSequence([
          "✨ エテルニアの分身は光となって空へ還っていった…",
          "✨ 花園に静寂が戻った。最深部への道が開かれていく。",
        ]);
      } else if (!result.won) {
        this.showMessage("✨ 強い気配はまだ消えていない…体勢を整えて再挑戦しよう。", 2500);
      }
    }
  }

  _registerWorldInputHandlers() {
    this._unbindWorldInputHandlers();

    this._onWorldInteractDown = () => {
      if (!canInteractInWorld(this)) return;
      this.checkNpcInteraction();
    };
    this._onWorldMenuDown = () => {
      if (!canOpenWorldMenu(this)) return;
      this.openMenu();
    };

    this.keys.Z.on("down", this._onWorldInteractDown);
    this.keys.ENTER.on("down", this._onWorldInteractDown);
    this.keys.SPACE.on("down", this._onWorldInteractDown);
    this.keys.X.on("down", this._onWorldMenuDown);
    this.keys.ESC.on("down", this._onWorldMenuDown);
  }

  _unbindWorldInputHandlers() {
    if (!this.keys) return;

    if (this._onWorldInteractDown) {
      this.keys.Z?.off("down", this._onWorldInteractDown);
      this.keys.ENTER?.off("down", this._onWorldInteractDown);
      this.keys.SPACE?.off("down", this._onWorldInteractDown);
      this._onWorldInteractDown = null;
    }
    if (this._onWorldMenuDown) {
      this.keys.X?.off("down", this._onWorldMenuDown);
      this.keys.ESC?.off("down", this._onWorldMenuDown);
      this._onWorldMenuDown = null;
    }
    if (this._onWorldSaveDown) {
      this.keys.P?.off("down", this._onWorldSaveDown);
      this._onWorldSaveDown = null;
    }
    if (this._dialogAdvanceListener) {
      this.keys.Z?.off("down", this._dialogAdvanceListener);
      this.keys.ENTER?.off("down", this._dialogAdvanceListener);
      this.keys.SPACE?.off("down", this._dialogAdvanceListener);
      this._dialogAdvanceListener = null;
    }
  }

  openMenu() {
    audioManager.playConfirm();
    this.scene.pause();
    this.scene.launch("MenuScene", { from: "WorldScene" });
  }

  handleSceneShutdown() {
    this.events.off("resume", this.handleSceneResume, this);
    this._unbindWorldInputHandlers();
    if (this.touchControls) {
      this.touchControls.destroy();
    }
    if (this.messageTimer) {
      this.messageTimer.remove();
      this.messageTimer = null;
    }
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
      this.weatherParticles = null;
    }
    this.timeTintOverlay?.destroy();
    this.weatherTintOverlay?.destroy();
    this.timeWeatherPanel?.destroy();
    this.timeWeatherText?.destroy();
    this._clearFieldMarkers();
    this._clearStarterLabels();
  }

  _getFieldPeriodByHour(hour) {
    return getFieldPeriodByHour(hour);
  }

  _getFieldWeatherView(weather) {
    return getFieldWeatherView(weather);
  }

  _refreshFieldTimeWeatherEffects(force = false) {
    refreshFieldTimeWeatherEffects(this, force);
  }

  _coordKey(x, y) {
    return `${x},${y}`;
  }

  _hasPartyType(type) {
    return gameState.hasPartyType(type);
  }

  _getPartyAverageLevel() {
    if (!Array.isArray(gameState.party) || gameState.party.length === 0) return 0;
    const total = gameState.party.reduce((sum, mon) => sum + (mon?.level || 1), 0);
    return Math.floor(total / gameState.party.length);
  }

  _getTransitionGateMessage(targetMapKey) {
    const sf = gameState.storyFlags || {};
    const avgLevel = this._getPartyAverageLevel();
    const catches = gameState.caughtIds?.length || 0;
    const battles = gameState.totalBattles || 0;
    const hasParty = Array.isArray(gameState.party) && gameState.party.length > 0;

    if (this.mapKey === "LAB" && targetMapKey === "EMOJI_TOWN" && !sf.starterChosen) {
      return "博士: まずは研究所で相棒を選ぶんじゃ。モンスターを選ぶまで外には出られんぞ。";
    }

    if (targetMapKey === "FOREST" && !hasParty) {
      return "モンスターを持たずにフィールドへは出られない。研究所で相棒を選ぼう。";
    }

    if (targetMapKey === "CRYSTAL_CAVE") {
      if (!sf.swampRangerBeaten) return "洞窟へ進む前に、湿地のレンジャー試験を突破しよう。";
      if (!sf.forestScoutBeaten) return "洞窟へ進む前に、森のレンジャー試験を突破しよう。";
      if (catches < 6) return `洞窟の入場条件: 捕獲数 6体以上（現在 ${catches}体）`;
      if (battles < 18) return `洞窟の入場条件: バトル数 18回以上（現在 ${battles}回）`;
    }

    if (targetMapKey === "MISTY_SWAMP") {
      if (!sf.forestScoutBeaten && !sf.forestCrystalFound) {
        return "湿地へ進む前に、森のレンジャー試験を突破しよう。";
      }
    }

    if (targetMapKey === "CORAL_REEF") {
      if (!sf.swampRangerBeaten) return "珊瑚の浜へ進む前に、湿地のレンジャーに認められよう。";
    }

    if (targetMapKey === "SAND_VALLEY") {
      if (!sf.volcanoEvilBossBeaten) return "砂塵の谷へは、マグマ峠のボスを倒す必要がある。";
      if (avgLevel < 15) return `砂塵の谷の通行条件: パーティ平均Lv15以上（現在 Lv${avgLevel}）`;
    }

    if (targetMapKey === "SHADOW_GROVE") {
      if (!sf.darkTowerVoidBeaten) return "影の森へは、ダークタワー幹部を倒す必要がある。";
    }

    if (targetMapKey === "ANCIENT_LIBRARY") {
      if (!sf.frozenPeakGymCleared) return "古代図書館へは、氷峰ジムをクリアする必要がある。";
      if (avgLevel < 24) return `古代図書館の通行条件: パーティ平均Lv24以上（現在 Lv${avgLevel}）`;
    }

    if (targetMapKey === "STARFALL_BASIN") {
      if (!sf.ruinsFinalDone) return "星降り盆地へは、メインストーリークリア後に入れる。";
      if (!sf.legendaryDefeated) return "星降り盆地へは、天空の花園の伝説を倒す必要がある。";
    }

    if (targetMapKey === "VOLCANIC_PASS") {
      if (!sf.caveEvilBeaten || !sf.caveRivalBeaten3) return "マグマ峠へは、洞窟での因縁バトルを決着させる必要がある。";
      if (!sf.caveScholarBeaten) return "マグマ峠へ進む前に、洞窟の戦術演習を終えよう。";
      if (gameState.arenaHighScore < 1) return "マグマ峠の通行条件: 闘技場3連戦を1回クリアしよう。";
      if (avgLevel < 18) return `マグマ峠の通行条件: パーティ平均Lv18以上（現在 Lv${avgLevel}）`;
    }

    if (targetMapKey === "FROZEN_PEAK") {
      if (!sf.volcanoEvilBossBeaten) return "氷峰へは、先にマグマ峠のボスを倒して道を開こう。";
      if (!sf.volcanicScoutBeaten) return "氷峰へ進む前に、マグマ峠の斥候試験を突破しよう。";
      if (catches < 14) return `氷峰の入場条件: 捕獲数 14体以上（現在 ${catches}体）`;
      if (battles < 45) return `氷峰の入場条件: バトル数 45回以上（現在 ${battles}回）`;
    }

    if (targetMapKey === "SKY_RUINS") {
      if (!sf.darkTowerVoidBeaten) return "遺跡へ進む前に、ダークタワー最深部の幹部を倒そう。";
      if (!sf.frozenPeakGymCleared || !sf.frozenPeakRivalBeaten) return "遺跡への道は、氷峰ジムとライバル戦の突破後に開かれる。";
      if (!sf.frozenSageBeaten) return "遺跡へ進む前に、氷峰の賢者試験を突破しよう。";
      if (!sf.libraryScholarBeaten) return "遺跡へ進む前に、古代図書館の学者を倒そう。";
      if (avgLevel < 30) return `遺跡の入場条件: パーティ平均Lv30以上（現在 Lv${avgLevel}）`;
    }

    return "";
  }

  _getRuinsFinalGateMessage() {
    const sf = gameState.storyFlags || {};
    const avgLevel = this._getPartyAverageLevel();
    const catches = gameState.caughtIds?.length || 0;
    const battles = gameState.totalBattles || 0;

    if (!sf.ruinsGuardianBeaten) return "最終決戦の前に、遺跡の守人との試練を終える必要がある。";
    if (catches < 20) return `最終決戦の挑戦条件: 捕獲数 20体以上（現在 ${catches}体）`;
    if (battles < 70) return `最終決戦の挑戦条件: バトル数 70回以上（現在 ${battles}回）`;
    if (avgLevel < 34) return `最終決戦の挑戦条件: パーティ平均Lv34以上（現在 Lv${avgLevel}）`;

    return "";
  }

  _buildActiveIceBlocks() {
    const source = FIRE_ICE_BLOCKS[this.mapKey] || [];
    return source.map((block) => ({ ...block }));
  }

  _buildHiddenItems() {
    const source = FIELD_HIDDEN_ITEMS[this.mapKey] || [];
    return source.filter((entry) => {
      if (!entry.flagKey) return true;
      return !gameState.storyFlags?.[entry.flagKey];
    }).map((entry) => ({ ...entry, collected: false }));
  }

  _isIceBlockAt(tileX, tileY) {
    return this.activeIceBlocks.find((block) => block.x === tileX && block.y === tileY) || null;
  }

  _removeIceBlock(blockId) {
    this.activeIceBlocks = this.activeIceBlocks.filter((block) => block.id !== blockId);
    this._renderFieldActionMarkers();
  }

  _isSwimmableWater(tileX, tileY) {
    const list = SWIMMABLE_WATER_TILES[this.mapKey] || [];
    return list.some((tile) => tile.x === tileX && tile.y === tileY);
  }

  _clearFieldMarkers() {
    if (!this.fieldMarkers) return;
    this.fieldMarkers.forEach((marker) => marker?.destroy());
    this.fieldMarkers = [];
  }

  _renderFieldActionMarkers() {
    this._clearFieldMarkers();

    this.activeIceBlocks.forEach((block) => {
      const marker = this.add.text(
        block.x * TILE_SIZE + TILE_SIZE / 2,
        block.y * TILE_SIZE + TILE_SIZE / 2,
        "🧊",
        { fontSize: 18 },
      ).setOrigin(0.5).setDepth(3);
      this.fieldMarkers.push(marker);
    });

    this.hiddenItems.forEach((entry) => {
      if (entry.collected) return;
      if (entry.requiredType === "ELECTRIC" && !this._hasPartyType("ELECTRIC")) return;
      const marker = this.add.text(
        entry.x * TILE_SIZE + TILE_SIZE / 2,
        entry.y * TILE_SIZE + TILE_SIZE / 2,
        entry.markerEmoji || "✨",
        { fontSize: 14 },
      ).setOrigin(0.5).setDepth(3);
      this.tweens.add({
        targets: marker,
        alpha: 0.35,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      this.fieldMarkers.push(marker);
    });

    const facilityMarkers = MAP_FACILITY_MARKERS[this.mapKey] || [];
    facilityMarkers.forEach((facility) => {
      const wx = facility.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = facility.y * TILE_SIZE + TILE_SIZE / 2;

      const badge = this.add.rectangle(wx, wy + 10, 30, 12, 0x0f172a, 0.72)
        .setStrokeStyle(1, 0x93c5fd, 0.55)
        .setDepth(3);
      const icon = this.add.text(wx, wy - 3, facility.emoji, { fontSize: 16 })
        .setOrigin(0.5)
        .setDepth(4);
      const label = this.add.text(wx, wy + 10, facility.label, {
        fontFamily: FONT.UI,
        fontSize: 8,
        color: "#dbeafe",
      }).setOrigin(0.5).setDepth(4);

      this.tweens.add({
        targets: icon,
        y: icon.y - 2,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      this.fieldMarkers.push(badge, icon, label);
    });
  }

  _addInventoryItem(itemId, quantity) {
    if (!itemId || quantity <= 0) return;
    const existing = gameState.inventory.find((entry) => entry.itemId === itemId);
    if (existing) existing.quantity += quantity;
    else gameState.inventory.push({ itemId, quantity });
  }

  _collectHiddenItemIfExists(tileX, tileY) {
    const found = this.hiddenItems.find((entry) => !entry.collected && entry.x === tileX && entry.y === tileY);
    if (!found) return false;
    if (found.requiredType && !this._hasPartyType(found.requiredType)) return false;

    found.collected = true;
    this._addInventoryItem(found.itemId, found.quantity || 1);
    if (found.flagKey) {
      gameState.storyFlags[found.flagKey] = true;
    }
    audioManager.playBuy();
    this.showMessage(found.message || "アイテムを見つけた！", 2600);
    this._renderFieldActionMarkers();
    return true;
  }

  /** 毒沼ダメージ：パーティ全員に少量ダメージ */
  _applyPoisonSwampDamage() {
    if (!gameState.party || gameState.party.length === 0) return;
    let totalDmg = 0;
    gameState.party.forEach((mon) => {
      if (mon.currentHp > 0) {
        const dmg = Math.min(mon.currentHp, POISON_SWAMP_DAMAGE);
        mon.currentHp -= dmg;
        totalDmg += dmg;
      }
    });
    if (totalDmg > 0) {
      // 5歩に1回だけメッセージ表示
      this._poisonStepCount = (this._poisonStepCount || 0) + 1;
      if (this._poisonStepCount % 5 === 1) {
        this.showMessage("☠️ 毒沼でパーティにダメージ！", 1200);
      }
      // 全滅チェック
      const allDown = gameState.party.every((mon) => mon.currentHp <= 0);
      if (allDown) {
        this.showMessage("パーティが全滅した… 最後の回復所に戻ろう…", 2400);
        this.time.delayedCall(2500, () => {
          gameState.party.forEach((mon) => {
            const stats = calcStats(mon.species, mon.level);
            mon.currentHp = stats.maxHp;
          });
          const respawn = gameState.getLastHealPoint();
          gameState.setPlayerPosition(respawn.x, respawn.y);
          gameState.currentMap = respawn.mapKey;
          gameState.save();
          this.scene.restart({ mapKey: respawn.mapKey, startX: respawn.x, startY: respawn.y });
        });
      }
    }
  }

  /** テレポートパッド：ペアのパッドへワープ */
  _handleTeleportPad(x, y) {
    const pads = TELEPORT_PADS[this.mapKey];
    if (!pads) {
      this.handleRandomEncounter(x, y);
      return;
    }
    const pad = pads.find((p) => (p.x1 === x && p.y1 === y) || (p.x2 === x && p.y2 === y));
    if (!pad) {
      this.handleRandomEncounter(x, y);
      return;
    }
    const destX = pad.x1 === x && pad.y1 === y ? pad.x2 : pad.x1;
    const destY = pad.x1 === x && pad.y1 === y ? pad.y2 : pad.y1;

    audioManager.playHeal();
    this.cameras.main.flash(300, 100, 50, 200);
    this.time.delayedCall(200, () => {
      gameState.setPlayerPosition(destX, destY);
      this.player.x = destX * TILE_SIZE + TILE_SIZE / 2;
      this.player.y = destY * TILE_SIZE + TILE_SIZE / 2;
      this._updateMinimapDot();
      this.showMessage("⚡ テレポート！", 1000);
    });
  }

  /** 氷床スライド：壁か非氷タイルにぶつかるまで滑る */
  _handleIceFloorSlide(dx, dy) {
    if (dx === 0 && dy === 0) return;
    const curX = gameState.playerPosition.x;
    const curY = gameState.playerPosition.y;
    const nextX = curX + dx;
    const nextY = curY + dy;

    // 次のタイルが壁か範囲外なら停止
    if (this.isBlocked(nextX, nextY) || this.mapLayout[nextY]?.[nextX] !== T.ICE_FLOOR) {
      this.handleRandomEncounter(curX, curY);
      return;
    }

    // 滑り続ける
    this.isMoving = true;
    this.tweens.add({
      targets: this.player,
      x: nextX * TILE_SIZE + TILE_SIZE / 2,
      y: nextY * TILE_SIZE + TILE_SIZE / 2,
      duration: 100,
      ease: "linear",
      onComplete: () => {
        this.isMoving = false;
        gameState.setPlayerPosition(nextX, nextY);
        this._updateMinimapDot();
        this._collectHiddenItemIfExists(nextX, nextY);
        // 再帰的にスライド継続
        if (this.mapLayout[nextY]?.[nextX] === T.ICE_FLOOR) {
          this._handleIceFloorSlide(dx, dy);
        } else {
          this.handleRandomEncounter(nextX, nextY);
        }
      },
    });
  }

  /** 暗闇オーバーレイ表示 */
  _showDarkOverlay() {
    if (this._darkOverlayShown) return;
    this._darkOverlayShown = true;
    // でんきタイプがいれば暗闇を照らす
    if (this._hasPartyType("ELECTRIC")) {
      if (!this._shownFieldHints.has("dark_lit")) {
        this._shownFieldHints.add("dark_lit");
        this.showMessage("⚡ でんきタイプが闇を照らしている！", 1800);
      }
      return;
    }
    // 暗闇エフェクト（視界制限）
    if (!this._darkOverlay) {
      const { width, height } = this.scale;
      this._darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
        .setScrollFactor(0)
        .setDepth(900);
    }
    this.showMessage("👁️ 暗闇だ… でんきタイプがいれば照らせるかも", 2200);
  }

  /** 暗闇オーバーレイ解除 */
  _clearDarkOverlay() {
    if (this._darkOverlay) {
      this._darkOverlay.destroy();
      this._darkOverlay = null;
    }
    this._darkOverlayShown = false;
  }

  /** 砂地エンカウント（通常より低確率＋メッセージ） */
  _handleSandEncounter(_tileX, _tileY) {
    this.stepsSinceLastEncounter = (this.stepsSinceLastEncounter || 0) + 1;
    const baseChance = 0.08; // 砂地は低確率
    const pityBonus = Math.min(0.15, this.stepsSinceLastEncounter * 0.008);
    const chance = Math.min(0.5, baseChance + pityBonus);
    if (Math.random() < chance) {
      this.encounterCooldown = 1500;
      this.stepsSinceLastEncounter = 0;
      this.startBattle(true);
    }
  }

  createTilemap() {
    const { width, height } = this.scale;
    const worldWidth = this.mapWidth * TILE_SIZE;
    const worldHeight = this.mapHeight * TILE_SIZE;

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617).setScrollFactor(0);

    this.groundLayer = this.add.layer();
    this.grassSprites = [];
    this.waterSprites = [];

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.mapLayout[y][x];
        const wx = x * TILE_SIZE + TILE_SIZE / 2;
        const wy = y * TILE_SIZE + TILE_SIZE / 2;

        const textureKey = this.getTileTextureKey(tile, x, y);

        const sprite = this.add.sprite(wx, wy, textureKey).setOrigin(0.5);
        this.groundLayer.add(sprite);

        if (tile === T.WALL || tile === T.FOREST) {
          const shadow = this.add.rectangle(wx, wy + TILE_SIZE / 2, TILE_SIZE - 2, 6, 0x000000, 0.16)
            .setOrigin(0.5, 1);
          this.groundLayer.add(shadow);
        }

        // 草むらの微アニメーション
        if (tile === T.GRASS) {
          this.grassSprites.push(sprite);
        }
        if (tile === T.WATER) {
          this.waterSprites.push(sprite);
        }
      }
    }

    this.renderBuildingDecorations();

    // 草揺れアニメーション
    this.grassSprites.forEach((s, i) => {
      this.tweens.add({
        targets: s,
        y: s.y + 1,
        duration: 1200 + (i % 5) * 200,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: (i % 7) * 100,
      });
    });

    this.waterSprites.forEach((s, i) => {
      this.tweens.add({
        targets: s,
        alpha: 0.78,
        duration: 900 + (i % 4) * 180,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: (i % 9) * 90,
      });
    });

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor(0x020617);
  }

  renderBuildingDecorations() {
    const buildings = MAP_BUILDING_DECOR[this.mapKey] || [];
    if (!buildings.length) return;

    buildings.forEach((building) => {
      const baseX = building.x * TILE_SIZE;
      const baseY = building.y * TILE_SIZE;
      const width = building.w * TILE_SIZE;
      const height = building.h * TILE_SIZE;

      const body = this.add.rectangle(
        baseX + width / 2,
        baseY + height / 2,
        width,
        height,
        building.wallColor || 0x9ca3af,
        0.24,
      ).setStrokeStyle(2, 0xe2e8f0, 0.26);
      this.groundLayer.add(body);

      const roofHeight = Math.max(14, Math.floor(height * 0.5));
      const roofBaseY = baseY + Math.max(3, Math.floor(TILE_SIZE * 0.15));
      const roofOverhang = 3;
      const roof = this.add.polygon(
        0,
        0,
        [
          baseX - roofOverhang,
          roofBaseY,
          baseX + width + roofOverhang,
          roofBaseY,
          baseX + width / 2,
          roofBaseY - roofHeight,
        ],
        building.roofColor || 0xb91c1c,
        0.88,
      ).setOrigin(0, 0);
      this.groundLayer.add(roof);

      if (building.emoji || building.label) {
        const labelText = `${building.emoji || ""} ${building.label || ""}`.trim();
        const label = this.add.text(baseX + width / 2, roofBaseY - roofHeight - 4, labelText, {
          fontFamily: FONT.UI,
          fontSize: 10,
          color: "#f8fafc",
          stroke: "#0f172a",
          strokeThickness: 3,
        }).setOrigin(0.5);
        this.groundLayer.add(label);
      }
    });
  }

  getTileTextureKey(tile, x, y) {
    let baseKey;
    switch (tile) {
      case T.WALL: baseKey = "tile-wall"; break;
      case T.GRASS: baseKey = "tile-grass"; break;
      case T.DOOR: baseKey = "tile-door"; break;
      case T.FOREST: baseKey = "tile-forest"; break;
      case T.WATER: baseKey = "tile-water"; break;
      case T.GYM: baseKey = "tile-gym"; break;
      case T.PATH: baseKey = "tile-path"; break;
      case T.POISON: baseKey = "tile-grass"; break;  // 毒沼（草系テクスチャ・紫がかっている）
      case T.TELEPORT: baseKey = "tile-door"; break;  // テレポートパッド
      case T.ICE_FLOOR: baseKey = "tile-water"; break; // 氷床
      case T.DARK: baseKey = "tile-path"; break;       // 暗闇通路
      case T.SAND: baseKey = "tile-ground"; break;     // 砂地
      default:
        baseKey = this._isInteriorMap() ? "tile-floor" : "tile-ground";
    }

    const variants = {
      "tile-ground": 4,
      "tile-grass": 4,
      "tile-wall": 3,
      "tile-floor": 2,
      "tile-door": 2,
      "tile-forest": 4,
      "tile-water": 4,
      "tile-gym": 2,
      "tile-path": 4,
    };

    const count = variants[baseKey] || 1;
    if (count <= 1) return baseKey;

    const hash = ((x * 73856093) ^ (y * 19349663) ^ (tile * 83492791)) >>> 0;
    const variant = hash % count;
    return variant === 0 ? baseKey : `${baseKey}-${variant}`;
  }

  _isInteriorMap() {
    const interiorMaps = new Set([
      "HOUSE1",
      "LAB",
      "TOWN_SHOP",
      "FOREST_GYM",
      "VOLCANO_SHOP",
      "FROZEN_GYM",
      "FROZEN_SHOP",
      "GARDEN_SHOP",
      "SWAMP_SHOP",
      "SAND_VALLEY_SHOP",
      "BASIN_SHOP",
    ]);
    return interiorMaps.has(this.mapKey);
  }

  createFieldAtmosphere() {
    const { width, height } = this.scale;
    const worldWidth = this.mapWidth * TILE_SIZE;
    const worldHeight = this.mapHeight * TILE_SIZE;

    const ambientLayer = this.add.layer();
    for (let i = 0; i < 8; i++) {
      const orb = this.add.circle(
        (worldWidth / 8) * i + 40,
        40 + (i % 3) * 36,
        34 + (i % 3) * 9,
        i % 2 === 0 ? 0x60a5fa : 0xa78bfa,
        0.045,
      );
      ambientLayer.add(orb);
      this.tweens.add({
        targets: orb,
        alpha: 0.085,
        y: orb.y + 18,
        duration: 2800 + (i % 4) * 420,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    for (let i = 0; i < 26; i++) {
      const mote = this.add.circle(
        Math.random() * worldWidth,
        Math.random() * worldHeight,
        1 + Math.random() * 1.8,
        i % 3 === 0 ? 0xc4b5fd : 0xbfdbfe,
        0.05 + Math.random() * 0.09,
      ).setBlendMode(Phaser.BlendModes.ADD);
      ambientLayer.add(mote);
      this.tweens.add({
        targets: mote,
        y: mote.y - (8 + Math.random() * 18),
        x: mote.x + (Math.random() - 0.5) * 14,
        alpha: 0.02,
        duration: 2400 + Math.random() * 2200,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    this.timeTintOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xf8fafc, 0)
      .setScrollFactor(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.weatherTintOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x94a3b8, 0)
      .setScrollFactor(0)
      .setDepth(5);

    const vignette = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    vignette.fillStyle(0x0b1120, 0.12);
    vignette.fillRect(0, 0, width, 28);
    vignette.fillRect(0, height - 34, width, 34);
    vignette.fillRect(0, 0, 18, height);
    vignette.fillRect(width - 18, 0, 18, height);

  }

  createPlayer() {
    const startX = gameState.playerPosition.x * TILE_SIZE + TILE_SIZE / 2;
    const startY = gameState.playerPosition.y * TILE_SIZE + TILE_SIZE / 2;
    this.player = this.physics.add
      .sprite(startX, startY, "player")
      .setSize(18, 18)
      .setOffset(7, 7);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // プレイヤーの呼吸アニメ
    this.tweens.add({
      targets: this.player,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  createNpcSprites() {
    this._clearStarterLabels();

    this.npcs = getMapNpcs(this.mapKey);
    if (this.npcSprites) {
      this.npcSprites.forEach((s) => s.destroy());
    }
    this.npcSprites = [];
    this.npcs.forEach((npc) => {
      const isStarterPedestal = this.mapKey === "LAB"
        && !gameState.storyFlags.prologueDone
        && typeof npc.story === "string"
        && npc.story.startsWith("starter_");
      if (isStarterPedestal) {
        return;
      }

      const wx = npc.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = npc.y * TILE_SIZE + TILE_SIZE / 2;
      const texture = npc.texture || "npc";
      const sprite = this.add.sprite(wx, wy, texture).setOrigin(0.5);
      // NPC の呼吸
      this.tweens.add({
        targets: sprite,
        scaleY: 1.06,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      this.npcSprites.push(sprite);

      if (npc.heal) {
        const healBadge = this.add.text(wx, wy - 20, "💖", {
          fontSize: 16,
        }).setOrigin(0.5);
        this.tweens.add({
          targets: healBadge,
          y: healBadge.y - 4,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
        this.npcSprites.push(healBadge);
      }
    });

    // 研究所マップのスターター絵文字表示（LABのみ）
    if (this.mapKey === "LAB" && !gameState.storyFlags.prologueDone) {
      this._renderStarterLabels();
    }
  }

  _clearStarterLabels() {
    if (!this.starterLabelSprites) return;
    this.starterLabelSprites.forEach((sprite) => sprite?.destroy());
    this.starterLabelSprites = [];
  }

  _playHealNpcEffect(npc) {
    const playerX = gameState.playerPosition.x * TILE_SIZE + TILE_SIZE / 2;
    const playerY = gameState.playerPosition.y * TILE_SIZE + TILE_SIZE / 2;
    const npcX = npc.x * TILE_SIZE + TILE_SIZE / 2;
    const npcY = npc.y * TILE_SIZE + TILE_SIZE / 2;

    this.cameras.main.flash(220, 170, 255, 210, false);

    createParticleBurst(this, npcX, npcY - 8, {
      textureKey: "particle-star",
      count: 10,
      speed: 110,
      lifespan: 700,
      scale: { start: 1.3, end: 0 },
      tint: [0x86efac, 0xfde68a],
      gravityY: -30,
    });
    createParticleBurst(this, playerX, playerY, {
      textureKey: "particle-white",
      count: 16,
      speed: 170,
      lifespan: 620,
      scale: { start: 1.3, end: 0 },
      tint: [0xbbf7d0, 0xffffff],
      gravityY: 10,
    });

    const ring = this.add.circle(playerX, playerY, 8, 0x86efac, 0.32)
      .setStrokeStyle(2, 0xa7f3d0, 0.85);
    this.tweens.add({
      targets: ring,
      radius: 44,
      alpha: 0,
      duration: 520,
      ease: "quad.out",
      onComplete: () => ring.destroy(),
    });

    const healText = this.add.text(playerX, playerY - 30, "💚 ぜんかいふく！", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#dcfce7",
      stroke: "#14532d",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: healText,
      y: healText.y - 12,
      alpha: 0,
      duration: 900,
      ease: "sine.out",
      onComplete: () => healText.destroy(),
    });
  }

  /** 研究所のスターター台座に絵文字ラベルを表示 */
  _renderStarterLabels() {
    this._clearStarterLabels();
    this.starterLabelSprites = [];

    const starterInfo = [
      { x: 3, y: 5, emoji: "🧸" },
      { x: 7, y: 5, emoji: "🐟" },
      { x: 11, y: 5, emoji: "🌿" },
    ];
    starterInfo.forEach((s) => {
      const wx = s.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = s.y * TILE_SIZE + TILE_SIZE / 2;
      const emoji = createMonsterEmojiDisplay(this, wx, wy - 18, s.emoji, {
        fontSize: 22,
      }).setScrollFactor(1);
      this.starterLabelSprites.push(emoji);
    });
  }

  createUi() {
    // 既存のUI要素を破棄
    if (this.uiContainer) this.uiContainer.destroy(true);
    this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(30);

    const { width, height } = this.scale;
    const safeMargin = UI_LAYOUT.SAFE_MARGIN;
    const panelGap = UI_LAYOUT.PANEL_GAP;
    const messagePanelH = UI_LAYOUT.MESSAGE_PANEL_HEIGHT;
    const messagePanelX = safeMargin;
    const messagePanelW = width - safeMargin * 2;
    const messagePanelY = height - safeMargin - messagePanelH;

    // ── 一時メッセージ（通常時は非表示） ──
    const bottomBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(messagePanelX, messagePanelY, messagePanelW, messagePanelH, 12, COLORS.PANEL_BG, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.PANEL_BORDER, 0.85)
      : this.add.graphics();
    if (bottomBg instanceof Phaser.GameObjects.Graphics) {
      drawPanel(bottomBg, messagePanelX, messagePanelY, messagePanelW, messagePanelH, {
        radius: 12,
        headerHeight: 20,
        bgAlpha: 0.95,
        glow: true,
      });
    }
    bottomBg.setVisible(false);
    this.uiContainer.add(bottomBg);
    this.messageBg = bottomBg;

    this.infoText = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: messagePanelX + 14,
        y: messagePanelY + 12,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: UI_FONT_SIZE.BODY,
          color: "#f1f5f9",
          wordWrap: { width: messagePanelW - 28 },
          lineSpacing: 2,
        }).setOrigin(0, 0),
        align: "left",
      }).layout()
      : this.add.text(messagePanelX + 14, messagePanelY + 12, "", {
        fontFamily: FONT.UI,
        fontSize: UI_FONT_SIZE.BODY,
        color: "#f1f5f9",
        wordWrap: { width: messagePanelW - 28 },
        lineSpacing: 2,
      });
    this.infoText.setVisible(false);
    this.uiContainer.add(this.infoText);

    const namePanelW = 176;
    const namePanelH = 36;
    const namePanelX = safeMargin;
    const namePanelY = messagePanelY - panelGap - namePanelH;

    const nameBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(namePanelX, namePanelY, namePanelW, namePanelH, 10, COLORS.PANEL_BG, 0.96)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.BLUE_LIGHT, 0.85)
      : this.add.graphics();
    if (nameBg instanceof Phaser.GameObjects.Graphics) {
      drawPanel(nameBg, namePanelX, namePanelY, namePanelW, namePanelH, {
        radius: 10,
        headerHeight: 0,
        bgAlpha: 0.96,
        glow: true,
        borderColor: COLORS.BLUE_LIGHT,
      });
    }
    nameBg.setVisible(false);
    this.uiContainer.add(nameBg);
    this.speakerNameBg = nameBg;

    this.speakerNameText = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: namePanelX + namePanelW / 2,
        y: namePanelY + namePanelH / 2,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: UI_FONT_SIZE.BODY_SM,
          color: TEXT_COLORS.INFO,
          fontStyle: "700",
          align: "center",
        }).setOrigin(0.5),
        align: "center",
      }).layout()
      : this.add.text(namePanelX + namePanelW / 2, namePanelY + namePanelH / 2, "", {
        fontFamily: FONT.UI,
        fontSize: UI_FONT_SIZE.BODY_SM,
        color: TEXT_COLORS.INFO,
        fontStyle: "700",
        align: "center",
      }).setOrigin(0.5);
    this.speakerNameText.setVisible(false);
    this.uiContainer.add(this.speakerNameText);

    const weatherPanelWidth = UI_LAYOUT.WEATHER_PANEL_WIDTH;
    const weatherPanelHeight = UI_LAYOUT.WEATHER_PANEL_HEIGHT;
    const weatherPanelX = width - weatherPanelWidth - safeMargin;
    const weatherPanelY = safeMargin;

    this.timeWeatherPanel = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(weatherPanelX, weatherPanelY, weatherPanelWidth, weatherPanelHeight, 10, COLORS.PANEL_BG, 0.92)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.BLUE_LIGHT, 0.85)
      : this.add.graphics();
    if (this.timeWeatherPanel instanceof Phaser.GameObjects.Graphics) {
      drawPanel(this.timeWeatherPanel, weatherPanelX, weatherPanelY, weatherPanelWidth, weatherPanelHeight, {
        radius: 10,
        headerHeight: 0,
        bgAlpha: 0.92,
        glow: true,
        borderColor: COLORS.BLUE_LIGHT,
      });
    }
    this.uiContainer.add(this.timeWeatherPanel);

    this.timeWeatherText = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: weatherPanelX + 12,
        y: weatherPanelY + 11,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: UI_FONT_SIZE.CAPTION,
          color: "#e2e8f0",
          fontStyle: "700",
        }).setOrigin(0, 0),
        align: "left",
      }).layout()
      : this.add.text(weatherPanelX + 12, weatherPanelY + 11, "", {
        fontFamily: FONT.UI,
        fontSize: UI_FONT_SIZE.CAPTION,
        color: "#e2e8f0",
        fontStyle: "700",
      });
    this.uiContainer.add(this.timeWeatherText);

    this.updateDefaultInfoMessage();
    this._refreshFieldTimeWeatherEffects(true);
  }

  updateDefaultInfoMessage() {
    this.defaultInfoMessage = "";
    if (this.infoText) {
      this.infoText.setText("");
      this.infoText.setVisible(false);
    }
    if (this.speakerNameText) {
      this.speakerNameText.setText("");
      this.speakerNameText.setVisible(false);
    }
    if (this.speakerNameBg) this.speakerNameBg.setVisible(false);
    if (this.messageBg) this.messageBg.setVisible(false);
  }

  setInfoText(text, speaker = "") {
    if (!this.infoText) return;
    const hasText = Boolean(text && String(text).trim().length > 0);
    const speakerLabel = String(speaker || "").trim();
    const hasSpeaker = hasText && speakerLabel.length > 0;

    this.infoText.setText(hasText ? text : "");
    this.infoText.setVisible(hasText);
    if (this.speakerNameText) {
      this.speakerNameText.setText(hasSpeaker ? speakerLabel : "");
      this.speakerNameText.setVisible(hasSpeaker);
    }
    if (this.speakerNameBg) this.speakerNameBg.setVisible(hasSpeaker);
    if (this.messageBg) this.messageBg.setVisible(hasText);

    if (hasText) {
      this.infoText.alpha = 0;
      this.tweens.add({
        targets: this.infoText,
        alpha: 1,
        duration: 180,
        ease: "sine.out",
      });
      if (hasSpeaker && this.speakerNameText) {
        this.speakerNameText.alpha = 0;
        this.tweens.add({
          targets: this.speakerNameText,
          alpha: 1,
          duration: 160,
          ease: "sine.out",
        });
      }
    }
  }

  _splitDialogLine(line) {
    const source = String(line || "").trim();
    const match = source.match(/^([^:：\n]{1,16})\s*[：:]\s*(.+)$/u);
    if (!match) return { speaker: "", text: source };
    const speaker = match[1].trim();
    const body = match[2].trim();
    if (!speaker || !body) return { speaker: "", text: source };
    return { speaker, text: body };
  }

  showMessage(text, duration = 3000) {
    this.setInfoText(text);
    if (this.messageTimer) this.messageTimer.remove();
    this.messageTimer = this.time.delayedCall(duration, () => {
      this.updateDefaultInfoMessage();
    });
  }

  /** ミニマップを描画 */
  _renderMinimap() {
    renderMinimap(this);
  }

  /** ミニマップのプレイヤー位置を更新 */
  _updateMinimapDot() {
    updateMinimapDot(this);
  }

  update(time, delta) {
    // プレイ時間カウント
    gameState.playTimeMs += delta;
    this.fieldMinuteTickMs += delta;
    if (this.fieldMinuteTickMs >= 1200) {
      const passedMinutes = Math.floor(this.fieldMinuteTickMs / 1200);
      this.fieldMinuteTickMs -= passedMinutes * 1200;
      const advanced = gameState.advanceFieldTime(passedMinutes);
      if (advanced.hourChanged) {
        const weather = rollWeatherForMapByHour(this.mapKey, advanced.currentHour);
        gameState.setMapWeather(this.mapKey, weather);
      }
      this._refreshFieldTimeWeatherEffects(advanced.hourChanged);
    }

    // タッチ操作のconfirm/cancel
    if (this.touchControls && this.touchControls.visible) {
      const touchConfirm = this.touchControls.justPressedConfirm();
      const touchCancel = this.touchControls.justPressedCancel();

      if (this._dialogActive) {
        if (touchConfirm) this._showNextDialog();
      } else if (this._starterChoiceActive) {
        this._handleStarterChoiceTouchInput(delta, touchConfirm, touchCancel);
      } else {
        if (touchConfirm) {
          if (canInteractInWorld(this)) {
            this.checkNpcInteraction();
          }
        }
        if (touchCancel) {
          if (canOpenWorldMenu(this)) {
            this.openMenu();
          } else if (this.shopActive) {
            this.closeShopMenu();
          }
        }
      }
    }

    if (this.isEncounterTransitioning) {
      if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
      return;
    }

    if (this.shopActive) {
      this.handleShopInput();
      return;
    }

    if (this._dialogActive) {
      if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
      return;
    }

    if (this._starterChoiceActive) {
      this._handleStarterChoiceInput();
      if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
      return;
    }

    if (this._trainerBattlePending) {
      if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
      return;
    }

    if (this.moveInputCooldown > 0) {
      this.moveInputCooldown -= delta;
    }

    if (this.isMoving) {
      if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
      return;
    }

    if (this.moveInputCooldown <= 0) {
      const moveDir = this.getMoveDirection();
      if (moveDir) {
        this.tryMove(moveDir.dx, moveDir.dy);
        this.moveInputCooldown = this.moveRepeatDelay;
      }
    }

    if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
  }

  getMoveDirection() {
    if (this.cursors.left.isDown || this.keys.A.isDown) return { dx: -1, dy: 0 };
    if (this.cursors.right.isDown || this.keys.D.isDown) return { dx: 1, dy: 0 };
    if (this.cursors.up.isDown || this.keys.W.isDown) return { dx: 0, dy: -1 };
    if (this.cursors.down.isDown || this.keys.S.isDown) return { dx: 0, dy: 1 };
    // タッチコントロール
    if (this.touchControls && this.touchControls.visible) {
      return this.touchControls.getDirection();
    }
    return null;
  }

  isBlocked(tileX, tileY) {
    if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) return true;
    const t = this.mapLayout[tileY][tileX];
    if (t === T.WALL) return true;
    if (t === T.WATER) {
      const canSwim = this._isSwimmableWater(tileX, tileY) && this._hasPartyType("WATER");
      if (!canSwim) return true;
    }
    if (this._isIceBlockAt(tileX, tileY)) return true;

    const npcHere = (this.npcs || []).some((npc) => npc.x === tileX && npc.y === tileY);
    return npcHere;
  }

  checkNpcInteraction() {
    if (this._trainerBattlePending) return false;

    const px = gameState.playerPosition.x;
    const py = gameState.playerPosition.y;

    for (const npc of this.npcs) {
      const dx = Math.abs(npc.x - px);
      const dy = Math.abs(npc.y - py);
      if (dx + dy !== 1) continue;

      audioManager.playConfirm();

      // ショップ
      if (npc.shop) {
        this.openShopMenu();
        return true;
      }

      // 回復NPC
      if (npc.heal) {
        const restoreParty = () => {
          gameState.party.forEach((m) => {
            if (m.species) {
              // calcStats を使用して正しい最大HPを算出
              const stats = calcStats(m.species, m.level);
              m.currentHp = stats.maxHp;
              // スタミナ全回復
              syncMonsterMoves(m);
              m.stamina = getMonsterMaxStamina();
              // 状態異常回復
              m.statusCondition = "NONE";
            }
          });
          gameState.setLastHealPoint(this.mapKey, gameState.playerPosition.x, gameState.playerPosition.y);
          audioManager.playHeal();
          this._playHealNpcEffect(npc);
          this.showMessage("パーティが全回復した！", 2600);
          this.autoSave();
        };

        const nurseLine = npc.text || "おかえり！ 今日はぐっすり休んでいこうね。";
        this.showDialogSequence([
          `かいふく係: ${nurseLine}`,
          "かいふく係: はい、みんな元気いっぱい！ いってらっしゃい！",
        ], () => {
          restoreParty();
        });
        return true;
      }

      // クエストNPC
      if (npc.quest === "STARLITE") {
        if (!gameState.starQuestDone) {
          const hasStar = gameState.party.some((m) => m.species && m.species.id === "STARLITE");
          if (hasStar) {
            gameState.addMoney(100);
            gameState.starQuestDone = true;
            this.showMessage("ありがとう！ 100Gの報酬だよ！");
          } else {
            this.showMessage(npc.text);
          }
        } else {
          this.showMessage("もうお礼は渡したよ。またね！");
        }
        this.createUi();
        return true;
      }

      // 氷峰アイスタイプクエスト
      if (npc.quest === "ICE_TYPE") {
        if (!gameState.storyFlags.frozenPeakIceQuest) {
          const hasIce = gameState.party.some((m) => m.species && (m.species.primaryType === "ICE" || m.species.secondaryType === "ICE"));
          if (hasIce) {
            gameState.storyFlags.frozenPeakIceQuest = true;
            gameState.addItem("HYPER_BALL", 3);
            gameState.addMoney(500);
            gameState.save();
            this.showDialogSequence([
              "すごい！ こおりタイプのモンスターを 連れているのね！",
              "★ ハイパーボール ×3 と 500G をもらった！",
            ]);
          } else {
            this.showMessage(npc.text);
          }
        } else {
          this.showMessage("あのこおりモンスター、大切にしてあげてね！");
        }
        this.createUi();
        return true;
      }

      // 珊瑚のみずタイプ編成クエスト
      if (npc.quest === "WATER_TRIO") {
        if (!gameState.storyFlags.coralWaterQuest) {
          const waterCount = gameState.party.filter((m) => m.species && (m.species.primaryType === "WATER" || m.species.secondaryType === "WATER")).length;
          if (waterCount >= 3) {
            gameState.storyFlags.coralWaterQuest = true;
            gameState.addItem("DUSK_BALL", 2);
            gameState.addMoney(700);
            gameState.save();
            this.showDialogSequence([
              "すごい…みずタイプを3体も連れてきたんだね！",
              "★ ダスクボール ×2 と 700G をもらった！",
            ]);
          } else {
            this.showMessage(`みずタイプを3体連れてきてほしいな（現在 ${waterCount}体）`);
          }
        } else {
          this.showMessage("海の仲間たち、これからも大切にしてあげてね！");
        }
        this.createUi();
        return true;
      }

      if (npc.gymLeader) {
        this.handleGymInteraction();
        return true;
      }

      // 闘技場NPC
      if (npc.arena) {
        this.handleArenaInteraction();
        return true;
      }

      // トレーナー（ライバル・ダーク団）バトル
      if (npc.rivalBattle) {
        // 初対面ストーリーイベントがある場合はそちらを優先
        if (npc.story === "rival_first_meet") {
          this.handleStoryEvent(npc.story, npc);
          return true;
        }
        this.handleTrainerInteraction(npc);
        return true;
      }

      // ストーリーイベント（テキストなしの特殊NPC）
      if (npc.story) {
        this.handleStoryEvent(npc.story, npc);
        return true;
      }

      // 通常会話
      this.showMessage(npc.text);
      return true;
    }

    // ジムタイルのチェック
    const tile = this.mapLayout[py][px];
    if (tile === T.GYM) {
      this.handleGymInteraction();
      return true;
    }

    return false;
  }

  handleGymInteraction() {
    // 現在のマップに応じてジムを判別
    const isGym2 = this.mapKey === "FROZEN_PEAK" || this.mapKey === "FROZEN_GYM";
    const cleared = isGym2 ? gameState.storyFlags.frozenPeakGymCleared : gameState.gymCleared;
    if (cleared) {
      this.showMessage("ジムはすでにクリア済みだ！ おめでとう！");
      return;
    }
    audioManager.playEncounter();
    const leaderName = isGym2 ? "氷峰ジムリーダー ユキハ" : "ジムリーダー";
    this.showMessage(`${leaderName}が挑戦を受けて立った！`);
    this.time.delayedCall(1000, () => {
      const activeMon = gameState.getFirstAlive();
      if (!activeMon) {
        this.showMessage("たたかえるモンスターが いない… まずは かいふくしよう！");
        return;
      }
      const boss = isGym2 ? getGymBoss2Monster() : getGymBossMonster();
      gameState.markSeen(boss.species.id);
      gameState.setBattle({
        player: activeMon,
        opponent: boss,
        isBoss: true,
        gymNumber: isGym2 ? 2 : 1,
      });
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.pause();
        this.scene.launch("BattleScene", { from: "WorldScene" });
      });
    });
  }

  // ═══════════════════════════════════════════
  //  会話シーケンスシステム
  // ═══════════════════════════════════════════

  /**
   * 複数行の会話を順番に表示する。決定キー（Z/Enter/Space）で次へ進む。
   * @param {string[]} lines - 会話行の配列
   * @param {Function} [onComplete] - 全行表示後に呼ばれるコールバック
   */
  showDialogSequence(lines, onComplete) {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    this._dialogQueue = [...lines];
    this._dialogOnComplete = onComplete || null;
    this._dialogActive = true;
    this._showNextDialog();

    if (this._dialogAdvanceListener) {
      this.keys.Z.off("down", this._dialogAdvanceListener);
      this.keys.ENTER.off("down", this._dialogAdvanceListener);
      this.keys.SPACE.off("down", this._dialogAdvanceListener);
      this._dialogAdvanceListener = null;
    }

    // 決定キー（1回分の追加リスナー）
    this._dialogAdvanceListener = () => {
      if (!this._dialogActive) return;
      this._showNextDialog();
    };
    this.keys.Z.on("down", this._dialogAdvanceListener);
    this.keys.ENTER.on("down", this._dialogAdvanceListener);
    this.keys.SPACE.on("down", this._dialogAdvanceListener);
  }

  _showNextDialog() {
    if (!this._dialogQueue || this._dialogQueue.length === 0) {
      this._endDialogSequence();
      return;
    }
    const line = this._dialogQueue.shift();
    const { speaker, text } = this._splitDialogLine(line);
    this.setInfoText(text, speaker);
  }

  _endDialogSequence() {
    this._dialogActive = false;
    if (this._dialogAdvanceListener) {
      this.keys.Z.off("down", this._dialogAdvanceListener);
      this.keys.ENTER.off("down", this._dialogAdvanceListener);
      this.keys.SPACE.off("down", this._dialogAdvanceListener);
      this._dialogAdvanceListener = null;
    }
    this.updateDefaultInfoMessage();
    if (this._dialogOnComplete) {
      const cb = this._dialogOnComplete;
      this._dialogOnComplete = null;
      cb();
    }
  }

  // ═══════════════════════════════════════════
  //  ストーリーイベント
  // ═══════════════════════════════════════════

  handleStoryEvent(eventId, npc) {
    const sf = gameState.storyFlags;

    switch (eventId) {
      case "professor_prologue":
        this._doProfessorPrologue();
        break;
      case "starter_embear":
        if (!sf.prologueDone) this._doStarterSelect("EMBEAR");
        else this.showMessage("エムベア🧸の台座だ。炎タイプのモンスターがいた。");
        break;
      case "starter_finbub":
        if (!sf.prologueDone) this._doStarterSelect("FINBUB");
        else this.showMessage("フィンバブ🐟の台座だ。水タイプのモンスターがいた。");
        break;
      case "starter_thornvine":
        if (!sf.prologueDone) this._doStarterSelect("THORNVINE");
        else this.showMessage("ソーンバイン🌿の台座だ。草タイプのモンスターがいた。");
        break;
      case "ruins_elder":
        this._doRuinsElder();
        break;
      case "frozen_gym_intro":
        this._doFrozenGymIntro();
        break;
      case "garden_legendary":
        this._doGardenLegendary();
        break;
      // ── チュートリアル・ストーリー追加イベント ──
      case "professor_town_hint":
        this._doProfessorTownHint();
        break;
      case "mom_before_lab":
        this._doMomBeforeLab();
        break;
      case "mom_farewell":
        this._doMomFarewell();
        break;
      case "tutorial_assistant_prebattle":
        this._doTutorialAssistantPreBattle();
        break;
      case "tutorial_assistant_catch":
        this._doTutorialAssistantCatch();
        break;
      case "rival_first_meet":
        this._doRivalFirstMeet(npc);
        break;
      case "forest_tablet_1":
        this._doForestTabletLore();
        break;
      case "cave_memory_1":
        this._doCaveMemoryLore();
        break;
      case "volcano_memory_1":
        this._doVolcanoMemoryLore();
        break;
      case "frozen_memory_1":
        this._doFrozenMemoryLore();
        break;
      case "ruins_memory_2":
        this._doRuinsMemoryLore();
        break;
      case "garden_epilogue":
        this._doGardenEpilogueLore();
        break;
      case "swamp_tablet_1":
        this._doSwampTabletLore();
        break;
      case "coral_legend_1":
        this._doCoralLegendLore();
        break;
      case "desert_obelisk_1":
        this._doDesertObeliskLore();
        break;
      case "shadow_memory_1":
        this._doShadowMemoryLore();
        break;
      case "shadow_lab_discovery":
        this._doShadowLabDiscovery();
        break;
      case "library_codex_1":
        this._doLibraryCodexLore();
        break;
      case "library_puzzle_hint":
        this._doLibraryPuzzleHint();
        break;
      case "basin_starfall_lore":
        this._doBasinStarfallLore();
        break;
      case "swamp_remedy_request":
        this._doSwampRemedyQuest();
        break;
      case "coral_archivist_request":
        this._doCoralArchivistQuest();
        break;
      case "library_restoration_request":
        this._doLibraryRestorationQuest();
        break;
      case "star_research_request":
        this._doStarResearchQuest();
        break;
      default:
        if (npc && npc.text) this.showMessage(npc.text);
    }
  }

  /** 博士プロローグ（丁寧版） */
  _doProfessorPrologue() {
    const sf = gameState.storyFlags;
    if (sf.prologueDone) {
      this.showMessage("博士: 旅の調子はどうだい？ クリスタルを集めたら報告してくれ！");
      return;
    }
    if (sf.starterChosen) {
      // スターター選択済みだけどプロローグ未完了の場合
      this.showDialogSequence([
        "博士: おっ、もう相棒は選んだんだね！",
        "博士: それじゃあ いよいよ旅立ちだ！ 気をつけてな！",
      ], () => {
        sf.prologueDone = true;
        gameState.save();
        this.createUi();
      });
      return;
    }
    this.showDialogSequence([
      `博士: やあ、${gameState.playerName}！ よく来てくれた！`,
      "博士: わしは エモじ研究所の ハカセ。エモじの研究を 30年つづけておる。",
      "博士: …実はな、たいへんなことが 起きているんじゃ。",
      "博士: この世界には 5つの『エモじクリスタル』が あるのを知っておるかね？",
      "博士: クリスタルは 伝説のモンスター『エテルナ』の力を封じ、",
      "博士: 世界の均衡を 保つ 大切な宝物じゃ。",
      "博士: しかし…悪の組織『ダーク団』が それらを奪おうとしておる！",
      "博士: もしクリスタルが すべて奪われたら…",
      "博士: エテルナが闇に染まり、世界が 大変なことになってしまう！",
      `博士: そこで ${gameState.playerName}、きみに たのみたいんじゃ。`,
      "博士: クリスタルを守り、ダーク団の野望を打ち砕いてほしい！",
      "博士: …もちろん、ひとりじゃ 危険じゃからな。",
      "博士: まず この研究所にいる モンスターから 相棒を えらんでくれ！",
      "博士: 左から 🧸エムベア（ほのお）、🐟フィンバブ（みず）、🌿ソーンバイン（くさ）じゃ。",
    ]);
  }

  /** 町で博士に話しかけた時のヒント（研究所の外） */
  _doProfessorTownHint() {
    this.showDialogSequence([
      `博士: おお、${gameState.playerName}！ ここにいたか！`,
      "博士: 研究所の中で 大事な話があるんじゃ。",
      "博士: 北の建物に入ってくれ。ドア🚪の前でZキーじゃ。",
      "博士: それと…もしかしたら 相棒を選んでもらうことになるかもしれん。",
      "博士: 楽しみにしていてくれ！",
    ]);
  }

  /** 母親NPC: 研究所に行く前 */
  _doMomBeforeLab() {
    this.showDialogSequence([
      `ママ: ${gameState.playerName}、博士から手紙が届いていたでしょう？`,
      "ママ: 研究所に行ってらっしゃい。きっと素敵な出会いが待っているわ。",
      "ママ: 疲れたら いつでも 家に帰ってきて休んでいいからね。",
      "ママ: おうちのベッドで寝ると HPが全回復するわよ。",
    ]);
  }

  /** 母親NPC: 旅立ちの見送り */
  _doMomFarewell() {
    this.showDialogSequence([
      `ママ: わあ、${gameState.playerName}！ もうモンスターを連れてるの？`,
      "ママ: 博士から聞いたわ。クリスタルを守る旅に出るのね…。",
      "ママ: 心配だけど…きっと きみなら大丈夫！",
      "ママ: これ 旅のお守りよ。ヒールジェルを 追加で持っていきなさい。",
      "★ ママから ヒールジェル×3 をもらった！",
      "ママ: 冒険で疲れたら いつでも帰ってきてね。応援してるわよ！",
    ], () => {
      gameState.storyFlags.momFarewellDone = true;
      gameState.addItem("POTION", 3);
      gameState.save();
      this.createUi();
    });
  }

  /** チュートリアル助手: バトル前の説明 */
  _doTutorialAssistantPreBattle() {
    this.showDialogSequence([
      "アユム: やあ！ わたしは助手のアユム。博士に頼まれて サポートに来たよ！",
      "アユム: 冒険の基本を教えてあげるね。",
      "📖 【バトルの基本】草むら🌿を歩くと 野生のモンスターが 出てくるよ。",
      "📖 バトルでは4つのコマンドかから選ぼう:",
      "📖  ① たたかう → わざを選んで攻撃！",
      "📖  ② バッグ → アイテムを使う（回復など）",
      "📖  ③ いれかえ → 別のモンスターに交代",
      "📖  ④ にげる → 野生バトルから逃げられる（トレーナー戦は不可）",
      "アユム: タイプ相性も大事だよ！ たとえば…",
      "📖 ほのお🔥 → くさ🌿 に強い",
      "📖 みず💧 → ほのお🔥 に強い",
      "📖 くさ🌿 → みず💧 に強い",
      "アユム: まずは近くの草むらで 野生モンスターと戦ってみよう！",
      "アユム: 勝てたら また話しかけてね！",
    ]);
  }

  /** チュートリアル助手: 捕獲の説明 */
  _doTutorialAssistantCatch() {
    this.showDialogSequence([
      "アユム: バトルに勝てたみたいだね！ おめでとう！",
      "アユム: 次は モンスターの つかまえ方 を教えるよ。",
      "📖 【捕獲のコツ】",
      "📖  ① まず相手のHPを減らそう（赤ゲージがベスト！）",
      "📖  ② バトルメニューで『アイテム』を選ぼう",
      "📖  ③ ボールを選んで 捕獲チャレンジ！",
      "📖  HPが低いほど・状態異常だと 成功率アップ！",
      "アユム: モンスターを3体まで パーティに入れられるよ。",
      "アユム: 4体目からは 博士に預ける（ボックス）形になるんだ。",
      "アユム: いろんなタイプの仲間を集めると 攻略が楽になるよ！",
      "アユム: Xキーでメニューを開いて パーティの状態を確認してみてね。",
    ], () => {
      gameState.storyFlags.tutorialCatchDone = true;
      gameState.save();
    });
  }

  /** ライバル レンとの初対面 */
  _doRivalFirstMeet(npc) {
    const sf = gameState.storyFlags;
    if (sf.rivalIntroDone) {
      // 既に会っている場合は直接バトル
      this.handleTrainerInteraction(npc);
      return;
    }
    this.showDialogSequence([
      "???: おーい！ ちょっと待てよ！",
      `レン: おれは レン。きみが ${gameState.playerName} だな？`,
      "レン: 博士からぜんぶ聞いたぜ。クリスタルを守る旅に出るんだろ？",
      "レン: おれも トレーナーを目指してるんだ。いつか最強になる！",
      "レン: …ということでさ。旅立つ前に 腕試しをしようぜ！",
      "レン: おまえの実力、おれが確かめてやるよ！ いくぞ！",
    ], () => {
      sf.rivalIntroDone = true;
      gameState.save();
      // ライバルバトル開始
      this.handleTrainerInteraction(npc);
    });
  }

  /** スターター選択 */
  _doStarterSelect(speciesId) {
    this._selectStarter(speciesId, MONSTERS, calcStats);
  }

  _selectStarter(speciesId, MONSTERS, calcStats) {
    const sf = gameState.storyFlags;
    if (sf.starterChosen) {
      this.showMessage("もうすでに 相棒がいるよ！");
      return;
    }

    const starter = MONSTERS[speciesId];
    if (!starter) {
      this.showMessage("モンスターデータが見つからないよ…");
      return;
    }

    const nameMap = { EMBEAR: "エムベア🧸", FINBUB: "フィンバブ🐟", THORNVINE: "ソーンバイン🌿" };
    const starterName = nameMap[speciesId] || starter.name;

    // 各スターターに個性的な紹介文を用意
    const personalityMap = {
      EMBEAR: [
        `${starterName} が 台座の上で ちいさな炎を あげている…`,
        "博士: エムベアは ほのおタイプのモンスターじゃ。",
        "博士: 情熱的で 勇敢な性格。いちど決めたら てこでも動かん。",
        "博士: 進化すると 力強い パイアベアに なるぞ！",
      ],
      FINBUB: [
        `${starterName} が 台座の上で 水泡を ぷくぷくと 浮かべている…`,
        "博士: フィンバブは みずタイプのモンスターじゃ。",
        "博士: 温厚で 粘り強い性格。じっくり戦うのが得意じゃよ。",
        "博士: 進化すると 美しい グラシエラに なるぞ！",
      ],
      THORNVINE: [
        `${starterName} が 台座の上で 小さな葉っぱを 揺らしている…`,
        "博士: ソーンバインは くさタイプのモンスターじゃ。",
        "博士: 知恵があり したたかな性格。トリッキーな戦い方が得意じゃ。",
        "博士: この子はまだ 進化が発見されていないが、潜在能力は高いぞ！",
      ],
    };

    const personality = personalityMap[speciesId] || [`${starterName} は きみを じっと見つめている…`];

    this.showDialogSequence([
      ...personality,
      `${starterName} を えらびますか？`,
    ], () => {
      // はい/やめるの選択
      this._pendingStarterConfirm = speciesId;
      this._showStarterYesNo(speciesId, starter, calcStats);
    });
  }

  _showStarterYesNo(speciesId, starter, calcStats) {
    const nameMap = { EMBEAR: "エムベア🧸", FINBUB: "フィンバブ🐟", THORNVINE: "ソーンバイン🌿" };
    const starterName = nameMap[speciesId] || starter.name;

    const confirmMsg = `${starterName} に けっていしますか？`;
    this.setInfoText(confirmMsg, "博士");
    this._starterChoiceActive = true;
    this._starterChoiceIndex = 0;
    this._starterChoiceData = { speciesId, starter, calcStats };
    this._starterChoiceInputGuardUntil = this.time.now + 140;
    this._renderStarterChoiceWindow();
  }

  _renderStarterChoiceWindow() {
    if (!this._starterChoiceActive) return;
    if (!this.uiContainer) return;

    const { width, height } = this.scale;
    if (!this.starterChoiceContainer) {
      this.starterChoiceContainer = this.add.container(0, 0).setScrollFactor(0);
      this.uiContainer.add(this.starterChoiceContainer);
    }
    this.starterChoiceContainer.removeAll(true);

    const panelW = 198;
    const panelH = 86;
    const panelX = width - UI_LAYOUT.SAFE_MARGIN - panelW;
    const messageTop = height - UI_LAYOUT.SAFE_MARGIN - UI_LAYOUT.MESSAGE_PANEL_HEIGHT;
    const panelY = messageTop - UI_LAYOUT.PANEL_GAP - panelH;

    const panel = this.add.graphics();
    drawPanel(panel, panelX, panelY, panelW, panelH, {
      radius: 10,
      headerHeight: 16,
      bgAlpha: 0.97,
      glow: true,
      borderColor: COLORS.SELECT_BORDER,
    });
    this.starterChoiceContainer.add(panel);

    const options = ["はい", "いいえ"];
    const rowH = 30;
    options.forEach((label, idx) => {
      const rowY = panelY + 18 + idx * rowH;
      if (this._starterChoiceIndex === idx) {
        const focus = this.add.graphics();
        drawSelection(focus, panelX + 8, rowY, panelW - 16, rowH - 2, { radius: 8 });
        this.starterChoiceContainer.add(focus);
      }

      const marker = this.add.text(panelX + 16, rowY + 4, this._starterChoiceIndex === idx ? "▶" : " ", {
        fontFamily: FONT.UI,
        fontSize: UI_FONT_SIZE.BODY,
        color: this._starterChoiceIndex === idx ? TEXT_COLORS.ACCENT : TEXT_COLORS.SECONDARY,
      });
      const text = this.add.text(panelX + 38, rowY + 4, label, {
        fontFamily: FONT.UI,
        fontSize: UI_FONT_SIZE.BODY,
        color: this._starterChoiceIndex === idx ? TEXT_COLORS.WHITE : "#cbd5e1",
        fontStyle: this._starterChoiceIndex === idx ? "700" : "400",
      });
      this.starterChoiceContainer.add([marker, text]);
    });
  }

  _closeStarterChoiceWindow() {
    this._starterChoiceActive = false;
    this._starterChoiceData = null;
    this._starterChoiceIndex = 0;
    if (this.starterChoiceContainer) {
      this.starterChoiceContainer.destroy(true);
      this.starterChoiceContainer = null;
    }
  }

  _handleStarterChoiceInput() {
    const inputGuardActive = Number.isFinite(this._starterChoiceInputGuardUntil)
      && this.time.now < this._starterChoiceInputGuardUntil;

    const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);

    if (!inputGuardActive && (up || left || down || right)) {
      this._starterChoiceIndex = this._starterChoiceIndex === 0 ? 1 : 0;
      audioManager.playCursor();
      this._renderStarterChoiceWindow();
      return;
    }

    const confirm = Phaser.Input.Keyboard.JustDown(this.keys.Z)
      || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)
      || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    if (inputGuardActive) {
      return;
    }

    if (confirm) {
      this._confirmStarterChoiceByCurrentSelection();
      return;
    }

    const cancel = Phaser.Input.Keyboard.JustDown(this.keys.X)
      || Phaser.Input.Keyboard.JustDown(this.keys.ESC);
    if (cancel) {
      this._cancelStarterChoiceSelection();
    }
  }

  _handleStarterChoiceTouchInput(delta, confirmPressed, cancelPressed) {
    const inputGuardActive = Number.isFinite(this._starterChoiceInputGuardUntil)
      && this.time.now < this._starterChoiceInputGuardUntil;
    if (inputGuardActive) return;

    if (confirmPressed) {
      this._confirmStarterChoiceByCurrentSelection();
      return;
    }

    if (cancelPressed) {
      this._cancelStarterChoiceSelection();
      return;
    }

    if (this._touchStarterChoiceNavCooldown > 0) {
      this._touchStarterChoiceNavCooldown -= delta;
      return;
    }

    if (this.touchControls.isNavUp() || this.touchControls.isNavDown()) {
      this._starterChoiceIndex = this._starterChoiceIndex === 0 ? 1 : 0;
      this._touchStarterChoiceNavCooldown = NAV_REPEAT_INTERVAL_MS;
      audioManager.playCursor();
      this._renderStarterChoiceWindow();
    }
  }

  _confirmStarterChoiceByCurrentSelection() {
    const data = this._starterChoiceData;
    if (!data) return;

    if (this._starterChoiceIndex === 0) {
      audioManager.playConfirm();
      this._closeStarterChoiceWindow();
      this._confirmStarterChoice(data.speciesId, data.starter, data.calcStats);
      return;
    }

    this._cancelStarterChoiceSelection();
  }

  _cancelStarterChoiceSelection() {
    audioManager.playCancel();
    this._closeStarterChoiceWindow();
    this.updateDefaultInfoMessage();
  }

  _confirmStarterChoice(speciesId, starter, calcStats) {
    gameState.storyFlags.starterChosen = true;
    gameState.storyFlags.starterSpeciesId = speciesId;

    const level = 5;
    const stats = calcStats(starter, level);
    const mon = {
      species: starter,
      level,
      exp: 0,
      nextLevelExp: 10 + 8 * level,
      currentHp: stats.maxHp,
      attackStage: 0,
      defenseStage: 0,
      speedStage: 0,
      abilityId: rollMonsterAbilityId(starter),
      moveIds: [],
      stamina: getMonsterMaxStamina(),
    };
    syncMonsterMoves(mon);
    gameState.party = [mon];
    gameState.markCaught(speciesId);

    const nameMap = { EMBEAR: "エムベア🧸", FINBUB: "フィンバブ🐟", THORNVINE: "ソーンバイン🌿" };
    const starterName = nameMap[speciesId] || starter.name;

    audioManager.playHeal();
    this.showDialogSequence([
      `✨ ${starterName} と なかよくなった！`,
      `博士: すばらしい！ ${starterName}は いい相棒になるぞ！`,
      "博士: さて、旅に出る前に いくつか大事なことを教えよう。",
      "博士: 町の草むらに入ると 野生のモンスターが出てくるぞ。",
      "博士: バトルでは『たたかう』で わざを選んで攻撃じゃ！",
      "博士: 相手を弱らせたら『アイテム』からボールを使うのじゃ。",
      `博士: ${gameState.playerName}、世界の運命は きみにかかっておる！`,
      "博士: まずは タウンを探索してみよう。ライバルの『レン』も会いたがっておるよ。",
      "博士: 準備ができたら 東の出口から 森へ向かうんじゃ！",
      "※ プロローグ完了！ まずは町を探索してみよう。",
    ], () => {
      gameState.storyFlags.prologueDone = true;
      gameState.storyFlags.tutorialMoveDone = true;
      gameState.save();
      this.createUi();
      // NPC再生成（プロローグ完了でNPC配置が変わる）
      this.time.delayedCall(300, () => {
        this.createNpcSprites();
      });
    });
  }

  /** 遺跡の老人 */
  _doRuinsElder() {
    const sf = gameState.storyFlags;
    if (sf.ruinsFinalDone) {
      this.showDialogSequence([
        "老人: エテルニアが守護者を認めた…ありがとう。この世界に平和が戻った。",
        "老人: きみは 真の エモじマスターじゃ！",
        "老人: 天空の花園への道が 北に開いておるぞ。",
      ]);
      return;
    }
    if (!sf.volcanoEvilBossBeaten) {
      this.showDialogSequence([
        "老人: この遺跡は 太古の力が眠る場所じゃ…",
        "老人: ダーク団のボスを倒してから ここに戻ってきなさい。",
      ]);
      return;
    }
    this.showDialogSequence([
      "老人: 待っておったぞ、若者よ！",
      "老人: ここに 最後のクリスタルが眠っている。",
      "老人: しかし ダーク団のボスが また現れた…",
      "老人: 奥に入って 決着をつけておくれ！",
    ]);
  }

  _doForestTabletLore() {
    this.showDialogSequence([
      "石板の文字: 『最初の光は森に根を張り、命の巡りを護った』",
      "石板の文字: 『炎は再生を、水は循環を、草は調和を司る』",
      "石板の文字: 『守護者に認められし者のみ、結晶を手にする』",
    ]);
  }

  _doCaveMemoryLore() {
    this.showDialogSequence([
      "結晶壁に古い記録が映る…",
      "記録: 『二つ目の結晶は、恐れに打ち勝つ者を選ぶ』",
      "記録: 『揺らぐ心は暗闇に呑まれる。仲間との絆を信じよ』",
    ]);
  }

  _doVolcanoMemoryLore() {
    this.showDialogSequence([
      "焦げた碑文: 『炎の結晶は怒りを映す鏡なり』",
      "焦げた碑文: 『怒りを力に変え、力を守りに変えよ』",
      "焦げた碑文: 『支配を望む者に、結晶は決して従わない』",
    ]);
  }

  _doFrozenMemoryLore() {
    this.showDialogSequence([
      "氷壁の詩: 『凍てる静寂は、迷いを映し出す』",
      "氷壁の詩: 『急ぐ者は道を失い、見極める者は峰を越える』",
      "氷壁の詩: 『最後の門は、冷静な心にのみ開かれる』",
    ]);
  }

  _doRuinsMemoryLore() {
    const sf = gameState.storyFlags;
    if (sf.ruinsFinalDone) {
      this.showDialogSequence([
        "光る石柱: 『継承は果たされた。新たな守護者に祝福を』",
        "光る石柱: 『旅の果てに見た景色を、次の時代へ伝えよ』",
      ]);
      return;
    }
    this.showDialogSequence([
      "石柱の刻印: 『五つ目の結晶は、終わりと始まりを繋ぐ鍵』",
      "石柱の刻印: 『すべての試練を越えし者、天へ至る庭に招かれる』",
    ]);
  }

  _doGardenEpilogueLore() {
    const sf = gameState.storyFlags;
    if (!sf.ruinsFinalDone) {
      this.showMessage("古い花碑がある…文字はかすれて読めない。まだ時期ではないようだ。");
      return;
    }
    this.showDialogSequence([
      "花碑の詩: 『守護者は世界を救い、その物語は風に刻まれる』",
      "花碑の詩: 『旅が終わっても、絆は次の冒険を呼ぶ』",
      "花碑の詩: 『挑戦を望むなら、花園はいつでも門を開く』",
    ]);
  }

  _doSwampTabletLore() {
    const sf = gameState.storyFlags;
    if (sf.swampTabletRead) {
      this.showMessage("湿地の石板: 『毒を制する者は、霧の先へ進める』");
      return;
    }
    this.showDialogSequence([
      "湿地の石板: 『第二の巡礼地には、毒を鎮める草が眠る』",
      "湿地の石板: 『草を見つけ、里へ持ち帰る者に祝福あり』",
    ], () => {
      sf.swampTabletRead = true;
      gameState.save();
    });
  }

  _doCoralLegendLore() {
    const sf = gameState.storyFlags;
    if (sf.coralLegendRead) {
      this.showMessage("珊瑚碑: 『潮騒は古文書を守る歌』");
      return;
    }
    this.showDialogSequence([
      "珊瑚碑: 『真珠は記憶、潮は継承。三つの水が文を開く』",
      "珊瑚碑: 『浜の記録官に届ければ、海の宝が託される』",
    ], () => {
      sf.coralLegendRead = true;
      gameState.save();
    });
  }

  _doDesertObeliskLore() {
    const sf = gameState.storyFlags;
    if (sf.desertObeliskRead) {
      this.showMessage("砂碑文: 『熱と静寂を越えた者に、北路は開く』");
      return;
    }
    this.showDialogSequence([
      "砂碑文: 『砂塵に紛れし遺物は、炎で姿を現す』",
      "砂碑文: 『焦るな、進むべきは北。氷の峰は試練の先にある』",
    ], () => {
      sf.desertObeliskRead = true;
      gameState.save();
    });
  }

  _doShadowMemoryLore() {
    const sf = gameState.storyFlags;
    if (sf.shadowMemoryRead) {
      this.showMessage("影の記録: 『闇を照らす鍵は、仲間の中にある』");
      return;
    }
    this.showDialogSequence([
      "影の記録: 『実験は失敗。結晶の模倣は暴走を招いた』",
      "影の記録: 『光の資質なき者、闇の森に囚われる』",
    ], () => {
      sf.shadowMemoryRead = true;
      gameState.save();
    });
  }

  _doShadowLabDiscovery() {
    const sf = gameState.storyFlags;
    if (sf.shadowLabFound) {
      this.showMessage("研究端末: 押収済みの記録は図書館へ送られた。解析を急げ。", 2400);
      return;
    }
    this.showDialogSequence([
      "壊れた端末に、ダーク団の実験ログが残っている…",
      "『結晶エネルギーの強制抽出を試行。被験体が暴走』",
      "『証拠データの一部を暗号化して保管』",
      "★ ダーク団研究ログを回収した！",
      "★ デトックスハーブ×3を見つけた！",
    ], () => {
      sf.shadowLabFound = true;
      gameState.addItem("ANTIDOTE", 3);
      gameState.save();
      this.createUi();
    });
  }

  _doLibraryCodexLore() {
    const sf = gameState.storyFlags;
    if (sf.libraryCodexRead) {
      this.showMessage("古代写本: 『知は力ではなく、継ぐ者への責任である』");
      return;
    }
    this.showDialogSequence([
      "古代写本: 『記録は失われても、断片は必ず世界のどこかに残る』",
      "古代写本: 『影の記録と図書館の封庫をつなぐ者、復元者となる』",
    ], () => {
      sf.libraryCodexRead = true;
      gameState.save();
    });
  }

  _doLibraryPuzzleHint() {
    const sf = gameState.storyFlags;
    if (sf.libraryPuzzleSolved) {
      this.showMessage("石版: 『順路は右上→左中→右中→左下→右下』");
      return;
    }
    this.showDialogSequence([
      "石版: 『対のパッドは交差し、中央路に収束する』",
      "石版: 『正しい順路を踏破した。封印の一部が解除された』",
      "★ 図書館パズルの解法を記録した！",
    ], () => {
      sf.libraryPuzzleSolved = true;
      gameState.save();
    });
  }

  _doBasinStarfallLore() {
    const sf = gameState.storyFlags;
    if (sf.basinLoreRead) {
      this.showMessage("星読碑: 『落星の核は導き、選ばれし者を高みへ送る』");
      return;
    }
    this.showDialogSequence([
      "星読碑: 『流星の核は、凍結核と雷核の二相で安定する』",
      "星読碑: 『星降り工房に届けよ。真の観測記録が完成する』",
    ], () => {
      sf.basinLoreRead = true;
      gameState.save();
    });
  }

  _doSwampRemedyQuest() {
    const sf = gameState.storyFlags;
    if (sf.swampRemedyQuestDone) {
      this.showMessage("湿地研究員: 解毒調合は順調だよ。本当に助かった！");
      return;
    }

    const missing = [];
    if (!sf.swampTabletRead) missing.push("石板の記録を読む");
    if (!sf.swampHerbFound) missing.push("湿地の薬草を回収する");
    if (!sf.swampRangerBeaten) missing.push("湿地レンジャーの試験を突破する");

    if (missing.length > 0) {
      this.showDialogSequence([
        "湿地研究員: 毒霧対策の調合に協力してほしいんだ。",
        `湿地研究員: いま必要なのは『${missing.join(" / ")}』だよ。`,
      ]);
      return;
    }

    this.showDialogSequence([
      "湿地研究員: これで解毒薬の配合が完成した！",
      "湿地研究員: 依頼達成のお礼だ。冒険に役立ててくれ！",
      "★ ハイヒールジェル×2 / デトックスハーブ×4 / 900G を受け取った！",
    ], () => {
      sf.swampRemedyQuestDone = true;
      gameState.addItem("SUPER_POTION", 2);
      gameState.addItem("ANTIDOTE", 4);
      gameState.addMoney(900);
      gameState.save();
      this.createUi();
    });
  }

  _doCoralArchivistQuest() {
    const sf = gameState.storyFlags;
    if (sf.coralArchivistQuestDone) {
      this.showMessage("珊瑚記録官: 海の写本は無事復元されたよ。ありがとう！");
      return;
    }

    if (!sf.swampRemedyQuestDone) {
      this.showDialogSequence([
        "珊瑚記録官: この依頼は連鎖調査の第2段階なんだ。",
        "珊瑚記録官: まずは霧の湿地で『湿地の調合依頼』を完了してきて。",
      ]);
      return;
    }

    const missing = [];
    if (!sf.coralLegendRead) missing.push("珊瑚碑の伝承を読む");
    if (!sf.coralPearlFound) missing.push("真珠の回収");
    if (!sf.coralWaterQuest) missing.push("みずタイプ3体の証明");

    if (missing.length > 0) {
      this.showDialogSequence([
        "珊瑚記録官: 潮汐写本の復元には、伝承と素材が必要なんだ。",
        `珊瑚記録官: まずは『${missing.join(" / ")}』を済ませてきて。`,
      ]);
      return;
    }

    this.showDialogSequence([
      "珊瑚記録官: 見事だ…これで失われた海図が蘇った！",
      "珊瑚記録官: 深海探索の支援物資を受け取ってくれ。",
      "★ ハイパーボール×2 / エーテル×2 / 1200G を受け取った！",
    ], () => {
      sf.coralArchivistQuestDone = true;
      gameState.addItem("HYPER_BALL", 2);
      gameState.addItem("ETHER", 2);
      gameState.addMoney(1200);
      gameState.save();
      this.createUi();
    });
  }

  _doLibraryRestorationQuest() {
    const sf = gameState.storyFlags;
    if (sf.libraryRestorationQuestDone) {
      this.showMessage("司書長: 失われた文書群は保存完了。次は星の観測へ向かうといい。", 2400);
      return;
    }

    if (!sf.coralArchivistQuestDone) {
      this.showDialogSequence([
        "司書長: 文献復元依頼は連鎖調査の第3段階にあたる。",
        "司書長: 先に珊瑚の浜で『珊瑚の記録復元』を完了させてくれ。",
      ]);
      return;
    }

    const missing = [];
    if (!sf.libraryCodexRead) missing.push("古代写本の読解");
    if (!sf.shadowDataFound) missing.push("影の森のデータ回収");
    if (!sf.librarySecretArchiveFound) missing.push("図書館の封庫探索");

    if (missing.length > 0) {
      this.showDialogSequence([
        "司書長: 文献復元には、散逸した断片データが不足している。",
        `司書長: 『${missing.join(" / ")}』を済ませたら報告してくれ。`,
      ]);
      return;
    }

    this.showDialogSequence([
      "司書長: 素晴らしい。復元作業がついに完了した。",
      "司書長: 次の探索のため、特別配給を支給しよう。",
      "★ ハイパーボール×3 / メガエーテル×1 / 1800G を受け取った！",
    ], () => {
      sf.libraryRestorationQuestDone = true;
      gameState.addItem("HYPER_BALL", 3);
      gameState.addItem("MEGA_ETHER", 1);
      gameState.addMoney(1800);
      gameState.save();
      this.createUi();
    });
  }

  _doStarResearchQuest() {
    const sf = gameState.storyFlags;
    if (sf.starResearchQuestDone) {
      this.showMessage("星見研究員: 観測計画は継続中だ。きみの報告が基礎データになっている！", 2400);
      return;
    }

    if (!sf.libraryRestorationQuestDone) {
      this.showDialogSequence([
        "星見研究員: 最終報告は連鎖調査の第4段階だ。",
        "星見研究員: まずは古代図書館の『図書館文献復元』を完了してくれ。",
      ]);
      return;
    }

    const missing = [];
    if (!sf.ruinsFinalDone) missing.push("遺跡最終決戦の突破");
    if (!sf.basinLoreRead) missing.push("星読碑の解析");
    if (!sf.basinStarFound) missing.push("星核サンプルの回収");
    if (!sf.basinMeteorShardFound) missing.push("隕石片サンプルの回収");

    if (missing.length > 0) {
      this.showDialogSequence([
        "星見研究員: 星降り観測の最終報告を作るため、追加データが必要だ。",
        `星見研究員: 『${missing.join(" / ")}』を済ませてきてくれ。`,
      ]);
      return;
    }

    this.showDialogSequence([
      "星見研究員: 解析完了！ きみは星降り調査隊の名誉隊員だ！",
      "星見研究員: 最高ランクの捕獲装備を正式に支給する。",
      "★ インフィニティボール×1 / パーフェクトケア×2 / 2500G を受け取った！",
    ], () => {
      sf.starResearchQuestDone = true;
      gameState.addItem("MASTER_BALL", 1);
      gameState.addItem("FULL_RESTORE", 2);
      gameState.addMoney(2500);
      this._grantRegionalQuestChainBonusIfReady();
    });
  }

  _grantRegionalQuestChainBonusIfReady() {
    const sf = gameState.storyFlags;
    if (
      sf.regionalQuestChainBonusClaimed
      || !sf.swampRemedyQuestDone
      || !sf.coralArchivistQuestDone
      || !sf.libraryRestorationQuestDone
      || !sf.starResearchQuestDone
    ) {
      gameState.save();
      this.createUi();
      return;
    }

    this.showDialogSequence([
      "連鎖調査本部: 全地域の連鎖報告を確認した。見事な達成だ！",
      "連鎖調査本部: 記念報酬として、追加の支援物資を授与する。",
      "★ パーフェクトケア×2 / ハイパーボール×3 / 2000G を受け取った！",
    ], () => {
      sf.regionalQuestChainBonusClaimed = true;
      gameState.addItem("FULL_RESTORE", 2);
      gameState.addItem("HYPER_BALL", 3);
      gameState.addMoney(2000);
      gameState.save();
      this.createUi();
    });
  }

  /** 氷峰ジムイントロ */
  _doFrozenGymIntro() {
    const sf = gameState.storyFlags;
    if (sf.frozenPeakGymCleared) {
      this.showMessage("ユキハ: また来てくれたのね。いつでも再挑戦を待って いるわ。");
      return;
    }
    this.showDialogSequence([
      "ユキハ: 氷峰ジムリーダーの ユキハよ。",
      "ユキハ: こおりの力は 見た目の美しさとは裏腹に…残酷なのよ。",
      "ユキハ: あなたの炎で 私の氷を溶かせるかしら？",
      "▶ ジムタイルに入ると ジムリーダー戦が始まります。",
    ]);
  }

  /** 天空の花園の伝説イベント */
  _doGardenLegendary() {
    const sf = gameState.storyFlags;
    if (sf.legendaryDefeated) {
      this.showMessage("エテルニアの気配がかすかに残っている…");
      return;
    }
    if (!sf.ruinsFinalDone) {
      this.showMessage("強大な力が眠っている…まだその時ではない。");
      return;
    }
    this.showDialogSequence([
      "✨ 花園の奥で 強い光が脈打っている…",
      "✨ エテルニアの分身が 守護者の力を試そうとしている！",
      "✨ 野生のエテルニアが 現れた！",
    ], () => {
      // 伝説のモンスターとの野生バトルを開始
      const eternia = MONSTERS["ETERNIA"];
      if (!eternia) return;
      const level = 45;
      const stats = calcStats(eternia, level);
      const legendaryMon = {
        species: eternia,
        level,
        currentHp: stats.maxHp,
        exp: 0,
        nextLevelExp: 10 + 8 * level,
        attackStage: 0,
        defenseStage: 0,
        speedStage: 0,
        abilityId: rollMonsterAbilityId(eternia),
        stamina: getMonsterMaxStamina(),
      };
      const activeMon = gameState.getFirstAlive();
      if (!activeMon) {
        this.showMessage("たたかえるモンスターが いない…");
        return;
      }
      gameState.markSeen(eternia.id);
      gameState.setBattle({
        player: activeMon,
        opponent: legendaryMon,
        storyBattleKey: "garden_legendary",
      });
      audioManager.stopBgm();
      audioManager.playEncounter();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.pause();
        this.scene.launch("BattleScene", { from: "WorldScene" });
      });
    });
  }

  // ═══════════════════════════════════════════
  //  トレーナーバトル
  // ═══════════════════════════════════════════

  handleTrainerInteraction(npc) {
    runTrainerInteraction(this, npc);
  }

  _launchTrainerBattle(npc) {
    runLaunchTrainerBattle(this, npc);
  }

  /** トレーナーの相手モンスターを生成 */
  _buildTrainerOpponent(battleKey, level) {
    return runBuildTrainerOpponent(battleKey, level);
  }

  /** トレーナーバトル後の進行フラグ処理 */
  _handleTrainerBattleResult(battleKey, won) {
    runTrainerBattleResult(this, battleKey, won);
  }

  /** エテルニア（伝説モンスター）をパーティに追加 */
  _addEternaToParty() {
    runAddEternaToParty();
  }

  /** 闘技場NPCの対話処理 */
  handleArenaInteraction() {
    runArenaInteraction(this);
  }

  /** 闘技場のラウンド開始 */
  _startArenaRound(round) {
    runStartArenaRound(this, round);
  }

  /** シーン復帰時に闘技場の次ラウンドを処理 */
  _checkArenaProgress() {
    runCheckArenaProgress(this);
  }

  tryMove(dx, dy) {
    if (this.isEncounterTransitioning) return;

    const curX = gameState.playerPosition.x;
    const curY = gameState.playerPosition.y;
    const newX = curX + dx;
    const newY = curY + dy;

    const iceBlock = this._isIceBlockAt(newX, newY);
    if (iceBlock) {
      if (this._hasPartyType("FIRE")) {
        this._removeIceBlock(iceBlock.id);
        audioManager.playHit();
        this.showMessage("🔥 ほのおタイプが氷ブロックを溶かした！", 1800);
      } else {
        this.showMessage("🧊 氷のブロックだ… ほのおタイプがいれば溶かせそう", 1800);
      }
      return;
    }

    if (this.mapLayout[newY]?.[newX] === T.WATER && this._isSwimmableWater(newX, newY) && !this._hasPartyType("WATER")) {
      if (!this._shownFieldHints.has("need_water")) {
        this._shownFieldHints.add("need_water");
        this.showMessage("🌊 この水面は みずタイプがいれば渡れそうだ", 1800);
      }
      return;
    }

    if (this.isBlocked(newX, newY)) return;

    this.isMoving = true;
    this.stepCount++;

    // 歩行音（数歩に1回）
    if (this.stepCount % 2 === 0) audioManager.playStep();

    this.tweens.add({
      targets: this.player,
      x: newX * TILE_SIZE + TILE_SIZE / 2,
      y: newY * TILE_SIZE + TILE_SIZE / 2,
      duration: 160,
      ease: "linear",
      onComplete: () => {
        this.isMoving = false;
        gameState.setPlayerPosition(newX, newY);
        this._updateMinimapDot();

        const tileType = this.mapLayout[newY][newX];

        // ドアタイル
        if (tileType === T.DOOR) {
          this.handleDoorTransition(newX, newY);
          return;
        }

        // ジムタイル
        if (tileType === T.GYM) {
          const isGym2 = this.mapKey === "FROZEN_PEAK";
          const cleared = isGym2 ? gameState.storyFlags.frozenPeakGymCleared : gameState.gymCleared;
          if (!cleared) {
            this.handleGymInteraction();
          }
          return;
        }

        // エンカウント判定
        this._collectHiddenItemIfExists(newX, newY);

        // 毒沼ダメージ
        if (tileType === T.POISON) {
          this._applyPoisonSwampDamage();
        }

        // テレポートパッド
        if (tileType === T.TELEPORT) {
          this._handleTeleportPad(newX, newY);
          return;
        }

        // 氷床スライド
        if (tileType === T.ICE_FLOOR) {
          this._handleIceFloorSlide(dx, dy);
          return;
        }

        // 暗闇エリア進入
        if (tileType === T.DARK && !this._darkOverlayShown) {
          this._showDarkOverlay();
        }
        // 暗闇エリアから出たらオーバーレイ解除
        if (tileType !== T.DARK && this._darkOverlayShown) {
          this._clearDarkOverlay();
        }

        // 砂地エンカウント（低確率）
        if (tileType === T.SAND) {
          this._handleSandEncounter(newX, newY);
          return;
        }

        this.handleRandomEncounter(newX, newY);
      },
    });
  }

  handleDoorTransition(x, y) {
    this.isEncounterTransitioning = true;
    audioManager.playDoor();
    const transitions = DOOR_TRANSITIONS[this.mapKey] || [];
    const match = transitions.find((t) => t.doorCheck(x, y));
    if (match) {
      const gateMessage = this._getTransitionGateMessage(match.target);
      if (gateMessage) {
        this.showMessage(gateMessage, 2800);
        this.isEncounterTransitioning = false;
        return;
      }
      // 天空の花園はクリア後のみ入れる
      if (match.target === "CELESTIAL_GARDEN" && !gameState.storyFlags.ruinsFinalDone) {
        this.showMessage("強大な力が行く手を阻んでいる… まだその時ではないようだ。");
        this.isEncounterTransitioning = false;
        return;
      }
      // マップ遷移時にオートセーブ
      this.autoSave();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.restart({ mapKey: match.target, startX: match.startX, startY: match.startY });
      });
      return;
    }
    this.isEncounterTransitioning = false;
  }

  handleRandomEncounter(tileX, tileY) {
    const tile = this.mapLayout[tileY][tileX];
    // 草むら・森・毒沼タイルでエンカウント
    const isGrass = tile === T.GRASS || tile === T.POISON;
    const isForest = tile === T.FOREST;
    if ((!isGrass && !isForest) || this.encounterCooldown > 0) return;

    this.stepsSinceLastEncounter = (this.stepsSinceLastEncounter || 0) + 1;
    const baseChance = isForest ? 0.12 : 0.25;
    const pityBonus = Math.min(0.22, this.stepsSinceLastEncounter * 0.012);
    const chance = Math.min(0.8, baseChance + pityBonus);
    if (Math.random() < chance) {
      this.encounterCooldown = 1500;
      this.stepsSinceLastEncounter = 0;
      this.startBattle(isForest);
    }
  }

  startBattle(isForest = false) {
    if (this.isEncounterTransitioning) return;
    this.isEncounterTransitioning = true;
    const shortEncounterEffect = !!gameState.gameplaySettings?.shortEncounterEffect;

    audioManager.playEncounter();
    audioManager.stopBgm();

    let wild = createWildMonsterForEncounter(this.mapKey, isForest);
    const activeMon = gameState.getFirstAlive();
    if (!activeMon) {
      this.isEncounterTransitioning = false;
      this.showMessage("たたかえるモンスターが いない… おうちで やすもう！");
      return;
    }

    const rareChance = 0.05;
    if (Math.random() < rareChance) {
      wild.isRareEncounter = true;
      wild.rewardMultiplier = 1.35;
      wild.catchRateMultiplier = 1.2;
    }

    gameState.markSeen(wild.species.id);
    gameState.setBattle({
      player: activeMon,
      opponent: wild,
    });

    if (shortEncounterEffect) {
      this.cameras.main.flash(90, 255, 255, 255);
      this.time.delayedCall(110, () => {
        this.cameras.main.fadeOut(160, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.pause();
          this.scene.launch("BattleScene", { from: "WorldScene" });
        });
      });
      return;
    }

    // エンカウント演出 — 複数回フラッシュ + 収束ワイプ
    const overlay = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000, 0
    ).setScrollFactor(0).setDepth(9999);

    const burst = this.add.circle(
      this.player.x,
      this.player.y,
      10,
      0xfde68a,
      0.22,
    ).setScrollFactor(0).setDepth(10000).setBlendMode(Phaser.BlendModes.ADD);

    const scan = this.add.graphics().setScrollFactor(0).setDepth(10001);
    for (let y = 0; y < this.scale.height; y += 6) {
      scan.fillStyle(0xffffff, 0.025);
      scan.fillRect(0, y, this.scale.width, 2);
    }

    // 3回の短いフラッシュ
    const flashSequence = [
      { delay: 0 },
      { delay: 150 },
      { delay: 300 },
    ];
    flashSequence.forEach(({ delay }) => {
      this.time.delayedCall(delay, () => {
        this.cameras.main.flash(120, 255, 255, 255);
      });
    });

    this.tweens.add({
      targets: burst,
      radius: 280,
      alpha: 0,
      duration: 500,
      ease: "cubic.out",
    });

    this.tweens.add({
      targets: scan,
      alpha: 0,
      duration: 420,
      ease: "quad.out",
    });

    // フラッシュ終了後にフェードアウト
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 300,
        ease: "power2.in",
        onComplete: () => {
          burst.destroy();
          scan.destroy();
          overlay.destroy();
          this.scene.pause();
          this.scene.launch("BattleScene", { from: "WorldScene" });
        },
      });
    });
  }

  // ── ショップ ──

  getShopInventory() {
    return getShopInventory();
  }

  openShopMenu() {
    openShopMenu(this);
  }

  closeShopMenu() {
    closeShopMenu(this);
  }

  clearShopMenu() {
    clearShopMenu(this);
  }

  renderShopMenu() {
    renderShopMenu(this);
  }

  handleShopInput() {
    handleShopInput(this);
  }
}

