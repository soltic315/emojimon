import { gameState } from "../state/gameState.ts";
import {
  TYPE_EFFECTIVENESS,
  calcStats,
  checkEvolution,
  evolveMonster,
  getAbilityById,
  getMonsterMoves,
  syncMonsterMoves,
} from "../data/monsters.ts";
import { getItemById } from "../data/items.ts";
import { MOVES } from "../data/moves.ts";
import { WEATHER } from "../data/mapRules.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { TouchControls } from "../ui/TouchControls.ts";
import {
  FONT,
  COLORS,
  TEXT_COLORS,
  drawPanel,
  drawSelection,
  drawHpBar,
  drawExpBar,
  createMonsterEmojiDisplay,
  setMonsterEmoji,
} from "../ui/UIHelper.ts";
import {
  BattleState,
  TYPE_PARTICLE,
  StatusCondition,
  WEATHER_INFO,
  clampStageValue,
  getStatusLabel,
  getStatusEmoji,
  getStatusColor,
  RUN_SUCCESS_RATE,
  RUN_RATE_MIN,
  RUN_RATE_MAX,
  CRITICAL_HIT_RATE,
  CRITICAL_HIT_MULTIPLIER,
  DAMAGE_RANDOM_MIN,
  DAMAGE_RANDOM_MAX,
  STAB_BONUS,
  PARTY_MAX,
  EXP_MULT_WILD,
  EXP_MULT_ARENA,
  EXP_MULT_GYM,
  EXP_MULT_TRAINER,
  SHARED_EXP_RATIO,
  EMO_SKIP_LEVEL_GAP,
  EMO_SKIP_HOLD_MS,
  BURN_DAMAGE_RATIO,
  POISON_DAMAGE_RATIO,
  PARALYSIS_SKIP_RATE,
  FREEZE_THAW_RATE,
  SLEEP_WAKE_RATE,
  BURN_ATTACK_MULTIPLIER,
  getMoveEffectLabel,
  formatMoveAccuracy,
  getEffectivenessLabel,
  getWeatherModifier,
} from "./battle/battleConstants.ts";
import {
  showMainMenu,
  showMoveMenu,
  showItemMenu,
  showSwitchMenu,
  clearMenuTexts,
} from "./battle/battleMenu.ts";
import {
  createBattleAtmosphere,
  rollInitialWeather,
  createWeatherDisplay,
  createWeatherParticles,
  destroyWeatherParticles,
  tickWeather,
  startBreathingAnimations,
  drawBattleBackground,
} from "./battle/battleVisuals.ts";
import {
  resolveBattleSpeedMultiplier,
  clearMessageAutoAdvanceEvent,
  scheduleMessageAutoAdvance,
  resetMessageFastForward,
  isFastForwardHeld,
  updateMessageFastForward,
  enqueueMessage as enqueueBattleMessage,
  showNextMessage as showNextBattleMessage,
} from "./battle/battleMessageFlow.ts";
import { gsap } from "gsap";
import {
  addCameraBloom,
  flashDamage,
  flashSuperHit,
  flashLevelUp,
  flashVictory,
  createParticleBurst,
  createTypeHitEffect,
} from "../ui/FXHelper.ts";

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data) {
    this.fromSceneKey = data.from;
  }

  create() {
    this.battle = gameState.activeBattle;
    if (!this.battle) {
      this.scene.stop();
      this.scene.resume(this.fromSceneKey || "WorldScene");
      return;
    }

    this.state = BattleState.INTRO;
    this.messageQueue = [];
    this.currentMessage = null;
    this.pendingActions = [];

    this.selectedMainIndex = 0;
    this.selectedMoveIndex = 0;
    this.selectedItemIndex = 0;
    this.lastSelectedMainOption = "たたかう";
    this.lastSelectedMoveId = null;
    this.lastSelectedItemId = null;

    this.isBoss = this.battle.isBoss || false;
    this.isArena = this.battle.isArena || false;
    this.isTrainer = this.battle.isTrainer || false;
    this.trainerName = this.battle.trainerName || "トレーナー";
    this.isFinalBoss = this.battle.isFinalBoss || false;
    this.resultType = null; // "win" | "lose" | "run" | "catch"
    this.isWildBattle = !this.battle.opponent?.trainer && !this.isBoss && !this.isArena && !this.isTrainer;
    this.streakHandled = false;
    this.streakAtBattleStart = gameState.getWildWinStreak ? gameState.getWildWinStreak() : 0;
    this._reactionProcThisAction = false;

    // ── エモ・スキップ判定 ──
    // 野生バトルかつプレイヤーのレベルが相手より10以上高い場合に解禁
    const playerLevel = this.battle.player?.level || 1;
    const opponentLevel = this.battle.opponent?.level || 1;
    this.emoSkipAvailable = this.isWildBattle && (playerLevel - opponentLevel >= EMO_SKIP_LEVEL_GAP);
    this.emoSkipHoldTime = 0;
    this.emoSkipTriggered = false;
    this.emoSkipHoldThreshold = EMO_SKIP_HOLD_MS;

    // 天候初期化（マップ単位で保持された天候を引き継ぐ）
    this.weather = this._rollInitialWeather();
    this.weatherTurnCounter = 0;
    this.weatherDuration = 4 + Math.floor(Math.random() * 4); // 4〜7ターン

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Z,ENTER,SPACE,X,W,A,S,D");

    // タッチコントロール
    this.touchControls = new TouchControls(this);
    this.touchControls.create();
    this._touchNavCooldown = 0;

    audioManager.applySettings(gameState.audioSettings || {});

    this.battleSpeedMultiplier = this._resolveBattleSpeedMultiplier();
    this.tweens.timeScale = this.battleSpeedMultiplier;
    this.time.timeScale = this.battleSpeedMultiplier;
    this.autoAdvanceMessagesEnabled = !!gameState.gameplaySettings?.autoAdvanceMessages;
    this.messageAutoAdvanceEvent = null;
    this.messageFastForwardHoldMs = 0;
    this.messageFastForwardCooldownMs = 0;

    // BGM
    audioManager.playBattleBgm();

    this.buildLayout();
    this.setupMonsters();
    this._initializeElementStates();
    this.bindInput();

    // PostFX: ブルーム
    this._battleBloom = addCameraBloom(this.cameras.main, {
      strength: 1.2, blurStrength: 0.8, steps: 4,
    });

    // イントロ演出
    this.cameras.main.fadeIn(400, 0, 0, 0);
    let introLabel;
    if (this.isArena) {
      introLabel = `闘技場 第${this.battle.arenaRound || 1}戦！ 相手が あらわれた！`;
    } else if (this.isFinalBoss) {
      introLabel = `⚠️ ${this.trainerName}が 最後の決戦を しかけてきた！`;
    } else if (this.isTrainer) {
      introLabel = `${this.trainerName}が しょうぶを しかけてきた！`;
    } else if (this.isBoss) {
      introLabel = "ジムリーダーが しょうぶを しかけてきた！";
    } else {
      introLabel = "野生のモンスターが とびだしてきた！";
    }
    this.enqueueMessage(introLabel);

    // エモ・スキップ ヒント表示
    if (this.emoSkipAvailable) {
      this._createEmoSkipUI();
    }

    if (this.isWildBattle && this.streakAtBattleStart >= 2) {
      this.enqueueMessage(`🔥 やせいれんしょう ${this.streakAtBattleStart} の いきおい！`);
    }

    if (this.battle.opponent?.isRareEncounter) {
      this.enqueueMessage("✨ キラめく レア個体だ！ ほうしゅうと ほかくりつが アップ！");
    }

    // 天候メッセージ
    if (this.weather !== WEATHER.NONE) {
      const wInfo = WEATHER_INFO[this.weather];
      this.enqueueMessage(`${wInfo.emoji} てんきは ${wInfo.label}だ！`);
    }

    // 統計更新
    gameState.totalBattles++;
    const dailyBattleProgress = gameState.updateDailyChallengeProgress("BATTLE", 1);
    if (dailyBattleProgress.completedNow) {
      const rewardResult = gameState.claimDailyChallengeReward();
      if (rewardResult.success) {
        this.enqueueMessage("🎯 本日のチャレンジ達成！");
        this.enqueueMessage(`ボーナスで ${rewardResult.rewardMoney}G を てにいれた！`);
      }
    }

    // ── 初回バトル判定（ガイド表示は行わない） ──
    this._isTutorialBattle = this.isWildBattle && !gameState.storyFlags.tutorialBattleDone;
  }

  clampStage(value) {
    return clampStageValue(value);
  }

  getActivePlayer() {
    return this.battle.player;
  }

  switchToNextAlive() {
    const nextAlive = gameState.getFirstAlive();
    if (!nextAlive) return false;

    if (this.battle.player !== nextAlive) {
      this.battle.player = nextAlive;
      this.enqueueMessage(`いけ！ ${nextAlive.species.name}！`);
      setMonsterEmoji(
        this.playerEmojiText,
        nextAlive.species.emoji || "❓",
        nextAlive.species.subEmoji,
      );
      this.playerEmojiText.setScale(Number.isFinite(nextAlive?.species?.sizeScale)
        ? Math.max(0.4, nextAlive.species.sizeScale)
        : 1);
      this.updateHud(false);
    }
    return true;
  }

  buildLayout() {
    const { width, height } = this.scale;

    // 環境に応じた動的背景
    this._drawBattleBackground(width, height);
    this._createBattleAtmosphere(width, height);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x020617, 0.12);
    vignette.fillRect(0, 0, width, 24);
    vignette.fillRect(0, height * 0.72, width, height * 0.28);
    vignette.fillRect(0, 0, 20, height);
    vignette.fillRect(width - 20, 0, 20, height);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // 地面
    this.playerGround = this.add
      .ellipse(width * 0.28, height * 0.62, 240, 64, 0x0b1120, 0.92)
      .setStrokeStyle(2, 0x64748b, 0.55);
    this.opponentGround = this.add
      .ellipse(width * 0.72, height * 0.32, 240, 64, 0x0b1120, 0.92)
      .setStrokeStyle(2, 0x64748b, 0.55);

    this.add.ellipse(this.playerGround.x, this.playerGround.y - 2, 180, 26, 0xffffff, 0.04)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add.ellipse(this.opponentGround.x, this.opponentGround.y - 2, 180, 26, 0xffffff, 0.04)
      .setBlendMode(Phaser.BlendModes.ADD);

    // メッセージパネル
    const panelX = 6;
    const panelWidth = width - 12;
    const panelHeight = 150;
    const panelY = height - panelHeight - 6;
    const panelDividerX = panelX + panelWidth * 0.56;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.panelDividerX = panelDividerX;

    const panelBg = this.add.graphics();
    drawPanel(panelBg, panelX, panelY, panelWidth, panelHeight, {
      headerHeight: 24,
      radius: 12,
      bgAlpha: 0.95,
      glow: true,
    });

    panelBg.lineStyle(1, 0x334155, 0.45);
    panelBg.lineBetween(panelDividerX, panelY + 30, panelDividerX, panelY + panelHeight - 14);

    const messageX = panelX + 14;
    const messageWrapWidth = Math.max(180, panelDividerX - messageX - 16);

    this.messageText = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: messageX,
        y: panelY + 14,
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 15,
          color: "#e5e7eb",
          wordWrap: { width: messageWrapWidth },
          lineSpacing: 4,
        }).setOrigin(0, 0),
        align: "left",
      }).layout()
      : this.add.text(messageX, panelY + 14, "", {
        fontFamily: FONT.UI,
        fontSize: 15,
        color: "#e5e7eb",
        wordWrap: { width: messageWrapWidth },
        lineSpacing: 4,
      });

    // ▼ 次へインジケーター
    this.nextIndicator = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: panelX + panelWidth - 24,
        y: panelY + panelHeight - 20,
        text: this.add.text(0, 0, "▼", {
          fontFamily: FONT.UI,
          fontSize: 14,
          color: "#94a3b8",
        }).setOrigin(0.5),
        align: "center",
      }).layout()
      : this.add.text(panelX + panelWidth - 24, panelY + panelHeight - 20, "▼", {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: "#94a3b8",
      });
    this.tweens.add({
      targets: this.nextIndicator,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.menuTextGroup = [];
    this.moveTextGroup = [];
    this.itemTextGroup = [];

    // 天候表示UI
    this._createWeatherDisplay();
  }

  _createBattleAtmosphere(width, height) {
    createBattleAtmosphere(this, width, height);
  }

  /** 天候初期化：マップ単位の天候を取得（未設定時のみ決定して保持） */
  _rollInitialWeather() {
    return rollInitialWeather(this);
  }

  /** 天候表示UIを生成 */
  _createWeatherDisplay() {
    createWeatherDisplay(this);
  }

  /** 天候パーティクルを生成 */
  _createWeatherParticles(width, height) {
    createWeatherParticles(this, width, height);
  }

  /** 天候パーティクルを破棄 */
  _destroyWeatherParticles() {
    destroyWeatherParticles(this);
  }

  /** 天候UIを更新 */
  _updateWeatherDisplay() {
    if (this.weatherText) this.weatherText.destroy();
    this._createWeatherDisplay();
  }

  /** ターン経過で天候が変化するか判定 */
  _tickWeather() {
    tickWeather(this);
  }

  /** 天候によるダメージ倍率を取得 */
  _getWeatherModifier(moveType) {
    return getWeatherModifier(this.weather, moveType);
  }

  /** 呼吸アニメーション開始（入場演出完了後に呼ぶ） */
  _startBreathingAnimations() {
    startBreathingAnimations(this);
  }

  setupMonsters() {
    const { width } = this.scale;
    const player = this.battle.player;
    const opponent = this.battle.opponent;

    // プレイヤー絵文字
    this.playerAura = this.add.circle(this.playerGround.x, this.playerGround.y - 42, 34, 0xfbbf24, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.playerEmojiText = createMonsterEmojiDisplay(
      this,
      this.playerGround.x,
      this.playerGround.y - 44,
      player.species.emoji || "❓",
      {
        fontFamily: "system-ui, emoji",
        fontSize: 56,
        subEmojis: player.species.subEmoji,
      }
    );
    const playerSizeScale = Number.isFinite(player?.species?.sizeScale)
      ? Math.max(0.4, player.species.sizeScale)
      : 1;
    this.playerEmojiText.setScale(playerSizeScale);

    // 相手絵文字
    this.opponentAura = this.add.circle(this.opponentGround.x, this.opponentGround.y - 46, 38, 0xf8fafc, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.opponentEmojiText = createMonsterEmojiDisplay(
      this,
      this.opponentGround.x,
      this.opponentGround.y - 48,
      opponent.species.emoji || "❓",
      {
        fontFamily: "system-ui, emoji",
        fontSize: 60,
        subEmojis: opponent.species.subEmoji,
      }
    );
    const opponentSizeScale = Number.isFinite(opponent?.species?.sizeScale)
      ? Math.max(0.4, opponent.species.sizeScale)
      : 1;
    this.opponentEmojiText.setScale(opponentSizeScale);

    // ── 入場アニメーション ──
    // プレイヤー: 左からスライドイン
    const playerFinalX = this.playerEmojiText.x;
    this.playerEmojiText.x = -60;
    this.playerEmojiText.setAlpha(0);
    gsap.to(this.playerEmojiText, {
      x: playerFinalX,
      alpha: 1,
      duration: 0.6,
      ease: "back.out(1.2)",
      delay: 0.2,
    });

    // 相手: 右からスライドイン + スケールアップ
    const opponentFinalX = this.opponentEmojiText.x;
    this.opponentEmojiText.x = width + 60;
    this.opponentEmojiText.setAlpha(0);
    this.opponentEmojiText.setScale(opponentSizeScale * 0.3);
    gsap.to(this.opponentEmojiText, {
      x: opponentFinalX,
      alpha: 1,
      scaleX: opponentSizeScale,
      scaleY: opponentSizeScale,
      duration: 0.7,
      ease: "back.out(1.4)",
      delay: 0.4,
      onComplete: () => {
        // 入場完了後に呼吸アニメーション開始
        this._startBreathingAnimations();
      },
    });

    // プレイヤーアウラもフェードイン
    this.playerAura.setAlpha(0);
    gsap.to(this.playerAura, { alpha: 0.08, duration: 0.5, delay: 0.6 });
    this.opponentAura.setAlpha(0);
    gsap.to(this.opponentAura, { alpha: 0.08, duration: 0.5, delay: 0.8 });

    this.tweens.add({
      targets: [this.playerAura, this.opponentAura],
      alpha: 0.02,
      scale: 1.25,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // ── プレイヤー情報パネル ──
    const pPanelX = 10;
    const pPanelY = 10;
    this.playerPanelBg = this.add.graphics();
    drawPanel(this.playerPanelBg, pPanelX, pPanelY, 250, 88, {
      radius: 11,
      headerHeight: 22,
      bgAlpha: 0.94,
      glow: true,
    });

    this.playerNameText = this.add.text(pPanelX + 10, pPanelY + 6, "", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#fde68a",
    });

    // タイプバッジ
    this.playerTypeBadge = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: pPanelX + 238,
        y: pPanelY + 8,
        background: this.rexUI.add.roundRectangle(0, 0, 46, 14, 7, 0x374151, 0.9),
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 9,
          color: "#d1d5db",
        }).setOrigin(0.5),
        align: "center",
        space: { left: 6, right: 6, top: 2, bottom: 2 },
      }).setOrigin(1, 0).layout()
      : this.add.text(pPanelX + 238, pPanelY + 7, "", {
        fontFamily: FONT.UI,
        fontSize: 9,
        padding: { x: 4, y: 1 },
      }).setOrigin(1, 0);

    // HP ラベル
    this.add.text(pPanelX + 10, pPanelY + 28, "HP", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#94a3b8",
    });
    this.playerHpBarBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(pPanelX + 36, pPanelY + 34, 140, 10, 5, 0x111827, 1).setOrigin(0, 0.5)
      : this.add.rectangle(pPanelX + 36, pPanelY + 34, 140, 10, 0x111827).setOrigin(0, 0.5);
    this.playerHpBar = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(pPanelX + 36, pPanelY + 34, 140, 10, 5, 0x22c55e, 1).setOrigin(0, 0.5)
      : this.add.rectangle(pPanelX + 36, pPanelY + 34, 140, 10, 0x22c55e).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(pPanelX + 180, pPanelY + 28, "", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#9ca3af",
    });

    // EXP バー
    this.add.text(pPanelX + 10, pPanelY + 48, "EXP", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#94a3b8",
    });
    this.playerExpBarBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(pPanelX + 40, pPanelY + 54, 136, 6, 3, 0x111827, 1).setOrigin(0, 0.5)
      : this.add.rectangle(pPanelX + 40, pPanelY + 54, 136, 6, 0x111827).setOrigin(0, 0.5);
    this.playerExpBar = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(pPanelX + 40, pPanelY + 54, 0, 6, 3, 0x3b82f6, 1).setOrigin(0, 0.5)
      : this.add.rectangle(pPanelX + 40, pPanelY + 54, 0, 6, 0x3b82f6).setOrigin(0, 0.5);
    this.playerExpText = this.add.text(pPanelX + 180, pPanelY + 48, "", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#6b7280",
    });

    // ステージ表示
    this.playerStageText = this.add.text(pPanelX + 10, pPanelY + 72, "", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#818cf8",
    });

    // ── 相手情報パネル ──
    const oPanelX = width - 260;
    const oPanelY = 10;
    this.opponentPanelBg = this.add.graphics();
    drawPanel(this.opponentPanelBg, oPanelX, oPanelY, 250, 66, {
      radius: 11,
      headerHeight: 20,
      bgAlpha: 0.94,
      glow: true,
      borderColor: 0x5b2333,
    });

    this.opponentNameText = this.add.text(oPanelX + 10, oPanelY + 6, "", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#fca5a5",
    });

    // 相手タイプバッジ
    this.opponentTypeBadge = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: oPanelX + 238,
        y: oPanelY + 8,
        background: this.rexUI.add.roundRectangle(0, 0, 46, 14, 7, 0x374151, 0.9),
        text: this.add.text(0, 0, "", {
          fontFamily: FONT.UI,
          fontSize: 9,
          color: "#d1d5db",
        }).setOrigin(0.5),
        align: "center",
        space: { left: 6, right: 6, top: 2, bottom: 2 },
      }).setOrigin(1, 0).layout()
      : this.add.text(oPanelX + 238, oPanelY + 7, "", {
        fontFamily: FONT.UI,
        fontSize: 9,
        padding: { x: 4, y: 1 },
      }).setOrigin(1, 0);

    this.add.text(oPanelX + 10, oPanelY + 28, "HP", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#94a3b8",
    });
    this.opponentHpBarBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(oPanelX + 36, oPanelY + 34, 140, 10, 5, 0x111827, 1).setOrigin(0, 0.5)
      : this.add.rectangle(oPanelX + 36, oPanelY + 34, 140, 10, 0x111827).setOrigin(0, 0.5);
    this.opponentHpBar = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(oPanelX + 36, oPanelY + 34, 140, 10, 5, 0x22c55e, 1).setOrigin(0, 0.5)
      : this.add.rectangle(oPanelX + 36, oPanelY + 34, 140, 10, 0x22c55e).setOrigin(0, 0.5);
    this.opponentHpText = this.add.text(oPanelX + 180, oPanelY + 28, "", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#9ca3af",
    });

    this.opponentStatusText = this.add.text(oPanelX + 10, oPanelY + 46, "", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#f59e0b",
    });

    this.updateHud(false);
  }

  /** 環境に応じたバトル背景を描画 */
  _drawBattleBackground(width, height) {
    drawBattleBackground(this, width, height);
  }

  bindInput() {
    const handleConfirmDown = () => {
      // エモ・スキップ中は通常確定を無視（長押し判定に委ねる）
      if (this.emoSkipAvailable && !this.emoSkipTriggered && this._isEmoSkipPhase()) return;
      this.handleConfirm();
    };
    this.keys.Z.on("down", handleConfirmDown);
    this.keys.ENTER.on("down", handleConfirmDown);
    this.keys.SPACE.on("down", () => this.handleConfirm());
    this.keys.X.on("down", () => this.handleCancel());

    this.keys.Z.on("up", () => this._resetMessageFastForward());
    this.keys.ENTER.on("up", () => this._resetMessageFastForward());
    this.keys.SPACE.on("up", () => this._resetMessageFastForward());
  }

  /** エモ・スキップが発動可能なフェーズか */
  _isEmoSkipPhase() {
    return this.state === BattleState.INTRO || this.state === BattleState.PLAYER_TURN;
  }

  _resolveBattleSpeedMultiplier() {
    return resolveBattleSpeedMultiplier(this);
  }

  _clearMessageAutoAdvanceEvent() {
    clearMessageAutoAdvanceEvent(this);
  }

  _scheduleMessageAutoAdvance(text) {
    scheduleMessageAutoAdvance(this, text);
  }

  _resetMessageFastForward() {
    resetMessageFastForward(this);
  }

  _isFastForwardHeld() {
    return isFastForwardHeld(this);
  }

  _updateMessageFastForward(delta) {
    updateMessageFastForward(this, delta);
  }

  // ── メッセージキュー ──

  enqueueMessage(text, options = {}) {
    enqueueBattleMessage(this, text, options);
  }

  showNextMessage() {
    showNextBattleMessage(this);
  }

  // ── ボール判定 ──

  hasBallsInInventory() {
    return (gameState.inventory || []).some((it) => {
      if (it.quantity <= 0) return false;
      const def = getItemById(it.itemId);
      if (!def) return false;
      return (def.catchBonus || (def.id === "EMO_BALL" ? 1 : 0)) > 0;
    });
  }

  getBestBall() {
    const inv = gameState.inventory || [];
    const candidates = inv
      .map((entry) => {
        if (entry.quantity <= 0) return null;
        const def = getItemById(entry.itemId);
        if (!def) return null;
        const bonus = def.catchBonus || (def.id === "EMO_BALL" ? 1 : 0);
        if (bonus <= 0) return null;
        return { entry, bonus, name: def.name };
      })
      .filter(Boolean)
      .sort((a, b) => b.bonus - a.bonus);

    return candidates[0] || null;
  }

  consumeBall(ball) {
    if (ball && ball.entry) {
      ball.entry.quantity -= 1;
      if (ball.entry.quantity <= 0) {
        gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
      }
    }
  }

  // ── メインメニュー ──

  showMainMenu(reset = true) {
    showMainMenu(this, reset);
  }

  // ── わざ選択 ──

  showMoveMenu(reset = true) {
    showMoveMenu(this, reset);
  }

  // ── アイテム選択 ──

  showItemMenu(reset = true) {
    showItemMenu(this, reset);
  }

  clearMenuTexts() {
    clearMenuTexts(this);
  }

  // ── 入力 ──

  handleConfirm() {
    if (this.state === BattleState.ANIMATING) return;

    if (this.currentMessage) {
      audioManager.playCursor();
      this._clearMessageAutoAdvanceEvent();
      this.showNextMessage();
      return;
    }

    if (this.state === BattleState.PLAYER_TURN) {
      audioManager.playConfirm();
      const choice = this.mainOptions[this.selectedMainIndex];
      this.lastSelectedMainOption = choice;
      if (choice === "たたかう") this.showMoveMenu(true);
      else if (choice === "いれかえ") this.showSwitchMenu(true);
      else if (choice === "アイテム") this.showItemMenu(true);
      else if (choice === "にげる") this.tryRun();
    } else if (this.state === BattleState.PLAYER_SELECT_MOVE) {
      audioManager.playConfirm();
      const selectedMove = getMonsterMoves(this.battle.player)[this.selectedMoveIndex];
      if (selectedMove) this.lastSelectedMoveId = selectedMove.id || selectedMove.name;
      // PP チェック
      const ppArr = this.battle.player.pp;
      if (ppArr && ppArr[this.selectedMoveIndex] !== undefined && ppArr[this.selectedMoveIndex] <= 0) {
        this.enqueueMessage("この わざは もう つかえない…");
        return;
      }
      this.performPlayerMove();
    } else if (this.state === BattleState.PLAYER_SELECT_ITEM) {
      audioManager.playConfirm();
      const selectedItem = (this.currentBattleItems || [])[this.selectedItemIndex];
      if (selectedItem && selectedItem.def) this.lastSelectedItemId = selectedItem.def.id;
      this.performUseItem();
    } else if (this.state === BattleState.PLAYER_SELECT_SWITCH) {
      audioManager.playConfirm();
      this.performSwitch();
    }
  }

  handleCancel() {
    if (this.state === BattleState.PLAYER_SELECT_MOVE || this.state === BattleState.PLAYER_SELECT_ITEM || this.state === BattleState.PLAYER_SELECT_SWITCH) {
      audioManager.playCancel();
      if (this.state === BattleState.PLAYER_SELECT_MOVE) {
        const selectedMove = getMonsterMoves(this.battle.player)[this.selectedMoveIndex];
        if (selectedMove) this.lastSelectedMoveId = selectedMove.id || selectedMove.name;
      } else if (this.state === BattleState.PLAYER_SELECT_ITEM) {
        const selectedItem = (this.currentBattleItems || [])[this.selectedItemIndex];
        if (selectedItem && selectedItem.def) this.lastSelectedItemId = selectedItem.def.id;
      }
      this.showMainMenu(false);
    }
  }

  update(time, delta) {
    this._updateMessageFastForward(delta);

    // ── エモ・スキップ 長押し判定 ──
    if (this.emoSkipAvailable && !this.emoSkipTriggered && this._isEmoSkipPhase()) {
      if (this.keys.Z.isDown || this.keys.ENTER.isDown) {
        this.emoSkipHoldTime += delta;
        this._updateEmoSkipProgress(this.emoSkipHoldTime / this.emoSkipHoldThreshold);
        if (this.emoSkipHoldTime >= this.emoSkipHoldThreshold) {
          this.emoSkipTriggered = true;
          this.executeEmoSkip();
          return;
        }
      } else if (this.emoSkipHoldTime > 0) {
        // キーを離したらリセット
        this.emoSkipHoldTime = 0;
        this._updateEmoSkipProgress(0);
      }
    }

    // タッチ操作の処理
    if (this.touchControls && this.touchControls.visible) {
      if (this.touchControls.justPressedConfirm()) {
        this.handleConfirm();
      }
      if (this.touchControls.justPressedCancel()) {
        this.handleCancel();
      }
      // タッチナビゲーション（クールダウン付き）
      if (this._touchNavCooldown > 0) {
        this._touchNavCooldown -= delta;
      } else if (this.touchControls.isNavUp()) {
        this._touchNavCooldown = 200;
        this._handleTouchNav(-1);
      } else if (this.touchControls.isNavDown()) {
        this._touchNavCooldown = 200;
        this._handleTouchNav(1);
      }
    }

    if (this.state === BattleState.PLAYER_TURN) this.handleMainMenuNavigation();
    else if (this.state === BattleState.PLAYER_SELECT_MOVE) this.handleMoveMenuNavigation();
    else if (this.state === BattleState.PLAYER_SELECT_ITEM) this.handleItemMenuNavigation();
    else if (this.state === BattleState.PLAYER_SELECT_SWITCH) this.handleSwitchMenuNavigation();
  }

  _handleTouchNav(dir) {
    if (this.state === BattleState.PLAYER_TURN) {
      const n = this.mainOptions ? this.mainOptions.length : 0;
      if (n > 0) {
        this.selectedMainIndex = (this.selectedMainIndex + dir + n) % n;
        audioManager.playCursor();
        this.showMainMenu(false);
      }
    } else if (this.state === BattleState.PLAYER_SELECT_MOVE) {
      const moves = getMonsterMoves(this.battle.player);
      if (moves.length === 0) return;
      this.selectedMoveIndex = (this.selectedMoveIndex + dir + moves.length) % moves.length;
      audioManager.playCursor();
      this.showMoveMenu(false);
    } else if (this.state === BattleState.PLAYER_SELECT_ITEM) {
      const items = this.currentBattleItems || [];
      if (items.length > 0) {
        this.selectedItemIndex = (this.selectedItemIndex + dir + items.length) % items.length;
        audioManager.playCursor();
        this.showItemMenu(false);
      }
    } else if (this.state === BattleState.PLAYER_SELECT_SWITCH) {
      const switchable = this.switchableParty || [];
      if (switchable.length > 0) {
        this.selectedSwitchIndex = (this.selectedSwitchIndex + dir + switchable.length) % switchable.length;
        audioManager.playCursor();
        this.showSwitchMenu(false);
      }
    }
  }

  isNavUpPressed() {
    return Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.W);
  }

  isNavDownPressed() {
    return Phaser.Input.Keyboard.JustDown(this.cursors.down)
      || Phaser.Input.Keyboard.JustDown(this.keys.S);
  }

  _initializeElementStates() {
    [this.battle?.player, this.battle?.opponent].forEach((monster) => {
      if (!monster) return;
      monster.wetTurns = Math.max(0, Math.floor(monster.wetTurns || 0));
      monster.accuracyDownTurns = Math.max(0, Math.floor(monster.accuracyDownTurns || 0));
      monster.lastMoveType = monster.lastMoveType || null;
    });
  }

  _updateElementStatesAtTurnStart(monster) {
    if (!monster) return;
    if (monster.wetTurns > 0) {
      monster.wetTurns = Math.max(0, monster.wetTurns - 1);
    }
    if (monster.accuracyDownTurns > 0) {
      monster.accuracyDownTurns = Math.max(0, monster.accuracyDownTurns - 1);
      this.enqueueMessage(`${monster.species.name}は すいじょうきで みえづらい…`);
    }
  }

  isMoveHit(move, user = null) {
    if (!move) return false;
    const rawAccuracy = move.accuracy;
    if (rawAccuracy === undefined || rawAccuracy === null) return true;

    let accuracy = rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy;
    if (user && user.accuracyDownTurns > 0) {
      accuracy *= 0.75;
    }
    const clamped = Phaser.Math.Clamp(accuracy, 0, 100);
    return Math.random() * 100 <= clamped;
  }

  handleMainMenuNavigation() {
    const n = this.mainOptions ? this.mainOptions.length : 0;
    if (n === 0) return;
    if (this.isNavUpPressed()) {
      this.selectedMainIndex = (this.selectedMainIndex - 1 + n) % n;
      audioManager.playCursor();
      this.showMainMenu(false);
    } else if (this.isNavDownPressed()) {
      this.selectedMainIndex = (this.selectedMainIndex + 1) % n;
      audioManager.playCursor();
      this.showMainMenu(false);
    }
  }

  handleMoveMenuNavigation() {
    const moves = getMonsterMoves(this.battle.player);
    if (moves.length === 0) return;
    if (this.isNavUpPressed()) {
      this.selectedMoveIndex = (this.selectedMoveIndex - 1 + moves.length) % moves.length;
      audioManager.playCursor();
      this.showMoveMenu(false);
    } else if (this.isNavDownPressed()) {
      this.selectedMoveIndex = (this.selectedMoveIndex + 1) % moves.length;
      audioManager.playCursor();
      this.showMoveMenu(false);
    }
  }

  handleItemMenuNavigation() {
    const items = this.currentBattleItems || [];
    if (items.length === 0) return;
    if (this.isNavUpPressed()) {
      this.selectedItemIndex = (this.selectedItemIndex - 1 + items.length) % items.length;
      audioManager.playCursor();
      this.showItemMenu(false);
    } else if (this.isNavDownPressed()) {
      this.selectedItemIndex = (this.selectedItemIndex + 1) % items.length;
      audioManager.playCursor();
      this.showItemMenu(false);
    }
  }

  // ── 逃走 ──

  tryRun() {
    if (!this.isWildBattle) {
      this.enqueueMessage("トレーナーせんでは にげられない！");
      return;
    }

    // 速度差による逃走確率補正: 速いほど逃げやすい
    const player = this.battle.player;
    const opponent = this.battle.opponent;
    const playerSpeed = calcStats(player.species, player.level).speed;
    const opponentSpeed = calcStats(opponent.species, opponent.level).speed;
    const speedDiff = playerSpeed - opponentSpeed;
    // 速度差10ごとに±10%
    const speedBonus = (speedDiff / 10) * 0.1;
    const runRate = Math.min(RUN_RATE_MAX, Math.max(RUN_RATE_MIN, RUN_SUCCESS_RATE + speedBonus));
    const success = Math.random() < runRate;
    if (success) {
      audioManager.playRunAway();
      this.resultType = "run";
      this.state = BattleState.RESULT;
      this.enqueueMessage("うまく にげきれた！");
    } else {
      this.enqueueMessage("にげられなかった！");
      this.startOpponentTurn();
    }
  }

  // ── 攻撃演出 ──

  playAttackAnimation(attacker, target, move, onComplete) {
    this.state = BattleState.ANIMATING;

    const isPlayer = attacker === this.battle.player;
    const emojiText = isPlayer ? this.playerEmojiText : this.opponentEmojiText;
    const targetEmoji = isPlayer ? this.opponentEmojiText : this.playerEmojiText;

    // 突進アニメーション
    const origX = emojiText.x;
    const origY = emojiText.y;
    const dx = isPlayer ? 60 : -60;

    gsap.killTweensOf(emojiText);
    gsap.killTweensOf(targetEmoji);

    gsap.timeline({
      onComplete: () => {
        this.time.delayedCall(220, onComplete);
      },
    })
      .to(emojiText, {
        x: origX + dx,
        duration: 0.12,
        ease: "power2.out",
      })
      .add(() => {
        audioManager.playHit();
        this.cameras.main.shake(200, 0.012);
        this.spawnHitParticles(targetEmoji.x, targetEmoji.y, move.type);
        gsap.fromTo(
          targetEmoji,
          { alpha: 1, scale: 1 },
          {
            alpha: 0.2,
            scale: 0.86,
            duration: 0.08,
            yoyo: true,
            repeat: 2,
            ease: "power1.inOut",
            onComplete: () => {
              targetEmoji.alpha = 1;
              targetEmoji.scale = 1;
            },
          }
        );
      })
      .to(emojiText, {
        x: origX,
        y: origY,
        duration: 0.14,
        ease: "power2.in",
      });
  }

  spawnHitParticles(x, y, moveType) {
    // Phaser ParticleEmitter ベースの高品質ヒットエフェクト
    createTypeHitEffect(this, x, y, moveType, false);
  }

  showFloatingDamage(x, y, damage, isSuper = false, isCritical = false) {
    const color = isSuper ? "#f97316" : isCritical ? "#fbbf24" : "#ffffff";
    const fontSize = isSuper ? 28 : isCritical ? 26 : 22;
    const prefix = isCritical && !isSuper ? "💥" : "";
    const text = this.add.text(x, y, `${prefix}-${damage}`, {
      fontFamily: FONT.UI,
      fontSize,
      color,
      stroke: "#000000",
      strokeThickness: 4,
      shadow: { offsetX: 1, offsetY: 1, color: "#00000080", blur: 4, fill: true },
    }).setOrigin(0.5).setScale(0.6).setAlpha(0).setDepth(50);

    // 左右にわずかにランダムオフセット
    const offsetX = (Math.random() - 0.5) * 30;

    gsap.timeline({ onComplete: () => text.destroy() })
      .to(text, {
        alpha: 1,
        scale: isSuper ? 1.2 : 1,
        duration: 0.12,
        ease: "back.out(2)",
      })
      .to(text, {
        x: x + offsetX,
        y: y - 60,
        alpha: 0,
        scale: isSuper ? 1.3 : 1.08,
        duration: 0.85,
        ease: "power2.out",
      });
  }

  /** 回復数値のフローティング表示 */
  showFloatingHeal(x, y, amount) {
    const text = this.add.text(x, y, `+${amount}`, {
      fontFamily: FONT.UI,
      fontSize: 22,
      color: "#4ade80",
      stroke: "#000000",
      strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: "#00000080", blur: 4, fill: true },
    }).setOrigin(0.5).setScale(0.6).setAlpha(0).setDepth(50);

    gsap.timeline({ onComplete: () => text.destroy() })
      .to(text, {
        alpha: 1,
        scale: 1,
        duration: 0.15,
        ease: "back.out(1.5)",
      })
      .to(text, {
        y: y - 50,
        alpha: 0,
        duration: 0.8,
        ease: "power2.out",
      });
  }

  getStatusLabel(statusCondition) {
    return getStatusLabel(statusCondition);
  }

  getMoveEffectLabel(move) {
    return getMoveEffectLabel(move);
  }

  formatMoveAccuracy(move) {
    return formatMoveAccuracy(move);
  }

  getEffectivenessLabel(effectiveness) {
    return getEffectivenessLabel(effectiveness);
  }

  registerWildStreakWin() {
    if (!this.isWildBattle || this.streakHandled) return;
    if (typeof gameState.addWildWinStreak !== "function") return;
    const streak = gameState.addWildWinStreak(1);
    this.streakHandled = true;
    this.enqueueMessage(`🔥 やせいれんしょう ${streak}！`);
    if (streak > 0 && streak % 5 === 0) {
      this.enqueueMessage("れんしょうボーナスが さらに あがった！");
    }
  }

  tryApplyMoveStatus(target, move) {
    if (!target || !move || !move.inflictStatus || !move.statusChance) return false;
    if (target.statusCondition && target.statusCondition !== StatusCondition.NONE) return false;

    const chancePercent = move.statusChance <= 1 ? move.statusChance * 100 : move.statusChance;
    const chance = Phaser.Math.Clamp(chancePercent, 0, 100);
    if (Math.random() * 100 > chance) return false;

    target.statusCondition = move.inflictStatus;
    return true;
  }

  _applyElementReaction(attacker, defender, move, baseDamage) {
    if (!attacker || !defender || !move) return { extraDamage: 0, messages: [] };

    const messages = [];
    let extraDamage = 0;

    const wetByWeather = this.weather === WEATHER.RAINY;
    const wetByState = (defender.wetTurns || 0) > 0;
    const wetByLastMove = defender.lastMoveType === "WATER";

    if (move.type === "ELECTRIC" && (wetByWeather || wetByState || wetByLastMove)) {
      const stats = calcStats(defender.species, defender.level || 1);
      const shockDamage = Math.max(1, Math.floor(stats.maxHp * 0.12));
      extraDamage += shockDamage;
      messages.push(`⚡ みずをつたって かんでん！ ついかで ${shockDamage} ダメージ！`);
    }

    if (move.type === "FIRE" && defender.statusCondition === StatusCondition.FREEZE) {
      defender.statusCondition = StatusCondition.NONE;
      const steamDamage = Math.max(1, Math.floor(Math.max(1, baseDamage) * 0.5));
      extraDamage += steamDamage;
      defender.accuracyDownTurns = Math.max(defender.accuracyDownTurns || 0, 2);
      messages.push(`♨️ こおりが とけて すいじょうきばくはつ！ ついかで ${steamDamage} ダメージ！`);
      messages.push(`${defender.species.name}の めいちゅうが さがった！`);
    }

    return { extraDamage, messages };
  }

  _updateElementStateAfterHit(attacker, defender, move) {
    if (!attacker || !defender || !move) return;
    attacker.lastMoveType = move.type || null;
    if (move.type === "WATER" && defender.currentHp > 0) {
      defender.wetTurns = Math.max(defender.wetTurns || 0, 2);
      this.enqueueMessage(`${defender.species.name}は びしょぬれになった！`);
    }
  }

  /**
   * ターン開始時の状態異常処理。
   * @returns {"act" | "skip" | "fainted"}
   *   - "act"     : 行動可能
   *   - "skip"    : 行動不能（まひ・こおり・ねむり等）だがHP残存
   *   - "fainted" : 状態異常ダメージで戦闘不能
   */
  processTurnStartStatus(monster) {
    if (!monster || !monster.species) return "act";
    this._updateElementStatesAtTurnStart(monster);
    if (!monster.statusCondition || monster.statusCondition === StatusCondition.NONE) return "act";

    // キズナによる状態異常回復 (bond 80以上, プレイヤー側のみ, 20%で発動)
    if (monster === this.battle?.player && (monster.bond || 0) >= 80 && Math.random() < 0.2) {
      monster.statusCondition = StatusCondition.NONE;
      this.enqueueMessage(`❤️ ${monster.species.name}は キズナのちからで じょうたいを なおした！`);
      this.updateStatusDisplays();
      return "act";
    }

    if (monster.statusCondition === StatusCondition.BURN) {
      const stats = calcStats(monster.species, monster.level || 1);
      const burnDamage = Math.max(1, Math.floor(stats.maxHp * BURN_DAMAGE_RATIO));
      monster.currentHp = Math.max(0, monster.currentHp - burnDamage);
      this.enqueueMessage(`${monster.species.name}は やけどで くるしんでいる！ ${burnDamage}ダメージ！`);
      this.updateHud(true);
      if (monster.currentHp <= 0) {
        return "fainted";
      }
    }

    if (monster.statusCondition === StatusCondition.POISON) {
      const stats = calcStats(monster.species, monster.level || 1);
      const poisonDamage = Math.max(1, Math.floor(stats.maxHp * POISON_DAMAGE_RATIO));
      monster.currentHp = Math.max(0, monster.currentHp - poisonDamage);
      this.enqueueMessage(`${monster.species.name}は どくで ダメージを うけている！ ${poisonDamage}ダメージ！`);
      this.updateHud(true);
      if (monster.currentHp <= 0) {
        return "fainted";
      }
    }

    if (monster.statusCondition === StatusCondition.PARALYSIS) {
      if (Math.random() < PARALYSIS_SKIP_RATE) {
        this.enqueueMessage(`${monster.species.name}は しびれて うごけない！`);
        return "skip";
      }
    }

    if (monster.statusCondition === StatusCondition.FREEZE) {
      if (Math.random() < FREEZE_THAW_RATE) {
        monster.statusCondition = StatusCondition.NONE;
        this.enqueueMessage(`${monster.species.name}の こおりが とけた！`);
      } else {
        this.enqueueMessage(`${monster.species.name}は こおって うごけない！`);
        return "skip";
      }
    }

    if (monster.statusCondition === StatusCondition.SLEEP) {
      monster._sleepTurns = (monster._sleepTurns || 0) + 1;
      if (monster._sleepTurns >= (monster._sleepDuration || 3) || Math.random() < SLEEP_WAKE_RATE) {
        monster.statusCondition = StatusCondition.NONE;
        monster._sleepTurns = 0;
        this.enqueueMessage(`${monster.species.name}は めを さました！`);
      } else {
        this.enqueueMessage(`${monster.species.name}は ぐうぐう ねむっている…`);
        return "skip";
      }
    }

    return "act";
  }

  // ── プレイヤー攻撃 ──

  /** 素早さに基づく行動順を決定する */
  _determineSpeedOrder(playerMove) {
    const player = this.getActivePlayer();
    const opponent = this.battle.opponent;
    if (!player || !opponent) return "player";

    const playerPriority = (playerMove && playerMove.priority) || 0;
    const opponentMove = this.chooseOpponentMove(opponent, player);
    this._pendingOpponentMove = opponentMove;
    const opponentPriority = (opponentMove && opponentMove.priority) || 0;

    // 優先度が異なれば高い方が先攻
    if (playerPriority !== opponentPriority) {
      return playerPriority > opponentPriority ? "player" : "opponent";
    }

    // 素早さ比較
    const playerStats = calcStats(player.species, player.level || 1);
    const opponentStats = calcStats(opponent.species, opponent.level || 1);
    let playerSpeed = playerStats.speed;
    let opponentSpeed = opponentStats.speed;

    // まひ状態は素早さ半減
    if (player.statusCondition === StatusCondition.PARALYSIS) playerSpeed = Math.floor(playerSpeed * 0.5);
    if (opponent.statusCondition === StatusCondition.PARALYSIS) opponentSpeed = Math.floor(opponentSpeed * 0.5);

    // 素早さステージ補正
    const playerSpeedStage = player.speedStage || 0;
    const opponentSpeedStage = opponent.speedStage || 0;
    playerSpeed = Math.max(1, Math.floor(playerSpeed * Math.max(0.25, 1 + playerSpeedStage * 0.25)));
    opponentSpeed = Math.max(1, Math.floor(opponentSpeed * Math.max(0.25, 1 + opponentSpeedStage * 0.25)));

    if (playerSpeed === opponentSpeed) return Math.random() < 0.5 ? "player" : "opponent";
    return playerSpeed >= opponentSpeed ? "player" : "opponent";
  }

  performPlayerMove() {
    const player = this.getActivePlayer();
    const opponent = this.battle.opponent;
    if (!player || player.currentHp <= 0) {
      if (!this.switchToNextAlive()) {
        this.handleDefeat();
      } else {
        this.showMainMenu(true);
      }
      return;
    }
    const move = getMonsterMoves(player)[this.selectedMoveIndex];
    if (!move) return;

    this.clearMenuTexts();

    // PP 消費
    if (player.pp && player.pp[this.selectedMoveIndex] !== undefined) {
      player.pp[this.selectedMoveIndex] = Math.max(0, player.pp[this.selectedMoveIndex] - 1);
    }

    // 素早さに基づく行動順決定
    const order = this._determineSpeedOrder(move);

    if (order === "player") {
      // プレイヤー先攻
      this._executePlayerAttack(player, opponent, move, () => {
        if (opponent.currentHp <= 0) {
          this.handleVictory();
        } else {
          this._executeOpponentTurnAfterPlayer();
        }
      });
    } else {
      // 相手先攻
      this._executeOpponentAttackDirect(opponent, player, this._pendingOpponentMove, () => {
        if (player.currentHp <= 0) {
          if (!this.switchToNextAlive()) {
            this.handleDefeat();
          } else {
            // いれかえ後は次のターンへ（PP消費済みの技は使わない）
            this.startPlayerTurn();
          }
        } else {
          this._executePlayerAttack(player, opponent, move, () => {
            if (opponent.currentHp <= 0) {
              this.handleVictory();
            } else {
              this.startPlayerTurn();
            }
          });
        }
      });
    }
  }

  /** プレイヤーの攻撃を実行する内部メソッド */
  _executePlayerAttack(player, opponent, move, onComplete) {
    player.lastMoveType = move?.type || null;

    // 命中判定
    if (!this.isMoveHit(move, player)) {
      this.enqueueMessage(`${player.species.name}の ${move.name}！ しかし はずれた！`);
      if (onComplete) this.time.delayedCall(100, onComplete);
      return;
    }

    // ── ステータス技の処理 ──
    if (move.category === "status") {
      this.handleStatusMove(player, opponent, move, true);
      if (onComplete) this.time.delayedCall(100, onComplete);
      return;
    }

    // 攻撃技演出開始
    this.playAttackAnimation(player, opponent, move, () => {
      const result = this.calculateDamage(player, opponent, move);
      const damage = result.damage;
      opponent.currentHp = Math.max(0, opponent.currentHp - damage);

      const reaction = this._applyElementReaction(player, opponent, move, damage);
      if (reaction.extraDamage > 0) {
        opponent.currentHp = Math.max(0, opponent.currentHp - reaction.extraDamage);
      }

      const effectiveness = result.effectiveness;
      const isSuper = effectiveness >= 1.5;

      // 効果音 + PostFX演出
      if (isSuper) {
        audioManager.playSuperEffective();
        flashSuperHit(this.cameras.main);
        createTypeHitEffect(this, this.opponentEmojiText.x, this.opponentEmojiText.y, move.type, true);
      } else if (effectiveness < 1.0 && effectiveness > 0) {
        audioManager.playNotEffective();
      }

      // 急所やばつぐんでカメラシェイク + ダメージフラッシュ
      if (result.critical || isSuper) {
        const intensity = isSuper && result.critical ? 0.5 : 0.3;
        flashDamage(this.cameras.main, { intensity });
      }

      // ダメージ数字表示
      this.showFloatingDamage(this.opponentEmojiText.x, this.opponentEmojiText.y - 30, damage, isSuper, result.critical);

      // HP バーをアニメーション更新
      this.updateHud(true);

      this.enqueueMessage(`${player.species.name}の ${move.name}！ ${damage}ダメージ！`);
      reaction.messages.forEach((msg) => this.enqueueMessage(msg));
      if (result.critical) this.enqueueMessage("きゅうしょに あたった！");

      if (opponent.currentHp > 0 && this.tryApplyMoveStatus(opponent, move)) {
        const statusLabel = this.getStatusLabel(opponent.statusCondition) || "じょうたいいじょう";
        this.enqueueMessage(`${opponent.species.name}は ${statusLabel}に なった！`);
      }

      if (isSuper) this.enqueueMessage("こうかは ばつぐんだ！");
      else if (effectiveness > 0 && effectiveness < 1.0) this.enqueueMessage("あまり きいていない みたいだ…");
      else if (effectiveness === 0) this.enqueueMessage("こうかが ない みたいだ…");
      if (result.weatherBoosted) this.enqueueMessage("てんきの えいきょうで いりょくが あがった！");
      else if (result.weatherWeakened) this.enqueueMessage("てんきの えいきょうで いりょくが さがった…");

      this._updateElementStateAfterHit(player, opponent, move);

      this.updateHud(true);

      if (onComplete) this.time.delayedCall(100, onComplete);
    });
  }

  /** 相手の攻撃をプレイヤー先攻後に実行する */
  _executeOpponentTurnAfterPlayer() {
    const opponent = this.battle.opponent;
    const player = this.getActivePlayer();
    if (!player || player.currentHp <= 0 || opponent.currentHp <= 0) {
      if (player && player.currentHp <= 0) {
        if (!this.switchToNextAlive()) {
          this.handleDefeat();
        } else {
          this.startPlayerTurn();
        }
      }
      return;
    }

    const statusResult = this.processTurnStartStatus(opponent);
    if (statusResult === "fainted") {
      this.handleVictory();
      return;
    }
    if (statusResult === "skip") {
      // 相手は状態異常で行動不能 → プレイヤーのターンへ
      this.startPlayerTurn();
      return;
    }

    const move = this._pendingOpponentMove || this.chooseOpponentMove(opponent, player);
    this._executeOpponentAttackDirect(opponent, player, move, () => {
      if (player.currentHp <= 0) {
        if (!this.switchToNextAlive()) {
          this.handleDefeat();
        } else {
          this.startPlayerTurn();
        }
      } else {
        this.startPlayerTurn();
      }
    });
  }

  /** 相手の攻撃を直接実行（速度逆転時にも使用） */
  _executeOpponentAttackDirect(opponent, player, move, onComplete) {
    if (!move) {
      this.enqueueMessage(`${opponent.species.name}は なにも できない…`);
      if (onComplete) this.time.delayedCall(100, onComplete);
      return;
    }
    opponent.lastMoveType = move?.type || null;

    // 命中判定
    if (!this.isMoveHit(move, opponent)) {
      const label = this._getOpponentLabel();
      this.enqueueMessage(`${label} ${opponent.species.name}の ${move.name}！ しかし はずれた！`);
      if (onComplete) this.time.delayedCall(100, onComplete);
      return;
    }

    // ステータス技
    if (move.category === "status") {
      this.handleStatusMove(opponent, player, move, false);
      if (onComplete) this.time.delayedCall(100, onComplete);
      return;
    }

    // 攻撃演出
    this.playAttackAnimation(opponent, player, move, () => {
      const result = this.calculateDamage(opponent, player, move);
      let damage = result.damage;
      let bondSurvived = false;

      if ((player.bond || 0) >= 70 && player.currentHp <= damage && Math.random() < 0.2) {
        damage = player.currentHp - 1;
        bondSurvived = true;
      }
      player.currentHp = Math.max(0, player.currentHp - damage);

      const reaction = this._applyElementReaction(opponent, player, move, result.damage);
      if (reaction.extraDamage > 0) {
        let extraDam = reaction.extraDamage;
        if (!bondSurvived && (player.bond || 0) >= 70 && player.currentHp <= extraDam && Math.random() < 0.2) {
          extraDam = player.currentHp - 1;
          bondSurvived = true;
        }
        player.currentHp = Math.max(0, player.currentHp - extraDam);
      }

      const effectiveness = result.effectiveness;
      const isSuper = effectiveness >= 1.5;

      if (isSuper) audioManager.playSuperEffective();

      if (result.critical || isSuper) {
        const intensity = isSuper && result.critical ? 0.012 : 0.007;
        this.cameras.main.shake(300, intensity);
      }

      this.showFloatingDamage(this.playerEmojiText.x, this.playerEmojiText.y - 30, damage, isSuper, result.critical);
      this.updateHud(true);

      const label = this._getOpponentLabel();
      this.enqueueMessage(`${label} ${opponent.species.name}の ${move.name}！ ${result.damage}ダメージ！`);
      if (bondSurvived) {
        this.enqueueMessage(`❤️ ${player.species.name}は キズナのちからで もちこたえた！`);
      }
      reaction.messages.forEach((msg) => this.enqueueMessage(msg));
      if (result.critical) this.enqueueMessage("きゅうしょに あたった！");

      if (player.currentHp > 0 && this.tryApplyMoveStatus(player, move)) {
        const statusLabel = this.getStatusLabel(player.statusCondition) || "じょうたいいじょう";
        this.enqueueMessage(`${player.species.name}は ${statusLabel}に なった！`);
      }

      if (isSuper) this.enqueueMessage("こうかは ばつぐんだ！");
      else if (effectiveness > 0 && effectiveness < 1.0) this.enqueueMessage("あまり きいていない みたいだ…");
      if (result.weatherBoosted) this.enqueueMessage("てんきの えいきょうで いりょくが あがった！");
      else if (result.weatherWeakened) this.enqueueMessage("てんきの えいきょうで いりょくが さがった…");

      this._updateElementStateAfterHit(opponent, player, move);

      this.updateHud(true);
      if (onComplete) this.time.delayedCall(100, onComplete);
    });
  }

  /** 相手のラベルを取得（ジムリーダー/トレーナー/闘技場/野生） */
  _getOpponentLabel() {
    if (this.isBoss) return "ジムリーダーの";
    if (this.isTrainer) return `${this.trainerName}の`;
    if (this.isArena) return "闘技場の";
    return "野生の";
  }

  handleStatusMove(user, target, move, isPlayer) {
    const userName = user.species.name;

    if (move.selfAttackStage) {
      const before = user.attackStage || 0;
      user.attackStage = this.clampStage(before + move.selfAttackStage);
      if (user.attackStage !== before) this.enqueueMessage(`${userName}は きあいを ためた！ こうげきが あがった！`);
      else this.enqueueMessage("これいじょう こうげきは かわらない！");
    }
    if (move.selfDefenseStage) {
      const before = user.defenseStage || 0;
      user.defenseStage = this.clampStage(before + move.selfDefenseStage);
      if (user.defenseStage !== before) this.enqueueMessage(`${userName}は ぼうぎょたいせいを とった！ ぼうぎょが あがった！`);
      else this.enqueueMessage("これいじょう ぼうぎょは かわらない！");
    }
    if (move.targetAttackStage) {
      const before = target.attackStage || 0;
      target.attackStage = this.clampStage(before + move.targetAttackStage);
      if (target.attackStage !== before) this.enqueueMessage(`${target.species.name}の こうげきが さがった！`);
      else this.enqueueMessage("しかし これいじょう さがらない！");
    }
    if (move.selfHealPercent) {
      const stats = calcStats(user.species, user.level || 1);
      const maxHp = stats.maxHp;
      const healAmt = Math.floor(maxHp * move.selfHealPercent);
      const before = user.currentHp;
      user.currentHp = Math.min(maxHp, user.currentHp + healAmt);
      const healed = user.currentHp - before;
      if (healed > 0) {
        this.enqueueMessage(`${userName}は HPを ${healed} かいふくした！`);
        audioManager.playHeal();
      } else {
        this.enqueueMessage("しかし HPは まんたんだ！");
      }
      this.updateHud(true);
    }
  }

  handleVictory() {
    this.resultType = "win";
    this.state = BattleState.RESULT;
    audioManager.playVictory();
    flashVictory(this.cameras.main);

    // 相手の消滅エフェクト
    this._playDefeatEffect(this.opponentEmojiText);

    const opponent = this.battle.opponent;
    let battleLabel;
    if (this.isArena) battleLabel = "闘技場の";
    else if (this.isBoss) battleLabel = "ジムリーダーの";
    else if (this.isTrainer) battleLabel = `${this.trainerName}の`;
    else battleLabel = "野生の";
    this.enqueueMessage(`${battleLabel} ${opponent.species.name}は たおれた！`);

    // 共通の報酬処理
    this._processVictoryRewards(opponent, this.battle.player);

    // ジムクリアフラグ
    if (this.isBoss) {
      const gymNum = this.battle.gymNumber || 1;
      if (gymNum === 2) {
        gameState.storyFlags.frozenPeakGymCleared = true;
        this.enqueueMessage("アイスバッジを てにいれた！ おめでとう！ 🏆❄️");
      } else {
        gameState.gymCleared = true;
        this.enqueueMessage("ジムバッジを てにいれた！ おめでとう！ 🏆");
      }
    }
  }

  /** 勝利/スキップ共通の報酬処理（経験値・レベルアップ・進化・お金・連勝） */
  _processVictoryRewards(opponent, leader) {
    const streakBefore = gameState.getWildWinStreak ? gameState.getWildWinStreak() : 0;
    const streakBonusMul = this.isWildBattle ? 1 + Math.min(0.5, streakBefore * 0.08) : 1;
    const encounterBonusMul = opponent.rewardMultiplier || 1;
    const totalBonusMul = streakBonusMul * encounterBonusMul;

    // 経験値計算（レベル補正付き）
    const expMultiplier = this.isArena ? EXP_MULT_ARENA : (this.isBoss ? EXP_MULT_GYM : (this.isTrainer ? EXP_MULT_TRAINER : EXP_MULT_WILD));
    const levelFactor = Math.max(1, (opponent.level || 1)) / 5;
    const expGain = Math.max(1, Math.floor(opponent.species.baseExpYield * levelFactor * expMultiplier * totalBonusMul));
    this.enqueueMessage(`${expGain} けいけんちを かくとく！`);
    if (totalBonusMul > 1.01) {
      const bonusPct = Math.round((totalBonusMul - 1) * 100);
      this.enqueueMessage(`ボーナスで けいけんち +${bonusPct}%！`);
    }

    // パーティ全員に経験値を分配（先頭: 100%、他: 30%）
    const levelUpResult = gameState.addExpToMonsterDetailed(leader, expGain);
    gameState.addBond(leader, 2); // 戦闘に出たのでキズナ+2
    
    gameState.party.forEach((m) => {
      if (m !== leader && m.species && m.currentHp > 0) {
        const shareExp = Math.max(1, Math.floor(expGain * SHARED_EXP_RATIO));
        gameState.addExpToMonster(m, shareExp);
        gameState.addBond(m, 1); // 一緒に戦ったのでキズナ+1
      }
    });

    if (levelUpResult.levelsGained > 0) {
      audioManager.playLevelUp();
      this.enqueueMessage(`${leader.species.name}は レベル ${leader.level} に あがった！`);
      if (levelUpResult.learnedMoves.length > 0) {
        levelUpResult.learnedMoves.forEach((move) => {
          this.enqueueMessage(`${leader.species.name}は ${move.name}を おぼえた！`);
        });
      }
      this._playLevelUpEffect(this.playerEmojiText);

      // 進化チェック
      const evo = checkEvolution(leader);
      if (evo) {
        const oldName = leader.species.name;
        evolveMonster(leader, evo);
        syncMonsterMoves(leader);
        this.enqueueMessage(`おめでとう！ ${oldName}は ${leader.species.name}に しんかした！ 🎉`);
        this._playEvolutionEffect(
          this.playerEmojiText,
          leader.species.emoji,
          leader.species.subEmoji,
          leader.species.sizeScale,
        );
      }
    }

    this._grantHeldItemDrops(opponent);

    // お金
    const baseMoney = opponent.level * (this.isBoss ? 30 : 10);
    const moneyGain = Math.max(1, Math.floor(baseMoney * totalBonusMul));
    gameState.addMoney(moneyGain);
    this.enqueueMessage(`${moneyGain}Gを てにいれた！`);

    if (this.isWildBattle) {
      this.registerWildStreakWin();

      // 初回バトル完了フラグ更新
      if (this._isTutorialBattle) {
        gameState.storyFlags.tutorialBattleDone = true;
        gameState.save();
      }
    }

    // 図鑑登録
    if (opponent.species?.id && !gameState.seenIds.includes(opponent.species.id)) {
      gameState.seenIds.push(opponent.species.id);
    }
  }

  _grantHeldItemDrops(opponent) {
    const heldItems = Array.isArray(opponent?.species?.heldItems) ? opponent.species.heldItems : [];
    heldItems.forEach((entry) => {
      if (!entry || !entry.itemId || entry.dropRate <= 0) return;
      if (Math.random() > entry.dropRate) return;
      gameState.addItem(entry.itemId, 1);
      const itemDef = getItemById(entry.itemId);
      const itemName = itemDef?.name || entry.itemId;
      this.enqueueMessage(`${opponent.species.name}の もちもの ${itemName}を てにいれた！`);
    });
  }

  /** 倒れたモンスターの消滅エフェクト */
  _playDefeatEffect(emojiText) {
    if (!emojiText) return;
    // パーティクルバーストで消滅演出
    createParticleBurst(this, emojiText.x, emojiText.y, {
      textureKey: "particle-white",
      count: 16,
      speed: 150,
      lifespan: 700,
      scale: { start: 1.5, end: 0 },
      gravityY: 60,
    });
    this.tweens.add({
      targets: emojiText,
      y: emojiText.y + 40,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 800,
      ease: "power2.in",
    });
  }

  /** レベルアップのキラキラエフェクト（PostFX + パーティクルバースト） */
  _playLevelUpEffect(emojiText) {
    if (!emojiText) return;
    const x = emojiText.x;
    const y = emojiText.y;

    // ParticleEmitter による金色パーティクルバースト
    createParticleBurst(this, x, y, {
      textureKey: "particle-star",
      count: 20,
      speed: 200,
      lifespan: 1000,
      scale: { start: 1.5, end: 0 },
      tint: 0xfde68a,
      gravityY: -40,
    });

    // 白い光のバースト
    createParticleBurst(this, x, y, {
      textureKey: "particle-white",
      count: 10,
      speed: 120,
      lifespan: 600,
      scale: { start: 2.0, end: 0 },
      gravityY: 0,
    });

    // PostFX フラッシュ
    flashLevelUp(this.cameras.main);
  }

  /** 進化の演出 — 光のバーストと絵文字チェンジ（強化版） */
  _playEvolutionEffect(emojiText, newEmoji, newSubEmojis = null, targetScale = 1) {
    if (!emojiText) return;
    const x = emojiText.x;
    const y = emojiText.y;

    // 進化パーティクル（虹色バースト）
    const colors = [0xf97316, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xec4899];
    colors.forEach((tint, i) => {
      this.time.delayedCall(i * 80, () => {
        createParticleBurst(this, x, y, {
          textureKey: "particle-star",
          count: 6,
          speed: 160 + i * 20,
          lifespan: 800,
          scale: { start: 1.2, end: 0 },
          tint,
          gravityY: -20,
        });
      });
    });

    // 白く光る
    this.cameras.main.flash(600, 255, 255, 255, true);
    // スケールアニメーション
    this.tweens.add({
      targets: emojiText,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 400,
      yoyo: true,
      ease: "sine.inOut",
      onYoyo: () => {
        setMonsterEmoji(emojiText, newEmoji, newSubEmojis);
      },
      onComplete: () => {
        emojiText.setScale(Number.isFinite(targetScale) ? Math.max(0.4, targetScale) : 1);
        this.updateHud(false);
      },
    });
  }

  // ── アイテム使用 ──

  performUseItem() {
    const battleItems = this.currentBattleItems || [];
    if (battleItems.length === 0) {
      this.showMainMenu(true);
      return;
    }

    const selection = battleItems[this.selectedItemIndex];
    if (!selection) return;

    const { entry, def } = selection;
    const player = this.getActivePlayer();
    let itemConsumed = false;
    const catchBonus = def.catchBonus || (def.id === "EMO_BALL" ? 1 : 0);
    const isCatchBall = catchBonus > 0;

    if (isCatchBall) {
      if (!this.isWildBattle) {
        this.enqueueMessage("いまは ボールを つかえない！");
        this.showMainMenu(true);
        return;
      }
      this.attemptCatch({ entry, bonus: catchBonus, name: def.name, emoji: def.emoji });
      return;
    }

    if (!def.effect) {
      this.enqueueMessage("しかし なにも おきなかった…");
      this.startOpponentTurn();
      return;
    }

    // 効果適用
    if (def.effect.type === "heal") {
      const stats = calcStats(player.species, player.level || 1);
      const maxHp = stats.maxHp;
      const before = player.currentHp;
      player.currentHp = Math.min(maxHp, player.currentHp + (def.effect.amount || 0));
      const healed = player.currentHp - before;
      this.updateHud(true);

      if (healed > 0) {
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくした！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし HPは まんたんだ！");
      }
    } else if (def.effect.type === "buffAttack") {
      const before = player.attackStage || 0;
      player.attackStage = this.clampStage(before + (def.effect.stages || 1));
      if (player.attackStage !== before) {
        this.enqueueMessage(`${def.name}で ${player.species.name}の こうげきが あがった！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし これいじょう あがらない！");
      }
    } else if (def.effect.type === "buffDefense") {
      const before = player.defenseStage || 0;
      player.defenseStage = this.clampStage(before + (def.effect.stages || 1));
      if (player.defenseStage !== before) {
        this.enqueueMessage(`${def.name}で ${player.species.name}の ぼうぎょが あがった！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし これいじょう あがらない！");
      }
    } else if (def.effect.type === "revive") {
      // リバイブ: 戦闘不能の味方を復活（パーティ内）
      const fainted = gameState.party.find((m) => m.species && m.currentHp <= 0 && m !== player);
      if (fainted) {
        const stats = calcStats(fainted.species, fainted.level || 1);
        fainted.currentHp = Math.floor(stats.maxHp * (def.effect.amount || 0.5));
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}で ${fainted.species.name}が ふっかつした！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし つかえなかった…");
      }
    } else if (def.effect.type === "cureStatus") {
      // 状態異常回復アイテム
      const targetStatus = def.effect.status;
      if (player.statusCondition && player.statusCondition === targetStatus) {
        const statusLabel = this.getStatusLabel(player.statusCondition);
        player.statusCondition = StatusCondition.NONE;
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}で ${statusLabel}が なおった！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし つかえなかった…");
      }
    } else if (def.effect.type === "fullRestore") {
      // パーフェクトケア: HP全回復+状態異常回復
      const stats = calcStats(player.species, player.level || 1);
      const maxHp = stats.maxHp;
      const before = player.currentHp;
      player.currentHp = maxHp;
      const healed = player.currentHp - before;
      if (player.statusCondition && player.statusCondition !== StatusCondition.NONE) {
        const statusLabel = this.getStatusLabel(player.statusCondition);
        player.statusCondition = StatusCondition.NONE;
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくし ${statusLabel}も なおった！`);
        itemConsumed = true;
      } else if (healed > 0) {
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくした！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし HPは まんたんだ！");
      }
      this.updateHud(true);
    } else if (def.effect.type === "buffSpeed") {
      // クイックステップ
      const before = player.speedStage || 0;
      player.speedStage = this.clampStage(before + (def.effect.stages || 1));
      if (player.speedStage !== before) {
        this.enqueueMessage(`${def.name}で ${player.species.name}の すばやさが あがった！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし これいじょう あがらない！");
      }
    } else if (def.effect.type === "buffAttackSpeed") {
      // げきりんキャンディ: 攻撃+1 & 速度+1
      const aBefore = player.attackStage || 0;
      const sBefore = player.speedStage || 0;
      player.attackStage = this.clampStage(aBefore + (def.effect.stages || 1));
      player.speedStage = this.clampStage(sBefore + (def.effect.stages || 1));
      if (player.attackStage !== aBefore || player.speedStage !== sBefore) {
        this.enqueueMessage(`${def.name}で ${player.species.name}の こうげきと すばやさが あがった！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし これいじょう あがらない！");
      }
    } else if (def.effect.type === "buffDefenseHeal") {
      // ガードチャーム: 防御+1 & HP回復
      const dBefore = player.defenseStage || 0;
      player.defenseStage = this.clampStage(dBefore + (def.effect.stages || 1));
      const stats = calcStats(player.species, player.level || 1);
      const healAmount = Math.floor(stats.maxHp * (def.effect.healPercent || 0.15));
      const hpBefore = player.currentHp;
      player.currentHp = Math.min(stats.maxHp, player.currentHp + healAmount);
      const healed = player.currentHp - hpBefore;
      if (player.defenseStage !== dBefore || healed > 0) {
        audioManager.playHeal();
        const msgs = [];
        if (player.defenseStage !== dBefore) msgs.push("ぼうぎょが あがった");
        if (healed > 0) msgs.push(`HPが ${healed} かいふくした`);
        this.enqueueMessage(`${def.name}で ${player.species.name}の ${msgs.join("！ ")}！`);
        itemConsumed = true;
        this.updateHud(true);
      } else {
        this.enqueueMessage("しかし これいじょう あがらない！");
      }
    } else if (def.effect.type === "healAllPP") {
      // エーテル・マックスエリクサー: 全技のPPを回復
      const moves = getMonsterMoves(player);
      let ppHealed = false;
      if (moves.length > 0) {
        if (!Array.isArray(player.pp)) player.pp = [];
        moves.forEach((move, i) => {
          const maxPp = move.pp || 10;
          const current = (player.pp[i] !== undefined) ? player.pp[i] : maxPp;
          const restoreAmount = def.effect.amount < 0 ? maxPp : (def.effect.amount || 10);
          const newPp = Math.min(maxPp, current + restoreAmount);
          if (newPp > current) {
            player.pp[i] = newPp;
            ppHealed = true;
          }
        });
      }
      if (ppHealed) {
        audioManager.playHeal();
        this.enqueueMessage(`${def.name}で ${player.species.name}の わざの PPが かいふくした！`);
        itemConsumed = true;
      } else {
        this.enqueueMessage("しかし PPは まんたんだ！");
      }
    } else {
      this.enqueueMessage("しかし なにも おきなかった…");
    }

    if (itemConsumed) {
      entry.quantity = Math.max(0, entry.quantity - 1);
      gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
    }

    this.state = BattleState.OPPONENT_TURN;
    this.clearMenuTexts();
    this.startOpponentTurn();
  }

  // ── 相手ターン ──

  startOpponentTurn() {
    const opponent = this.battle.opponent;
    const player = this.getActivePlayer();

    if (!player || player.currentHp <= 0 || opponent.currentHp <= 0) {
      if ((!player || player.currentHp <= 0) && !this.switchToNextAlive()) {
        this.handleDefeat();
      } else if (player && player.currentHp > 0) {
        // 相手が既に倒れている場合
        this.handleVictory();
      } else {
        // いれかえ成功 → 新しいターンへ
        this.startPlayerTurn();
      }
      return;
    }

    this.state = BattleState.OPPONENT_TURN;

    const statusResult = this.processTurnStartStatus(opponent);
    if (statusResult === "fainted") {
      this.handleVictory();
      return;
    }
    if (statusResult === "skip") {
      // 相手は状態異常で行動不能 → プレイヤーのターンへ
      this.startPlayerTurn();
      return;
    }

    const move = this.chooseOpponentMove(opponent, player);
    this._executeOpponentAttackDirect(opponent, player, move, () => {
      if (player.currentHp <= 0) {
        if (!this.switchToNextAlive()) {
          this.handleDefeat();
        } else {
          this.startPlayerTurn();
        }
      } else {
        this.startPlayerTurn();
      }
    });
  }

  chooseOpponentMove(opponent, player) {
    const moves = getMonsterMoves(opponent);
    if (moves.length === 0) return null;

    const oppStats = calcStats(opponent.species, opponent.level || 1);
    const playerStats = calcStats(player.species, player.level || 1);
    const oppHpRatio = Math.max(0, opponent.currentHp / (oppStats.maxHp || 1));
    const playerHpRatio = Math.max(0, player.currentHp / (playerStats.maxHp || 1));
    const isBossLevel = this.isBoss || this.isArena || this.isTrainer || this.isFinalBoss;

    const weighted = moves
      .map((move) => {
        const rawAccuracy = move.accuracy;
        const accuracyPercent = rawAccuracy === undefined || rawAccuracy === null
          ? 100
          : (rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy);
        const accuracy = Phaser.Math.Clamp(accuracyPercent / 100, 0.35, 1);
        const effectiveness = this.getEffectiveness(move.type, player.species.primaryType, player.species.secondaryType);
        const isStatus = move.category === "status";
        const basePower = move.power || 0;

        // PP残量チェック（PPが0なら選択しない）
        const moveIndex = moves.indexOf(move);
        const currentPp = Array.isArray(opponent.pp) && opponent.pp[moveIndex] !== undefined
          ? opponent.pp[moveIndex]
          : (move.pp || 10);
        if (currentPp <= 0) return { move, score: -1 };

        let score = 0;
        if (isStatus) {
          score = 10;

          // 回復技: HP50%以下で大幅加点、瀕死付近でさらに重視
          if (move.selfHealPercent) {
            if (oppHpRatio <= 0.25) score += 60;
            else if (oppHpRatio <= 0.45) score += 35;
            else if (oppHpRatio <= 0.7) score += 15;
            else score -= 5; // HP十分なら回復の価値低い
          }

          // バフ技: ステージが低いときに重視
          if (move.selfAttackStage) {
            const currentStage = opponent.attackStage || 0;
            if (currentStage < 2) score += 18 + (2 - currentStage) * 5;
            else score -= 5; // 既に十分強化済み
          }
          if (move.selfDefenseStage) {
            const currentStage = opponent.defenseStage || 0;
            if (currentStage < 2) score += 15 + (2 - currentStage) * 4;
            else score -= 5;
          }

          // デバフ技: 相手のステージが高いときやHP高いときに有効
          if (move.targetAttackStage) {
            const targetStage = player.attackStage || 0;
            score += targetStage > 0 ? 22 : 10;
            if (playerHpRatio > 0.6) score += 8; // 長期戦の見込みがあるとき効果的
          }
          if (move.targetDefenseStage) {
            const targetStage = player.defenseStage || 0;
            score += targetStage > 0 ? 18 : 8;
          }

          // 状態異常技: 相手に状態異常がなければ有効
          if (move.inflictStatus && !player.statusCondition) {
            score += 22;
            // まひはすばやさの高い相手に効果的
            if (move.inflictStatus === "PARALYSIS" && playerStats.speed > oppStats.speed) score += 10;
            // こおりは強力
            if (move.inflictStatus === "FREEZE") score += 8;
            // ねむりは強力
            if (move.inflictStatus === "SLEEP") score += 8;
          } else if (move.inflictStatus && player.statusCondition) {
            score -= 15; // 既に状態異常がある場合は避ける
          }
        } else {
          const estimatedDamage = this.calculateDamage(opponent, player, move).damage;
          const canFinish = estimatedDamage >= player.currentHp;
          const priorityBonus = (move.priority || 0) > 0 ? move.priority * 10 : 0;
          const statusBonus = move.inflictStatus && !player.statusCondition ? 10 : 0;

          // 倒しきれる場合は最優先
          const finishBonus = canFinish ? 60 : 0;

          // タイプ相性によるボーナス
          const effectivenessBonus = effectiveness >= 2 ? 25 : (effectiveness >= 1.5 ? 15 : (effectiveness < 1 ? -10 : 0));

          // STABボーナス
          const stabBonus = (move.type === opponent.species.primaryType || move.type === opponent.species.secondaryType) ? 8 : 0;

          score = estimatedDamage + 10 + basePower * 0.1 + effectivenessBonus + priorityBonus + statusBonus + finishBonus + stabBonus;

          // 相手がHPが少なければ優先度を使う技を優先
          if (playerHpRatio < 0.2 && (move.priority || 0) > 0) {
            score += 20;
          }
        }

        score *= accuracy;

        // ボス・トレーナー戦ではAIの精度を上げる（上位技をより確実に選ぶ）
        if (isBossLevel) {
          score *= 1.15;
        }

        return { move, score };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (weighted.length === 0) return moves[0] || null;

    // ボス/トレーナーは最善手を高確率で選ぶ、野生は多少ランダム
    if (isBossLevel) {
      // 60%でベスト、40%で次善
      const topCount = Math.min(2, weighted.length);
      if (topCount === 1 || Math.random() < 0.6) return weighted[0].move;
      return weighted[1].move;
    }

    // 野生: 上位3手からランダム
    const top = weighted.slice(0, Math.min(3, weighted.length));
    return Phaser.Utils.Array.GetRandom(top).move;
  }

  handleDefeat() {
    this.resultType = "lose";
    this.state = BattleState.RESULT;
    audioManager.playDefeat();
    const player = this.battle.player;
    this.enqueueMessage(`${player.species.name}は たおれてしまった…`);
    this.enqueueMessage("めのまえが まっくらに なった…");
  }

  // ── ダメージ計算 ──

  calculateDamage(attacker, defender, move) {
    const basePower = move.power || 0;
    if (basePower <= 0) return { damage: 0, effectiveness: 1, critical: false };

    const level = attacker.level || 1;
    const atkStats = calcStats(attacker.species, level);
    const defStats = calcStats(defender.species, defender.level || 1);

    const atkBase = atkStats.attack;
    const defBase = defStats.defense;

    const atkStage = attacker.attackStage || 0;
    const defStage = defender.defenseStage || 0;
    const atkMult = Math.max(0.25, 1 + atkStage * 0.25);
    const defMult = Math.max(0.25, 1 + defStage * 0.25);
    const burnMul = attacker.statusCondition === StatusCondition.BURN && move.category === "physical" ? BURN_ATTACK_MULTIPLIER : 1;

    const effectiveness = this.getEffectiveness(move.type, defender.species.primaryType, defender.species.secondaryType);
    const stab = (move.type === attacker.species.primaryType || move.type === attacker.species.secondaryType) ? STAB_BONUS : 1;
    const randomFactor = Phaser.Math.FloatBetween(DAMAGE_RANDOM_MIN, DAMAGE_RANDOM_MAX);
    
    let critRate = CRITICAL_HIT_RATE;
    if (attacker === this.battle?.player && (attacker.bond || 0) >= 90) {
      critRate += 0.1; // キズナによる急所率アップ
    }
    const critical = Math.random() < critRate;
    
    const criticalMul = critical ? CRITICAL_HIT_MULTIPLIER : 1;
    const weatherMul = this._getWeatherModifier(move.type);
    const abilityMod = this.getAbilityDamageModifier(attacker, defender, move);

    const damage =
      (((2 * level) / 5 + 2) * basePower * ((atkBase * atkMult * burnMul) / (defBase * defMult))) / 50 + 2;

    return {
      damage: Math.max(1, Math.round(damage * effectiveness * stab * randomFactor * criticalMul * weatherMul * abilityMod.attackerMul * abilityMod.defenderMul)),
      effectiveness,
      critical,
      weatherBoosted: weatherMul > 1.0,
      weatherWeakened: weatherMul < 1.0,
    };
  }

  getEffectiveness(attackType, primaryDefendType, secondaryDefendType) {
    const row = TYPE_EFFECTIVENESS[attackType];
    if (!row) return 1;
    const primary = row[primaryDefendType] || 1;
    const secondary = secondaryDefendType ? (row[secondaryDefendType] || 1) : 1;
    return primary * secondary;
  }

  getMonsterAbility(monster) {
    if (!monster || !monster.species) return null;
    return getAbilityById(monster.abilityId || monster.species.abilityId);
  }

  isLowHp(monster) {
    if (!monster || !monster.species) return false;
    const stats = calcStats(monster.species, monster.level || 1);
    return monster.currentHp <= Math.floor((stats.maxHp || 1) / 3);
  }

  getAbilityDamageModifier(attacker, defender, move) {
    let attackerMul = 1;
    let defenderMul = 1;

    const attackerAbility = this.getMonsterAbility(attacker);
    if (attackerAbility && this.isLowHp(attacker)) {
      if (attackerAbility.id === "BLAZE" && move.type === "FIRE") {
        attackerMul *= 1.25;
      } else if (attackerAbility.id === "TORRENT" && move.type === "WATER") {
        attackerMul *= 1.25;
      } else if (attackerAbility.id === "OVERGROW" && move.type === "GRASS") {
        attackerMul *= 1.25;
      } else if (attackerAbility.id === "MOTOR_DRIVE" && move.type === "ELECTRIC") {
        attackerMul *= 1.25;
      } else if (attackerAbility.id === "ICE_BODY" && move.type === "ICE") {
        attackerMul *= 1.25;
      }
    }

    const defenderAbility = this.getMonsterAbility(defender);
    if (defenderAbility) {
      if (defenderAbility.id === "STURDY") {
        defenderMul *= 0.9;
      } else if (defenderAbility.id === "INTIMIDATE") {
        defenderMul *= 0.92;
      } else if (defenderAbility.id === "SWIFT_SWIM") {
        defenderMul *= 0.9;
      }
    }

    return { attackerMul, defenderMul };
  }

  // ── HUD 更新 ──

  _truncateLabel(text, maxChars = 16) {
    const str = String(text || "");
    return str.length > maxChars ? `${str.slice(0, maxChars - 1)}…` : str;
  }

  updateHud(animate = false) {
    const player = this.battle.player;
    const opponent = this.battle.opponent;

    const playerStats = calcStats(player.species, player.level || 1);
    const oppStats = calcStats(opponent.species, opponent.level || 1);

    // タイプバッジ色マップ
    const typeBadgeColors = {
      FIRE: { bg: "#7c2d12", text: "#fb923c" },
      WATER: { bg: "#1e3a5f", text: "#60a5fa" },
      GRASS: { bg: "#14532d", text: "#4ade80" },
      NORMAL: { bg: "#374151", text: "#d1d5db" },
      ELECTRIC: { bg: "#713f12", text: "#facc15" },
      ICE: { bg: "#164e63", text: "#67e8f9" },
    };

    // プレイヤー情報
    const playerLabel = `${player.species.emoji || ""} ${player.species.name} Lv.${player.level}`;
    this.playerNameText.setText(this._truncateLabel(playerLabel, 16));
    this.playerHpText.setText(`${player.currentHp}/${playerStats.maxHp}`);

    // プレイヤータイプバッジ
    const pType = player.species.primaryType || "NORMAL";
    const pSecType = player.species.secondaryType || null;
    const pBadge = typeBadgeColors[pType] || typeBadgeColors.NORMAL;
    const pTypeLabel = pSecType ? `${pType}/${pSecType}` : pType;
    this.playerTypeBadge.setText(pTypeLabel);
    if (this.playerTypeBadge.getElement) {
      this.playerTypeBadge.getElement("text")?.setColor(pBadge.text);
      this.playerTypeBadge.getElement("background")?.setFillStyle(Phaser.Display.Color.HexStringToColor(pBadge.bg).color, 0.9);
    } else {
      this.playerTypeBadge.setColor(pBadge.text);
      this.playerTypeBadge.setBackgroundColor(pBadge.bg);
    }

    const pRatio = Math.max(0, player.currentHp / (playerStats.maxHp || 1));
    const pTargetWidth = 140 * pRatio;
    const pColor = pRatio > 0.5 ? 0x22c55e : pRatio > 0.25 ? 0xf97316 : 0xef4444;

    if (animate) {
      gsap.killTweensOf(this.playerHpBar);
      gsap.to(this.playerHpBar, {
        displayWidth: pTargetWidth,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          this.playerHpBar.setFillStyle(pColor, 1);
        },
      });
    } else {
      this.playerHpBar.displayWidth = pTargetWidth;
      this.playerHpBar.setFillStyle(pColor, 1);
    }

    // EXP バー
    const expRatio = player.nextLevelExp > 0 ? (player.exp || 0) / player.nextLevelExp : 0;
    const expTargetWidth = 136 * Math.min(1, expRatio);
    this.playerExpText.setText(`${player.exp || 0}/${player.nextLevelExp || "?"}`);
    if (animate) {
      gsap.killTweensOf(this.playerExpBar);
      gsap.to(this.playerExpBar, {
        displayWidth: expTargetWidth,
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      this.playerExpBar.displayWidth = expTargetWidth;
    }

    // ステージ表示
    const atkStg = player.attackStage || 0;
    const defStg = player.defenseStage || 0;
    const playerStatus = this.getStatusLabel(player.statusCondition);
    let stageStr = "";
    if (atkStg !== 0) stageStr += `攻${atkStg > 0 ? "+" : ""}${atkStg} `;
    if (defStg !== 0) stageStr += `防${defStg > 0 ? "+" : ""}${defStg}`;
    if (playerStatus) stageStr += `${stageStr ? " " : ""}状:${playerStatus}`;
    this.playerStageText.setText(stageStr.trim());

    // 相手情報
    const prefix = this.isBoss ? "👑 " : "";
    const opponentLabel = `${prefix}${opponent.species.emoji || ""} ${opponent.species.name} Lv.${opponent.level}`;
    this.opponentNameText.setText(this._truncateLabel(opponentLabel, 16));
    this.opponentHpText.setText(`${opponent.currentHp}/${oppStats.maxHp}`);
    const opponentStatus = this.getStatusLabel(opponent.statusCondition);
    this.opponentStatusText.setText(opponentStatus ? `状:${opponentStatus}` : "");

    // 相手タイプバッジ
    const oType = opponent.species.primaryType || "NORMAL";
    const oSecType = opponent.species.secondaryType || null;
    const oBadge = typeBadgeColors[oType] || typeBadgeColors.NORMAL;
    const oTypeLabel = oSecType ? `${oType}/${oSecType}` : oType;
    this.opponentTypeBadge.setText(oTypeLabel);
    if (this.opponentTypeBadge.getElement) {
      this.opponentTypeBadge.getElement("text")?.setColor(oBadge.text);
      this.opponentTypeBadge.getElement("background")?.setFillStyle(Phaser.Display.Color.HexStringToColor(oBadge.bg).color, 0.9);
    } else {
      this.opponentTypeBadge.setColor(oBadge.text);
      this.opponentTypeBadge.setBackgroundColor(oBadge.bg);
    }

    const oRatio = Math.max(0, opponent.currentHp / (oppStats.maxHp || 1));
    const oTargetWidth = 140 * oRatio;
    const oColor = oRatio > 0.5 ? 0x22c55e : oRatio > 0.25 ? 0xf97316 : 0xef4444;

    if (animate) {
      gsap.killTweensOf(this.opponentHpBar);
      gsap.to(this.opponentHpBar, {
        displayWidth: oTargetWidth,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          this.opponentHpBar.setFillStyle(oColor, 1);
        },
      });
    } else {
      this.opponentHpBar.displayWidth = oTargetWidth;
      this.opponentHpBar.setFillStyle(oColor, 1);
    }

    // ── 状態異常バッジ表示 ──
    this._updateStatusBadge("player", player.statusCondition);
    this._updateStatusBadge("opponent", opponent.statusCondition);
  }

  /** モンスター絵文字の下に状態異常アイコンを表示 */
  _updateStatusBadge(side, statusCondition) {
    const key = `${side}StatusBadge`;
    const keyBg = `${side}StatusBadgeBg`;

    // 既存のバッジを破棄
    if (this[key]) { this[key].destroy(); this[key] = null; }
    if (this[keyBg]) { this[keyBg].destroy(); this[keyBg] = null; }

    if (!statusCondition) return;

    const emoji = getStatusEmoji(statusCondition);
    const label = getStatusLabel(statusCondition);
    const color = getStatusColor(statusCondition);
    if (!emoji) return;

    const emojiText = side === "player" ? this.playerEmojiText : this.opponentEmojiText;
    const badgeX = emojiText.x;
    const badgeY = emojiText.y + 38;

    // 背景付きバッジ
    this[keyBg] = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(badgeX, badgeY, 58, 16, 8, 0x0f172a, 0.85)
        .setOrigin(0.5)
        .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.7)
        .setDepth(10)
      : this.add.rectangle(badgeX, badgeY, 58, 16, 0x0f172a, 0.85)
        .setOrigin(0.5)
        .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.7)
        .setDepth(10);

    this[key] = this.rexUI?.add?.label
      ? this.rexUI.add.label({
        x: badgeX,
        y: badgeY,
        text: this.add.text(0, 0, `${emoji}${label}`, {
          fontFamily: FONT.UI,
          fontSize: 10,
          color,
        }).setOrigin(0.5),
        align: "center",
      }).setDepth(11).layout()
      : this.add.text(badgeX, badgeY, `${emoji}${label}`, {
        fontFamily: FONT.UI,
        fontSize: 10,
        color,
      }).setOrigin(0.5).setDepth(11);

    // パルスアニメーション
    this.tweens.add({
      targets: [this[key], this[keyBg]],
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  // ── エモ・スキップ UI ──

  /** スキップ可能ヒントとプログレスバーの生成 */
  _createEmoSkipUI() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const indicatorY = height * 0.82;

    // ヒントテキスト（パルスアニメーション付き）
    this.emoSkipHintText = this.add.text(cx, indicatorY - 20, "⚡ Zキー長押しで エモ・スキップ ⚡", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#fbbf24",
      stroke: "#000000",
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 1, color: "#f59e0b", blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0.9).setDepth(100);

    this.tweens.add({
      targets: this.emoSkipHintText,
      alpha: 0.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // プログレスバー背景
    const barWidth = 160;
    const barHeight = 8;
    this.emoSkipBarBg = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(cx, indicatorY, barWidth, barHeight, 4, 0x1e293b, 0.8)
        .setOrigin(0.5).setStrokeStyle(1, 0x475569, 0.6).setDepth(100)
      : this.add.rectangle(cx, indicatorY, barWidth, barHeight, 0x1e293b, 0.8)
        .setOrigin(0.5).setStrokeStyle(1, 0x475569, 0.6).setDepth(100);

    // プログレスバー本体（左端から伸びる）
    this.emoSkipBar = this.rexUI?.add?.roundRectangle
      ? this.rexUI.add.roundRectangle(cx - barWidth / 2, indicatorY, 0, barHeight, 4, 0xfbbf24, 0.95)
        .setOrigin(0, 0.5).setDepth(101)
      : this.add.rectangle(cx - barWidth / 2, indicatorY, 0, barHeight, 0xfbbf24, 0.95)
        .setOrigin(0, 0.5).setDepth(101);

    this.emoSkipBarWidth = barWidth;
  }

  /** スキッププログレスバーを更新 (0.0 〜 1.0) */
  _updateEmoSkipProgress(ratio) {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    if (this.emoSkipBar) {
      this.emoSkipBar.displayWidth = this.emoSkipBarWidth * r;
      // 進捗に応じてバーの色を変化（黄→白）
      const g = Math.floor(191 + (255 - 191) * r);
      const b = Math.floor(36 + (255 - 36) * r);
      this.emoSkipBar.setFillStyle(Phaser.Display.Color.GetColor(251, g, b), 0.95);
    }
    // ヒントテキストの揺れ（ホールド中のみ）
    if (this.emoSkipHintText && r > 0) {
      this.emoSkipHintText.setScale(1 + r * 0.1);
    }
  }

  /** スキップUI要素を破棄 */
  _destroyEmoSkipUI() {
    if (this.emoSkipHintText) { this.emoSkipHintText.destroy(); this.emoSkipHintText = null; }
    if (this.emoSkipBarBg) { this.emoSkipBarBg.destroy(); this.emoSkipBarBg = null; }
    if (this.emoSkipBar) { this.emoSkipBar.destroy(); this.emoSkipBar = null; }
  }

  /** エモ・スキップ実行 — 一瞬でバトル結果を生成して終了 */
  executeEmoSkip() {
    this._destroyEmoSkipUI();
    this.clearMenuTexts();
    this.messageQueue = [];
    this.currentMessage = null;

    // 画面フラッシュ演出
    this.cameras.main.flash(300, 251, 191, 36, true);
    audioManager.playVictory();

    // 相手をワンパンで倒す演出
    const opponent = this.battle.opponent;
    const player = this.battle.player;
    opponent.currentHp = 0;
    this.updateHud(true);

    // 相手消滅エフェクト
    this._playDefeatEffect(this.opponentEmojiText);

    this.resultType = "win";
    this.state = BattleState.RESULT;

    this.enqueueMessage("⚡ エモ・スキップ！ 一瞬で けりがついた！");

    // 共通の報酬処理を利用
    this._processVictoryRewards(opponent, player);
  }

  startPlayerTurn() {
    const player = this.getActivePlayer();
    if (!player) {
      this.handleDefeat();
      return;
    }

    // 天候変化チェック（ターン開始時）
    this._tickWeather();

    const statusResult = this.processTurnStartStatus(player);
    if (statusResult === "fainted") {
      if (!this.switchToNextAlive()) {
        this.handleDefeat();
      } else {
        // 新しいモンスターのターンを開始
        this.showMainMenu(true);
      }
      return;
    }
    if (statusResult === "skip") {
      // プレイヤーは状態異常で行動不能 → 相手のターンへ
      this.startOpponentTurn();
      return;
    }

    this.state = BattleState.PLAYER_TURN;
    this.showMainMenu(true);
    if (this.currentMessage && this.currentMessage.text) {
      this.messageText.setText(this.currentMessage.text);
    } else {
      this.messageText.setText("どうする？");
    }
  }

  // ── 捕獲 ──

  attemptCatch(selectedBall = null) {
    const ball = selectedBall || this.getBestBall();
    if (!ball) {
      this.enqueueMessage("ボールがない！");
      return;
    }
    this.consumeBall(ball);

    const opponent = this.battle.opponent;
    const baseRate = opponent.species.catchRate || 0.4;
    const hpRatio = opponent.currentHp / (calcStats(opponent.species, opponent.level).maxHp || 1);
    let modifier = 0.8;
    if (hpRatio < 0.25) modifier = 1.6;
    else if (hpRatio < 0.5) modifier = 1.2;
    const streakBonus = this.isWildBattle ? 1 + Math.min(0.24, this.streakAtBattleStart * 0.02) : 1;
    const encounterBonus = opponent.catchRateMultiplier || 1;
    // インフィニティボール（catchBonus >= 100）は確定捕獲
    const isMasterBall = ball.bonus >= 100;
    const finalRate = isMasterBall ? 1.0 : Math.min(0.96, baseRate * modifier * ball.bonus * streakBonus * encounterBonus);
    const success = Math.random() < finalRate;

    this.clearMenuTexts();
    this.state = BattleState.ANIMATING;

    // ボール投げアニメーション
    this._playCatchAnimation(ball, success, opponent);
  }

  /** 捕獲ボール演出アニメーション */
  _playCatchAnimation(ball, success, opponent) {
    const { width } = this.scale;

    // ボール絵文字を決定
    const ballEmoji = ball.emoji || "⚪";
    const startX = width * 0.25;
    const startY = this.playerEmojiText.y;
    const targetX = this.opponentEmojiText.x;
    const targetY = this.opponentEmojiText.y;

    // ボール絵文字テキスト
    const ballText = this.add.text(startX, startY, ballEmoji, {
      fontFamily: "system-ui, emoji",
      fontSize: 28,
    }).setOrigin(0.5).setDepth(20);

    // 放物線で投げるアニメーション
    gsap.to(ballText, {
      x: targetX,
      y: targetY - 20,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: () => {
        // 放物線の頂点を表現
        const progress = (ballText.x - startX) / (targetX - startX);
        const arc = -Math.sin(progress * Math.PI) * 80;
        ballText.y = startY + (targetY - 20 - startY) * progress + arc;
      },
      onComplete: () => {
        // ボールが当たった！ フラッシュ
        this.cameras.main.flash(150, 255, 255, 255);
        audioManager.playHit();

        // 相手モンスターが吸い込まれるアニメ
        gsap.to(this.opponentEmojiText, {
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            // ボールが揺れるアニメーション
            const shakeCount = success ? 3 : Math.floor(Math.random() * 2) + 1;
            this._shakeAndResolveCatch(ballText, shakeCount, success, opponent);
          },
        });
      },
    });

    this.enqueueMessage(`${ball.name}を なげた！`);
  }

  /** ボールの揺れ & 捕獲結果 */
  _shakeAndResolveCatch(ballText, shakes, success, opponent) {
    let shakesDone = 0;

    const doShake = () => {
      if (shakesDone >= shakes) {
        // 揺れ終了 → 結果
        if (success) {
          this._completeCatchSuccess(ballText, opponent);
        } else {
          this._completeCatchFailure(ballText, opponent);
        }
        return;
      }

      shakesDone++;

      // ボール揺れ
      gsap.to(ballText, {
        rotation: 0.3,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
        onComplete: () => {
          ballText.rotation = 0;
          // 各揺れ後に少し待つ
          this.time.delayedCall(400, () => {
            this.enqueueMessage("…カチ");
            doShake();
          });
        },
      });
    };

    this.time.delayedCall(300, doShake);
  }

  /** 捕獲成功処理 */
  _completeCatchSuccess(ballText, opponent) {
    audioManager.playCatchSuccess();
    this.resultType = "catch";
    this.state = BattleState.RESULT;

    // ボールにキラキラエフェクト
    const sparkles = ["✨", "⭐", "🌟"];
    for (let i = 0; i < 5; i++) {
      const spark = this.add.text(
        ballText.x + (Math.random() - 0.5) * 60,
        ballText.y + (Math.random() - 0.5) * 40,
        sparkles[Math.floor(Math.random() * sparkles.length)],
        { fontFamily: "system-ui, emoji", fontSize: 16 + Math.random() * 12 }
      ).setOrigin(0.5).setDepth(21);

      gsap.to(spark, {
        y: spark.y - 30 - Math.random() * 20,
        alpha: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: "power2.out",
        onComplete: () => spark.destroy(),
      });
    }

    this.time.delayedCall(500, () => {
      ballText.destroy();
    });

    this.enqueueMessage(`カチッ…！ ${opponent.species.name} を つかまえた！ 🎊`);

    const newMon = {
      species: opponent.species,
      abilityId: opponent.abilityId || opponent.species.abilityId,
      level: opponent.level,
      exp: 0,
      nextLevelExp: 10 + 8 * opponent.level,
      currentHp: calcStats(opponent.species, opponent.level).maxHp,
      attackStage: 0,
      defenseStage: 0,
      moveIds: [],
      pp: (opponent.species.learnset || []).map(m => MOVES[m]?.pp || 10),
    };
    syncMonsterMoves(newMon);

    // パーティ上限（6体）チェック
    if (gameState.party.length >= PARTY_MAX) {
      if (!gameState.box) gameState.box = [];
      gameState.box.push(newMon);
      this.enqueueMessage(`パーティが いっぱいなので ボックスに おくった！`);
    } else {
      gameState.party.push(newMon);
    }
    gameState.markCaught(opponent.species.id);
    gameState.totalCatches++;

    const dailyCatchProgress = gameState.updateDailyChallengeProgress("CATCH", 1);
    if (dailyCatchProgress.completedNow) {
      const rewardResult = gameState.claimDailyChallengeReward();
      if (rewardResult.success) {
        this.enqueueMessage("🎯 本日のチャレンジ達成！");
        this.enqueueMessage(`ボーナスで ${rewardResult.rewardMoney}G を てにいれた！`);
      }
    }

    if (this.isWildBattle) {
      this.registerWildStreakWin();
    }

    this._grantHeldItemDrops(opponent);

    // 初回捕獲チュートリアル
    if (!gameState.storyFlags.tutorialCatchDone && gameState.totalCatches === 1) {
      this.enqueueMessage("📖 【はじめての捕獲！】おめでとう！ 仲間が増えたね！");
      this.enqueueMessage("📖 Xキーでメニューを開いて パーティの確認ができるよ。");
      this.enqueueMessage("📖 いろんなタイプの仲間を集めると 冒険が楽になるよ！");
    }
  }

  /** 捕獲失敗処理 */
  _completeCatchFailure(ballText, opponent) {
    audioManager.playCatchFail();

    // ボールが弾けるアニメーション
    gsap.to(ballText, {
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => ballText.destroy(),
    });

    // 相手モンスターが再出現
    gsap.killTweensOf(this.opponentEmojiText);
    const opponentSizeScale = Number.isFinite(opponent?.species?.sizeScale)
      ? Math.max(0.4, opponent.species.sizeScale)
      : 1;
    this.opponentEmojiText.setScale(opponentSizeScale).setAlpha(1);
    gsap.fromTo(this.opponentEmojiText, {
      scaleX: opponentSizeScale * 0.85,
      scaleY: opponentSizeScale * 0.85,
      alpha: 1,
    }, {
      scaleX: opponentSizeScale,
      scaleY: opponentSizeScale,
      alpha: 1,
      duration: 0.4,
      ease: "back.out",
    });

    this.enqueueMessage("ボールから でてきてしまった…");
    this.startOpponentTurn();
  }

  // ── いれかえメニュー ──

  showSwitchMenu(reset = true) {
    showSwitchMenu(this, reset);
  }

  handleSwitchMenuNavigation() {
    const switchable = this.switchableParty || [];
    if (switchable.length === 0) return;
    if (this.isNavUpPressed()) {
      this.selectedSwitchIndex = (this.selectedSwitchIndex - 1 + switchable.length) % switchable.length;
      audioManager.playCursor();
      this.showSwitchMenu(false);
    } else if (this.isNavDownPressed()) {
      this.selectedSwitchIndex = (this.selectedSwitchIndex + 1) % switchable.length;
      audioManager.playCursor();
      this.showSwitchMenu(false);
    }
  }

  performSwitch() {
    const switchable = this.switchableParty || [];
    if (switchable.length === 0 || this.selectedSwitchIndex >= switchable.length) return;

    const selected = switchable[this.selectedSwitchIndex];
    const currentPlayer = this.getActivePlayer();
    const currentIndex = gameState.party.indexOf(currentPlayer);
    const newIndex = selected.index;

    // パーティ内の位置を入れ替え（先頭に新しいモンスターを配置）
    if (currentIndex >= 0 && newIndex >= 0) {
      gameState.swapPartyOrder(0, newIndex);
      // activeBattle のプレイヤーを更新
      this.battle.player = gameState.party[0];
    }

    this.clearMenuTexts();
    this.enqueueMessage(`${currentPlayer.species.name}を ひっこめた！`);
    this.enqueueMessage(`ゆけ！ ${this.battle.player.species.name}！`);

    // 絵文字表示を更新
    setMonsterEmoji(
      this.playerEmojiText,
      this.battle.player.species.emoji || "?",
      this.battle.player.species.subEmoji,
    );
    this.playerEmojiText.setScale(Number.isFinite(this.battle.player?.species?.sizeScale)
      ? Math.max(0.4, this.battle.player.species.sizeScale)
      : 1);
    this.updateHud(false);

    // いれかえ後は相手が攻撃してくる（1ターン消費）
    this.state = BattleState.OPPONENT_TURN;
    this.startOpponentTurn();
  }

  // ── バトル終了 ──

  endBattle() {
    audioManager.stopBgm();
    gameState.setBattle(null);

    // GSAPアニメーションをすべて停止（破棄済みオブジェクトへの操作を防止）
    gsap.killTweensOf(this.playerEmojiText);
    gsap.killTweensOf(this.opponentEmojiText);
    gsap.killTweensOf(this.playerHpBar);
    gsap.killTweensOf(this.opponentHpBar);
    gsap.killTweensOf(this.playerExpBar);

    // キーリスナーを解除
    if (this.keys) {
      this.keys.Z.removeAllListeners("down");
      this.keys.Z.removeAllListeners("up");
      this.keys.ENTER.removeAllListeners("down");
      this.keys.ENTER.removeAllListeners("up");
      this.keys.SPACE.removeAllListeners("down");
      this.keys.SPACE.removeAllListeners("up");
      this.keys.X.removeAllListeners("down");
    }

    // タッチコントロールを破棄
    if (this.touchControls) {
      this.touchControls.destroy();
    }

    gameState.party.forEach((m) => {
      if (m && m.statusCondition) m.statusCondition = StatusCondition.NONE;
    });

    if (this.isWildBattle && !this.streakHandled && (this.resultType === "run" || this.resultType === "lose")) {
      if (typeof gameState.resetWildWinStreak === "function") {
        gameState.resetWildWinStreak();
      }
      this.streakHandled = true;
    }

    // 敗北時は回復してタウンに戻す（闘技場では現在地に留まる）
    if (this.resultType === "lose") {
      gameState.party.forEach((m) => {
        if (m.species) {
          m.currentHp = calcStats(m.species, m.level || 1).maxHp;
        }
      });
      if (!this.isArena) {
        gameState.setPlayerPosition(10, 10);
        gameState.currentMap = "EMOJI_TOWN";
      }
    }

    // バトル終了時に実績チェック
    gameState.checkAchievements();

    // バトル終了時にオートセーブ
    gameState.save();

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      if (this.resultType === "lose" && !this.isArena) {
        // WorldScene を完全再起動
        this.scene.stop(this.fromSceneKey || "WorldScene");
        this.scene.start("WorldScene", { mapKey: "EMOJI_TOWN", startX: 10, startY: 10 });
      } else {
        this.scene.resume(this.fromSceneKey || "WorldScene");
      }
    });
  }
}

