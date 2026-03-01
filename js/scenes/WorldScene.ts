import { gameState } from "../state/gameState.ts";
import {
  getGymBossMonster,
  getGymBoss2Monster,
  getArenaOpponent,
  calcStats,
  MONSTERS,
  getMonsterMoves,
  syncMonsterMoves,
} from "../data/monsters.ts";
import { createWildMonsterForEncounter, rollWeatherForMapByHour } from "../data/mapRules.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { TouchControls } from "../ui/TouchControls.ts";
import { FONT, COLORS, TEXT_COLORS, drawPanel, drawSelection } from "../ui/UIHelper.ts";
import { addCameraBloom, createParticleBurst, createWeatherParticles } from "../ui/FXHelper.ts";
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
} from "./world/worldMapData.ts";
import {
  getShopInventory,
  openShopMenu,
  closeShopMenu,
  clearShopMenu,
  renderShopMenu,
  handleShopInput,
} from "./world/worldShop.ts";

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
    gameState.ensureMapWeather(this.mapKey, () => rollWeatherForMapByHour(this.mapKey, gameState.getFieldTime().hour));
    audioManager.applySettings(gameState.audioSettings || {});

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
    this.keys.Z.removeAllListeners("down");
    this.keys.ENTER.removeAllListeners("down");
    this.keys.P.removeAllListeners("down");
    this.keys.ESC.removeAllListeners("down");
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

    // キー入力
    this.keys.Z.on("down", () => {
      if (this._dialogActive) return; // ダイアログ表示中は NPC 会話をスキップ
      if (this._starterChoiceActive) return;
      if (this._trainerBattlePending) return;
      if (this.isMoving || this.shopActive || this.isEncounterTransitioning) return;
      this.checkNpcInteraction();
    });

    // メニューキー（X / ESC）
    this.keys.X.on("down", () => {
      if (this.shopActive || this.isMoving || this.isEncounterTransitioning) return;
      if (this._dialogActive || this._starterChoiceActive) return;
      this.openMenu();
    });
    this.keys.ESC.on("down", () => {
      if (this.shopActive || this.isMoving || this.isEncounterTransitioning) return;
      if (this._dialogActive || this._starterChoiceActive) return;
      this.openMenu();
    });

    // セーブキー
    this.keys.P.on("down", () => {
      if (this.shopActive) return;
      // オートセーブ通知
      const ok = gameState.save();
      audioManager.playSave();
      this.showMessage(ok ? "セーブしました！" : "セーブに失敗しました…", 2000);
    });

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

    // トレーナーバトル結果チェック
    this._checkTrainerBattleResult();
  }

  /** トレーナーバトル後の結果処理 */
  _checkTrainerBattleResult() {
    const battle = gameState.activeBattle;
    if (!battle || !battle.isTrainer) return;

    const battleKey = battle.trainerBattleKey;
    const won = !gameState.isPartyWiped();

    // バトル情報をクリア
    gameState.activeBattle = null;
    gameState.inBattle = false;

    if (battleKey) {
      // NPC再生成（フラグ更新前に結果処理）
      this._handleTrainerBattleResult(battleKey, won);
      // フラグが更新されたのでNPCを再生成
      this.time.delayedCall(200, () => {
        this.createNpcSprites();
      });
    }
  }

  openMenu() {
    audioManager.playConfirm();
    this.scene.pause();
    this.scene.launch("MenuScene", { from: "WorldScene" });
  }

  handleSceneShutdown() {
    this.events.off("resume", this.handleSceneResume, this);
    if (this.keys) {
      this.keys.Z.removeAllListeners("down");
      this.keys.ENTER?.removeAllListeners("down");
      this.keys.P.removeAllListeners("down");
      this.keys.X?.removeAllListeners("down");
      this.keys.ESC?.removeAllListeners("down");
    }
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
  }

  _getFieldPeriodByHour(hour) {
    if (hour >= 6 && hour < 11) return { label: "朝", emoji: "🌅", color: 0xfef3c7, alpha: 0.08 };
    if (hour >= 11 && hour < 17) return { label: "昼", emoji: "☀️", color: 0xf8fafc, alpha: 0.03 };
    if (hour >= 17 && hour < 20) return { label: "夕", emoji: "🌇", color: 0xfb923c, alpha: 0.1 };
    return { label: "夜", emoji: "🌙", color: 0x1e293b, alpha: 0.2 };
  }

  _getFieldWeatherView(weather) {
    switch (weather) {
      case "SUNNY":
        return { label: "晴れ", emoji: "☀️", color: 0xfbbf24, alpha: 0.08 };
      case "RAINY":
        return { label: "雨", emoji: "🌧️", color: 0x60a5fa, alpha: 0.14 };
      case "WINDY":
        return { label: "風", emoji: "🍃", color: 0x4ade80, alpha: 0.09 };
      case "SNOWY":
        return { label: "雪", emoji: "❄️", color: 0xbfdbfe, alpha: 0.15 };
      default:
        return { label: "穏やか", emoji: "⛅", color: 0x94a3b8, alpha: 0.06 };
    }
  }

  _refreshFieldTimeWeatherEffects(force = false) {
    const timeInfo = gameState.getFieldTime();
    const isInterior = this._isInteriorMap();
    const weather = isInterior ? "NONE" : (gameState.getMapWeather(this.mapKey) || "NONE");
    const period = this._getFieldPeriodByHour(timeInfo.hour);
    const weatherView = isInterior
      ? { label: "屋内", emoji: "🏠", color: 0x94a3b8, alpha: 0 }
      : this._getFieldWeatherView(weather);
    const weatherChanged = force || this.lastFieldWeather !== weather;

    if (this.timeWeatherText) {
      if (isInterior) {
        this.timeWeatherText.setText(`${period.emoji} ${period.label} ${gameState.getFieldTimeLabel()}   ${weatherView.emoji} ${weatherView.label}`);
      } else {
        this.timeWeatherText.setText(
          `${period.emoji} ${period.label} ${gameState.getFieldTimeLabel()}   ${weatherView.emoji} ${weatherView.label}`,
        );
      }
    }

    if (this.timeTintOverlay) {
      this.timeTintOverlay
        .setFillStyle(period.color, period.alpha)
        .setVisible(true);
    }

    if (this.weatherTintOverlay) {
      this.weatherTintOverlay
        .setFillStyle(weatherView.color, weatherView.alpha)
        .setVisible(weather !== "NONE");
    }

    if (weatherChanged) {
      if (this.weatherParticles) {
        this.weatherParticles.destroy();
        this.weatherParticles = null;
      }
      if (weather !== "NONE") {
        this.weatherParticles = createWeatherParticles(this, weather);
        if (this.weatherParticles?.manager) {
          this.weatherParticles.manager.setScrollFactor(0);
          this.weatherParticles.manager.setDepth(6);
        }
      }
      this.lastFieldWeather = weather;
    }
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
      if (!sf.forestScoutBeaten) return "洞窟へ進む前に、森のレンジャー試験を突破しよう。";
      if (catches < 6) return `洞窟の入場条件: 捕獲数 6体以上（現在 ${catches}体）`;
      if (battles < 18) return `洞窟の入場条件: バトル数 18回以上（現在 ${battles}回）`;
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
      const roof = this.add.triangle(
        baseX + width / 2,
        baseY + 1,
        -width / 2 - 3,
        0,
        width / 2 + 3,
        0,
        0,
        -roofHeight,
        building.roofColor || 0xb91c1c,
        0.88,
      ).setOrigin(0.5, 1);
      this.groundLayer.add(roof);

      if (building.emoji || building.label) {
        const labelText = `${building.emoji || ""} ${building.label || ""}`.trim();
        const label = this.add.text(baseX + width / 2, baseY - roofHeight - 4, labelText, {
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

    this.timeTintOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xf8fafc, 0)
      .setScrollFactor(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.weatherTintOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x94a3b8, 0)
      .setScrollFactor(0)
      .setDepth(5);

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
    this.npcs = getMapNpcs(this.mapKey);
    if (this.npcSprites) {
      this.npcSprites.forEach((s) => s.destroy());
    }
    this.npcSprites = [];
    this.npcs.forEach((npc) => {
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
    const starterInfo = [
      { x: 3, y: 5, emoji: "🧸", name: "エムベア\n炎タイプ" },
      { x: 7, y: 5, emoji: "🐟", name: "フィンバブ\n水タイプ" },
      { x: 11, y: 5, emoji: "🌿", name: "ソーンバイン\n草タイプ" },
    ];
    starterInfo.forEach((s) => {
      const wx = s.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = s.y * TILE_SIZE + TILE_SIZE / 2;
      this.add.text(wx, wy - 18, s.emoji, {
        fontSize: 22,
      }).setOrigin(0.5).setScrollFactor(1);
      this.add.text(wx, wy + 20, s.name, {
        fontFamily: FONT.UI,
        fontSize: 10,
        color: "#fde68a",
        align: "center",
      }).setOrigin(0.5).setScrollFactor(1);
    });
  }

  createUi() {
    // 既存のUI要素を破棄
    if (this.uiContainer) this.uiContainer.destroy(true);
    this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(30);

    const { width, height } = this.scale;

    // ── 一時メッセージ（通常時は非表示） ──
    const bottomBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(8, height - 66, width - 16, 58, 12, COLORS.PANEL_BG, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.PANEL_BORDER, 0.85)
      : this.add.graphics();
    if (bottomBg instanceof Phaser.GameObjects.Graphics) {
      drawPanel(bottomBg, 8, height - 66, width - 16, 58, {
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
        x: 20,
        y: height - 54,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 14,
          color: "#f1f5f9",
          wordWrap: { width: width - 36 },
          lineSpacing: 2,
        }).setOrigin(0, 0),
        align: "left",
      }).layout()
      : this.add.text(20, height - 54, "", {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: "#f1f5f9",
        wordWrap: { width: width - 36 },
        lineSpacing: 2,
      });
    this.infoText.setVisible(false);
    this.uiContainer.add(this.infoText);

    const nameBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(12, height - 104, 160, 34, 10, COLORS.PANEL_BG, 0.96)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.BLUE_LIGHT, 0.85)
      : this.add.graphics();
    if (nameBg instanceof Phaser.GameObjects.Graphics) {
      drawPanel(nameBg, 12, height - 104, 160, 34, {
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
        x: 92,
        y: height - 87,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 14,
          color: TEXT_COLORS.INFO,
          fontStyle: "700",
          align: "center",
        }).setOrigin(0.5),
        align: "center",
      }).layout()
      : this.add.text(92, height - 87, "", {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: TEXT_COLORS.INFO,
        fontStyle: "700",
        align: "center",
      }).setOrigin(0.5);
    this.speakerNameText.setVisible(false);
    this.uiContainer.add(this.speakerNameText);

    const weatherPanelWidth = 230;
    const weatherPanelX = width - weatherPanelWidth - 12;
    const weatherPanelY = 10;

    this.timeWeatherPanel = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(weatherPanelX, weatherPanelY, weatherPanelWidth, 34, 10, COLORS.PANEL_BG, 0.92)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.BLUE_LIGHT, 0.85)
      : this.add.graphics();
    if (this.timeWeatherPanel instanceof Phaser.GameObjects.Graphics) {
      drawPanel(this.timeWeatherPanel, weatherPanelX, weatherPanelY, weatherPanelWidth, 34, {
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
        y: weatherPanelY + 10,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 12,
          color: "#e2e8f0",
          fontStyle: "700",
        }).setOrigin(0, 0),
        align: "left",
      }).layout()
      : this.add.text(weatherPanelX + 12, weatherPanelY + 10, "", {
        fontFamily: FONT.UI,
        fontSize: 12,
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
    const { width } = this.scale;
    const mapW = this.mapWidth;
    const mapH = this.mapHeight;
    const scale = 3;
    const miniW = mapW * scale;
    const miniH = mapH * scale;
    const mx = width - miniW - 16;
    const my = 72;

    const g = this.add.graphics().setScrollFactor(0);
    drawPanel(g, mx - 10, my - 24, miniW + 20, miniH + 36, {
      radius: 10,
      headerHeight: 16,
      bgAlpha: 0.9,
    });

    const label = this.add.text(mx - 3, my - 21, "MINIMAP", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#bfdcff",
      fontStyle: "700",
    }).setScrollFactor(0);
    this.uiContainer.add(label);

    const tileColors = {
      0: 0x243244,
      1: 0x5b6472,
      2: 0x1f7a46,
      3: 0xb45309,
      4: 0x166534,
      5: 0x2563eb,
      6: 0x7c3aed,
      7: 0x8b7f72,
    };

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapLayout[y][x];
        const color = tileColors[tile] ?? 0x1f2933;
        // 室内マップの地面は明るく
        const adjustedColor = (tile === 0 && this.mapKey === "HOUSE1") ? 0xd1d5db : color;
        g.fillStyle(adjustedColor, 0.94);
        g.fillRect(mx + x * scale, my + y * scale, scale - 0.5, scale - 0.5);
      }
    }

    const facilityMarkers = MAP_FACILITY_MARKERS[this.mapKey] || [];
    facilityMarkers.forEach((facility) => {
      if (facility.x < 0 || facility.y < 0 || facility.x >= mapW || facility.y >= mapH) return;
      g.fillStyle(0xfacc15, 0.95);
      g.fillRect(mx + facility.x * scale, my + facility.y * scale, scale, scale);
    });

    this.uiContainer.add(g);

    // プレイヤーマーカー
    this.minimapPlayerDot = this.add.circle(
      mx + gameState.playerPosition.x * scale + scale / 2,
      my + gameState.playerPosition.y * scale + scale / 2,
      2.4, 0xfacc15, 1,
    ).setScrollFactor(0);
    this.uiContainer.add(this.minimapPlayerDot);

    this.minimapPlayerRing = this.add.circle(this.minimapPlayerDot.x, this.minimapPlayerDot.y, 4.5, 0xfacc15, 0)
      .setStrokeStyle(1, 0xfef08a, 0.9)
      .setScrollFactor(0);
    this.uiContainer.add(this.minimapPlayerRing);

    // 点滅アニメ
    this.tweens.add({
      targets: this.minimapPlayerDot,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: this.minimapPlayerRing,
      alpha: 0,
      scale: 1.55,
      duration: 900,
      repeat: -1,
      ease: "sine.out",
    });

    // ミニマップのプレイヤー位置情報を保存
    this._minimapMx = mx;
    this._minimapMy = my;
    this._minimapScale = scale;
  }

  /** ミニマップのプレイヤー位置を更新 */
  _updateMinimapDot() {
    if (!this.minimapPlayerDot) return;
    const scale = this._minimapScale || 3;
    this.minimapPlayerDot.x = this._minimapMx + gameState.playerPosition.x * scale + scale / 2;
    this.minimapPlayerDot.y = this._minimapMy + gameState.playerPosition.y * scale + scale / 2;
    if (this.minimapPlayerRing) {
      this.minimapPlayerRing.x = this.minimapPlayerDot.x;
      this.minimapPlayerRing.y = this.minimapPlayerDot.y;
    }
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
      if (this.touchControls.justPressedConfirm()) {
        if (!this.isMoving && !this.shopActive && !this.isEncounterTransitioning
          && !this._dialogActive && !this._starterChoiceActive && !this._trainerBattlePending) {
          this.checkNpcInteraction();
        }
      }
      if (this.touchControls.justPressedCancel()) {
        if (!this.shopActive && !this.isMoving && !this.isEncounterTransitioning
          && !this._dialogActive && !this._starterChoiceActive) {
          this.openMenu();
        } else if (this.shopActive) {
          this.closeShopMenu();
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
              // PP全回復
              syncMonsterMoves(m);
              m.pp = getMonsterMoves(m).map((mv) => mv.pp || 10);
              // 状態異常回復
              m.statusCondition = "NONE";
            }
          });
          audioManager.playHeal();
          this._playHealNpcEffect(npc);
          this.showMessage("パーティが全回復した！", 2600);
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
          const hasIce = gameState.party.some((m) => m.species && m.species.primaryType === "ICE");
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
   * 複数行の会話を順番に表示する。Zキーで次へ進む。
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

    // Z/Enterキー（1回分の追加リスナー）
    this._dialogAdvanceListener = () => {
      if (!this._dialogActive) return;
      this._showNextDialog();
    };
    this.keys.Z.on("down", this._dialogAdvanceListener);
    this.keys.ENTER.on("down", this._dialogAdvanceListener);
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
      "▶ それぞれの台座に近づいてZキーを押すと 相棒を選べます。",
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
      "アユム: モンスターを6体まで パーティに入れられるよ。",
      "アユム: 7体目からは 博士に預ける（ボックス）形になるんだ。",
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

    const panelX = width - 184;
    const panelY = height - 146;
    const panelW = 172;
    const panelH = 74;

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
    const rowH = 24;
    options.forEach((label, idx) => {
      const rowY = panelY + 20 + idx * rowH;
      if (this._starterChoiceIndex === idx) {
        const focus = this.add.graphics();
        drawSelection(focus, panelX + 8, rowY, panelW - 16, rowH - 2, { radius: 8 });
        this.starterChoiceContainer.add(focus);
      }

      const marker = this.add.text(panelX + 16, rowY + 3, this._starterChoiceIndex === idx ? "▶" : " ", {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: this._starterChoiceIndex === idx ? TEXT_COLORS.ACCENT : TEXT_COLORS.SECONDARY,
      });
      const text = this.add.text(panelX + 34, rowY + 3, label, {
        fontFamily: FONT.UI,
        fontSize: 15,
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
      const data = this._starterChoiceData;
      if (!data) return;
      if (this._starterChoiceIndex === 0) {
        audioManager.playConfirm();
        this._closeStarterChoiceWindow();
        this._confirmStarterChoice(data.speciesId, data.starter, data.calcStats);
      } else {
        audioManager.playCancel();
        this._closeStarterChoiceWindow();
        this.updateDefaultInfoMessage();
      }
      return;
    }

    const cancel = Phaser.Input.Keyboard.JustDown(this.keys.X)
      || Phaser.Input.Keyboard.JustDown(this.keys.ESC);
    if (cancel) {
      audioManager.playCancel();
      this._closeStarterChoiceWindow();
      this.updateDefaultInfoMessage();
    }
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
      moveIds: [],
      pp: (starter.learnset || []).map(m => m.pp || 10),
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
      "📖 【操作ガイド①】WASDキーまたは矢印キーで 移動できます。",
      "📖 【操作ガイド②】Zキーで NPCに話しかけたり メッセージを送れます。",
      "📖 【操作ガイド③】Xキーで メニューを開けます。パーティやバッグを確認しよう。",
      "📖 【操作ガイド④】Pキーで いつでもセーブできます。こまめにセーブしよう！",
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
        pp: (eternia.learnset || []).map(m => m.pp || 10),
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
      });
      audioManager.stopBgm();
      audioManager.playEncounter();
      sf.legendaryDefeated = true;
      gameState.save();
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
    if (this._trainerBattlePending) {
      return;
    }

    // バトル前の台詞を表示してからバトル開始
    const preBattleText = npc.text || "バトルだ！";

    if (!gameState.storyFlags.starterChosen) {
      this.showMessage("まず 相棒のモンスターを もらってきてね！");
      return;
    }

    const activeMon = gameState.getFirstAlive();
    if (!activeMon) {
      this.showMessage("たたかえるモンスターが いない… まずは かいふくしよう！");
      return;
    }

    this._trainerBattlePending = true;
    this.showMessage(preBattleText);
    this.time.delayedCall(1500, () => {
      this._launchTrainerBattle(npc);
    });
  }

  _launchTrainerBattle(npc) {
    const activeMon = gameState.getFirstAlive();
    if (!activeMon) {
      this._trainerBattlePending = false;
      return;
    }

    if (npc?.rivalBattle === "ruins_final") {
      const gateMessage = this._getRuinsFinalGateMessage();
      if (gateMessage) {
        this.showMessage(gateMessage, 3000);
        this._trainerBattlePending = false;
        return;
      }
    }

    const opponentMon = this._buildTrainerOpponent(npc.rivalBattle, npc.rivalLevel || 10);
    if (!opponentMon) {
      this.showMessage("相手のモンスターが みつからない…");
      this._trainerBattlePending = false;
      return;
    }

    gameState.markSeen(opponentMon.species.id);
    gameState.setBattle({
      player: activeMon,
      opponent: opponentMon,
      isBoss: npc.isBossTrainer || false,
      isTrainer: true,
      trainerName: npc.trainerName || "トレーナー",
      trainerBattleKey: npc.rivalBattle,
      isFinalBoss: npc.isFinalBoss || false,
    });

    audioManager.stopBgm();
    audioManager.playEncounter();

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.pause();
      this.scene.launch("BattleScene", { from: "WorldScene" });
    });
  }

  /** トレーナーの相手モンスターを生成 */
  _buildTrainerOpponent(battleKey, level) {
    // 各バトルキーに対応するモンスター種族
    const starterSpecies = gameState.storyFlags.starterSpeciesId || "EMBEAR";
    // ライバルはプレイヤーのスターターに弱いタイプを選ぶ
    const rivalCounterMap = { EMBEAR: "FINBUB", FINBUB: "THORNVINE", THORNVINE: "EMBEAR" };
    const rivalSpeciesId = rivalCounterMap[starterSpecies] || "FINBUB";

    const opponentSpeciesMap = {
      town: rivalSpeciesId,
      forest_scout: "THORNVINE",
      forest_guardian: "CRYSTALINE",
      forest_rival: rivalSpeciesId,
      cave_scholar: "SPIRALHORN",
      cave_evil: "SHADOWPAW",
      cave_rival3: rivalSpeciesId,
      dark_grunt: "GHOSTAIL",
      dark_sentinel: "ZAPDRAKE",
      dark_tower_void: "COSMOWL",
      volcano_boss: "BLAZEBIRD",
      volcanic_scout: "SOLFLARE",
      frozen_sage: "GLACIDRAKE",
      frozen_rival: rivalSpeciesId,
      ruins_guardian: "LIGHTNIX",
      ruins_final: "SKYPIP",
      garden_champion: "ETERNIA",
    };

    const speciesId = opponentSpeciesMap[battleKey] || "EMBEAR";
    const species = MONSTERS[speciesId] || MONSTERS["EMBEAR"];
    if (!species) {
      return createWildMonsterForEncounter("FOREST", false);
    }
    const stats = calcStats(species, level);
    const trainerMon = {
      species,
      level,
      exp: 0,
      nextLevelExp: 10 + 8 * level,
      currentHp: stats.maxHp,
      attackStage: 0,
      defenseStage: 0,
      rewardMoney: 50 + level * 15,
      moveIds: [],
      pp: (species.learnset || []).map(m => m.pp || 10),
    };
    syncMonsterMoves(trainerMon);
    return trainerMon;
  }

  /** トレーナーバトル後の進行フラグ処理 */
  _handleTrainerBattleResult(battleKey, won) {
    const sf = gameState.storyFlags;

    switch (battleKey) {
      case "town":
        if (won && !sf.townRivalBeaten) {
          sf.townRivalBeaten = true;
          this.showDialogSequence([
            "レン: うそだろ…！ まさか 負けるなんて…！",
            "レン: …認めるよ。今のきみは 強い。",
            "レン: でもな、おれは あきらめない。次に会うときは もっと強くなってるからな！",
            "レン: 森で待ってるぞ。先に行って 新しいモンスターを探しておくよ！",
            `★ ライバル レンに 勝利した！ ${gameState.playerName}の冒険が本格的に始まる…！`,
          ]);
        } else if (!won) {
          this.showMessage("レン: フフフ、まだまだだね。草むらで鍛えなおしておいで！ 何度でも受けてやるよ。");
        }
        break;
      case "forest_scout":
        if (won && !sf.forestScoutBeaten) {
          sf.forestScoutBeaten = true;
          this.showDialogSequence([
            "ミナト: 森での立ち回り、合格だ！",
            "ミナト: 洞窟へ行くなら捕獲と実戦経験を積んでおくといい。",
            "📘 森の試験をクリアした！",
          ], () => {
            gameState.addMoney(220);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "forest_guardian":
        if (won && !sf.forestCrystalFound) {
          sf.forestCrystalFound = true;
          audioManager.playHeal();
          this.showDialogSequence([
            "守護者: …認めよう。この森のクリスタル🔷を 預けよう。",
            "★ 森のエモじクリスタルを 手に入れた！ [1/5]",
          ], () => {
            gameState.addMoney(200);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "forest_rival":
        if (won && !sf.forestRivalBeaten) {
          sf.forestRivalBeaten = true;
          this.showDialogSequence([
            "レン: くっ…！ また まけた…！",
            "レン: おまえ、どんどん強くなってるな…。",
            "レン: でも おれも負けてられない！ もっと修行するぞ！",
            "レン: それより… 洞窟の奥に ダーク団がいるらしい。気をつけろよ。",
            "レン: おれも 追いかけるから。先に行けよ！",
          ]);
        }
        break;
      case "cave_scholar":
        if (won && !sf.caveScholarBeaten) {
          sf.caveScholarBeaten = true;
          this.showDialogSequence([
            "シオン: 戦術演習、見事だ。読み合いの基礎は十分だ。",
            "シオン: 次は闘技場3連戦で安定して勝てるか試してみるといい。",
            "📘 洞窟の戦術演習をクリアした！",
          ], () => {
            gameState.addMoney(320);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "cave_evil":
        if (won && !sf.caveEvilBeaten) {
          sf.caveEvilBeaten = true;
          audioManager.playHeal();
          this.showDialogSequence([
            "シャドウ: ぐっ…まさか この わたしが…！",
            "シャドウ: 小僧…おまえの力、認めてやる。",
            "シャドウ: クリスタル🔶を…置いていく…。これ以上 戦う義理はない。",
            "シャドウ: だが ボス・ライオットは おまえごとき では相手にならんぞ…。",
            "★ 洞窟のエモじクリスタルを 手に入れた！ [2/5]",
            "★ ダーク団アジトへの道が 西に 開けた！",
          ], () => {
            gameState.addMoney(300);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "dark_sentinel":
        if (won && !sf.darkTowerSentinelBeaten) {
          sf.darkTowerSentinelBeaten = true;
          this.showDialogSequence([
            "ノクト: …番兵の役目、ここまでだ。きみは先へ進む資格がある。",
            "ノクト: 闇は深い。だが怯むな。",
          ], () => {
            gameState.addMoney(380);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "volcano_boss":
        if (won && !sf.volcanoEvilBossBeaten) {
          sf.volcanoEvilBossBeaten = true;
          audioManager.playHeal();
          this.showDialogSequence([
            "ライオット: なんと…！ この おれが…こんな子どもに…！",
            "ライオット: ぐぅ…認めよう。おまえには 何か特別な力がある。",
            "ライオット: クリスタル🔴を…返してやる！",
            "ライオット: だが 覚えておけ！ 最後のクリスタルは そらの遺跡にある！",
            "ライオット: おれは 遺跡で おまえを待っている…！ 最終決戦だ！",
            "★ マグマクリスタルを 手に入れた！ [4/5]",
            "── あと1つ… 最後のクリスタルが そらの遺跡に眠っている。",
            "※ 氷峰を越え、そらの遺跡を 目指そう！",
          ], () => {
            gameState.addMoney(500);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "volcanic_scout":
        if (won && !sf.volcanicScoutBeaten) {
          sf.volcanicScoutBeaten = true;
          this.showDialogSequence([
            "ガロ: 熱波の中でも判断が鈍らないな。見事だ。",
            "ガロ: この先は氷峰。捕獲と実戦を重ねて備えろ。",
            "📘 火山斥候試験をクリアした！",
          ], () => {
            gameState.addMoney(460);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "frozen_sage":
        if (won && !sf.frozenSageBeaten) {
          sf.frozenSageBeaten = true;
          this.showDialogSequence([
            "セツナ: 冷静さと判断力、どちらも申し分ない。",
            "セツナ: 遺跡へ向かっていい。最後まで迷わないことね。",
            "📘 氷峰の賢者試験をクリアした！",
          ], () => {
            gameState.addMoney(520);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "ruins_guardian":
        if (won && !sf.ruinsGuardianBeaten) {
          sf.ruinsGuardianBeaten = true;
          this.showDialogSequence([
            "ラカ: 試練は完了だ。最奥の間への通行を認める。",
            "ラカ: 残るは実戦の積み重ねのみ…胸を張って進め。",
            "📘 遺跡の守人試練をクリアした！",
          ], () => {
            gameState.addMoney(650);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "ruins_final":
        if (won && !sf.ruinsFinalDone) {
          sf.ruinsFinalDone = true;
          audioManager.playHeal();
          this.showDialogSequence([
            "ライオット: ば…ばかな…！ この おれが…完全に負けた…！",
            "ライオット: くっ…認めよう。おまえの強さは 本物だ。",
            "ライオット: …クリスタル⚡を 返す。もう ダーク団は終わりだ…。",
            "★ 遺跡のクリスタルを 手に入れた！ [5/5]",
            "── 5つのエモじクリスタルが 眩い光を放ち始めた…！",
            "── 遺跡全体が 黄金色の光に包まれていく…",
            "── クリスタルの力が 集まり、伝説の存在を呼び覚ます…！",
            "✨ エテルニア: ………ついに…目覚めの時が来たか。",
            `✨ エテルニア: おまえが ${gameState.playerName}か。クリスタルを守り抜いた勇者よ。`,
            "✨ エテルニア: 長い眠りの間、闇の脅威を感じていた。",
            "✨ エテルニア: おまえの勇気と絆が 世界を救ったのだ。",
            "✨ エテルニア: …その礼として、わたしは おまえと共に歩もう。",
            "✨ エテルニアが パーティに加わった！",
            "🎉 ── おめでとう！ メインストーリー クリア！ ──",
            `🎉 ${gameState.playerName}は 5つのクリスタルを守り、世界に平和をもたらした！`,
            "🎉 しかし… 冒険はまだ終わらない。",
            "※ 天空の花園への道が 開いた！ 最強のトレーナーと伝説のモンスターが待っている…！",
          ], () => {
            this._addEternaToParty();
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "cave_rival3":
        if (won && !sf.caveRivalBeaten3) {
          sf.caveRivalBeaten3 = true;
          this.showDialogSequence([
            "レン: くっ…！ 3回目も負けるとは！",
            "レン: ダーク団のアジトに潜入するらしいな。気をつけろよ。",
            "レン: …いや、おまえなら大丈夫か。",
          ]);
        }
        break;
      case "dark_grunt":
        if (won && !sf.darkTowerGruntBeaten) {
          sf.darkTowerGruntBeaten = true;
          this.showDialogSequence([
            "したっぱ: うわあ！ こんなに強いのか！",
            "したっぱ: ヴォイド幹部は 奥にいるぞ…！ 覚悟しておけ！",
          ], () => {
            gameState.addMoney(150);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "dark_tower_void":
        if (won && !sf.darkTowerVoidBeaten) {
          sf.darkTowerVoidBeaten = true;
          audioManager.playHeal();
          this.showDialogSequence([
            "ヴォイド: …闇の力が 光に敗れるとは。",
            "ヴォイド: おまえの中にある光… 眩しいものだ。",
            "ヴォイド: クリスタル🟣を…持っていけ。",
            "ヴォイド: ライオットに伝えろ。もう この流れは 止められないと。",
            "★ 闇のエモじクリスタルを 手に入れた！ [3/5]",
            "── アジトの空気が 変わった。ダーク団の動揺が 感じられる…",
            "※ 洞窟に戻り、マグマ峠へ向かおう！",
          ], () => {
            gameState.addMoney(400);
            gameState.save();
            this.createUi();
          });
        }
        break;
      case "frozen_rival":
        if (won && !sf.frozenPeakRivalBeaten) {
          sf.frozenPeakRivalBeaten = true;
          this.showDialogSequence([
            "レン: …まいった！ また負けた！",
            "レン: でも次こそ…！ 遺跡で最終決戦だ！ 先に行って待ってるぞ！",
          ]);
        }
        break;
      case "garden_champion":
        if (won) {
          this.showDialogSequence([
            "アキラ: …素晴らしい！ 伝説の守護者を超える力だ！",
            "アキラ: 真のチャンピオンはキミだ。この称号を贈ろう！",
            "🏆 チャンピオン アキラに勝利した！ 報酬: 2000G！",
          ], () => {
            gameState.addMoney(2000);
            gameState.save();
            this.createUi();
          });
        }
        break;
      default:
        break;
    }
  }

  /** エテルニア（伝説モンスター）をパーティに追加 */
  _addEternaToParty() {
    const eterna = MONSTERS["ETERNIA"] || MONSTERS["AURORO"] || MONSTERS["BLAZEBIRD"];
    if (!eterna) return;
    if (gameState.party.length >= 6) {
      // パーティ満杯の場合はボックスに送る
      const level = 40;
      const stats = calcStats(eterna, level);
      const eternaEntry = {
        species: eterna,
        level,
        exp: 0,
        nextLevelExp: 10 + 8 * level,
        currentHp: stats.maxHp,
        attackStage: 0,
        defenseStage: 0,
        moveIds: [],
        pp: (eterna.learnset || []).map(m => m.pp || 10),
      };
      syncMonsterMoves(eternaEntry);
      gameState.box.push(eternaEntry);
      gameState.markCaught(eterna.id);
      return;
    }
    const level = 40;
    const stats = calcStats(eterna, level);
    const eternaEntry = {
      species: eterna,
      level,
      exp: 0,
      nextLevelExp: 10 + 8 * level,
      currentHp: stats.maxHp,
      attackStage: 0,
      defenseStage: 0,
      moveIds: [],
      pp: (eterna.learnset || []).map(m => m.pp || 10),
    };
    syncMonsterMoves(eternaEntry);
    gameState.party.push(eternaEntry);
    gameState.markCaught(eterna.id);
  }

  /** 闘技場NPCの対話処理 */
  handleArenaInteraction() {
    const activeMon = gameState.getFirstAlive();
    if (!activeMon) {
      this.showMessage("たたかえるモンスターが いない… まずは かいふくしよう！");
      return;
    }

    // 闘技場の進行状態を管理
    if (!gameState._arenaRound) gameState._arenaRound = 0;

    if (gameState._arenaRound === 0) {
      const highStr = gameState.arenaHighScore > 0 ? `（最高記録: ${gameState.arenaHighScore}連勝）` : "";
      this.showMessage(`闘技場へようこそ！ 3連戦に挑戦だ！${highStr}`);
      this.time.delayedCall(1500, () => {
        this._startArenaRound(1);
      });
    }
  }

  /** 闘技場のラウンド開始 */
  _startArenaRound(round) {
    const activeMon = gameState.getFirstAlive();
    if (!activeMon) {
      this.showMessage("たたかえるモンスターが いない…闘技場チャレンジ終了！");
      gameState._arenaRound = 0;
      return;
    }

    gameState._arenaRound = round;
    audioManager.playEncounter();
    this.showMessage(`闘技場 第${round}戦！`);

    this.time.delayedCall(800, () => {
      const opponent = getArenaOpponent(round);
      gameState.markSeen(opponent.species.id);
      gameState.setBattle({
        player: activeMon,
        opponent,
        isBoss: false,
        isArena: true,
        arenaRound: round,
      });
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.pause();
        this.scene.launch("BattleScene", { from: "WorldScene" });
      });
    });
  }

  /** シーン復帰時に闘技場の次ラウンドを処理 */
  _checkArenaProgress() {
    if (!gameState._arenaRound || gameState._arenaRound <= 0) return;

    const round = gameState._arenaRound;
    // バトルに勝利した場合（バトル終了後にここに戻ってくる）
    if (!gameState.isPartyWiped()) {
      if (round >= 3) {
        // 3連戦クリア！
        gameState.arenaWins++;
        gameState.arenaHighScore = Math.max(gameState.arenaHighScore, gameState.arenaWins);
        const reward = 500 + round * 100;
        gameState.addMoney(reward);
        gameState._arenaRound = 0;
        const arenaDailyProgress = gameState.updateDailyChallengeProgress("ARENA_CLEAR", 1);
        let dailyBonusText = "";
        if (arenaDailyProgress.completedNow) {
          const rewardResult = gameState.claimDailyChallengeReward();
          if (rewardResult.success) {
            dailyBonusText = ` さらに日替わり達成で ${rewardResult.rewardMoney}G！🎯`;
          }
        }
        this.showMessage(`闘技場3連戦クリア！ ${reward}Gを獲得！🏆${dailyBonusText}`);
        this.createUi();
      } else {
        // 次ラウンドへ
        this.showMessage(`第${round}戦 勝利！ 次の相手が待っているぞ…`);
        this.time.delayedCall(1500, () => {
          this._startArenaRound(round + 1);
        });
      }
    } else {
      // 敗北
      gameState.arenaWins = 0;
      gameState._arenaRound = 0;
      this.showMessage("闘技場チャレンジ失敗… また挑戦しよう！");
    }
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
      gameState.save();
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
    // 草むらと森タイルでエンカウント
    const isGrass = tile === T.GRASS;
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

    // 連勝ボーナス：連勝が続くほど相手が強化され、低確率でレア個体が出現
    const currentStreak = gameState.getWildWinStreak();
    const levelBoost = Math.min(4, Math.floor(currentStreak / 2));
    if (levelBoost > 0) {
      wild.level += levelBoost;
      const boostedStats = calcStats(wild.species, wild.level);
      wild.currentHp = boostedStats.maxHp;
      wild.nextLevelExp = 10 + 8 * wild.level;
      wild.streakLevelBoost = levelBoost;
    }

    const rareChance = Math.min(0.22, 0.05 + currentStreak * 0.015);
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

