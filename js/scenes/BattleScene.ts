import { gameState } from "../state/gameState.ts";
import {
  MAX_MOVE_SLOTS,
  calcStats,
  getMonsterMaxStamina,
  getMonsterMoves,
} from "../data/monsters.ts";
import { getMoveStaminaCost } from "../data/moves.ts";
import { WEATHER } from "../data/mapRules.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { TouchControls } from "../ui/TouchControls.ts";
import {
  FONT,
  createMonsterEmojiDisplay,
  setMonsterEmoji,
  applyCanvasBrightness,
  drawPanel,
} from "../ui/UIHelper.ts";
import {
  BattleState,
  StatusCondition,
  WEATHER_INFO,
  clampStageValue,
  getStatusLabel,
  EMO_SKIP_LEVEL_GAP,
  EMO_SKIP_HOLD_MS,
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
import {
  createBattleStateActor,
  transitionBattleState,
} from "./battle/battleStateMachine.ts";
import { gsap } from "gsap";
import {
  addCameraBloom,
} from "../ui/FXHelper.ts";


// ── 抽出モジュール ──
import { performUseItem as performUseItemFn } from "./battle/battleItems.ts";
import {
  hasBallsInInventory as hasBallsFn,
  getBestBall as getBestBallFn,
  consumeBall as consumeBallFn,
  attemptCatch as attemptCatchFn,
} from "./battle/battleCatch.ts";
import {
  playAttackAnimation as playAttackAnimationFn,
  spawnHitParticles as spawnHitParticlesFn,
  showFloatingDamage as showFloatingDamageFn,
  showFloatingHeal as showFloatingHealFn,
  playDefeatEffect as playDefeatEffectFn,
  playLevelUpEffect as playLevelUpEffectFn,
  playEvolutionEffect as playEvolutionEffectFn,
} from "./battle/battleAnimFx.ts";
import {
  initializeElementStates as initializeElementStatesFn,
  isMoveHit as isMoveHitFn,
  tryApplyMoveStatus as tryApplyMoveStatusFn,
  applyElementReaction as applyElementReactionFn,
  updateElementStateAfterHit as updateElementStateAfterHitFn,
  processTurnStartStatus as processTurnStartStatusFn,
  handleStatusMove as handleStatusMoveFn,
  calculateDamage as calculateDamageFn,
  getEffectiveness as getEffectivenessFn,
  getMonsterAbility as getMonsterAbilityFn,
  isLowHp as isLowHpFn,
  getAbilityDamageModifier as getAbilityDamageModifierFn,
} from "./battle/battleCalcStatus.ts";
import {
  tryRun as tryRunFn,
  determineSpeedOrder as determineSpeedOrderFn,
  performPlayerMove as performPlayerMoveFn,
  executePlayerAttack as executePlayerAttackFn,
  executeOpponentTurnAfterPlayer as executeOpponentTurnAfterPlayerFn,
  executeOpponentAttackDirect as executeOpponentAttackDirectFn,
  getOpponentLabel as getOpponentLabelFn,
  startOpponentTurn as startOpponentTurnFn,
  chooseOpponentMove as chooseOpponentMoveFn,
  startPlayerTurn as startPlayerTurnFn,
  performSwitch as performSwitchFn,
} from "./battle/battleTurnFlow.ts";
import {
  handleVictory as handleVictoryFn,
  processVictoryRewards as processVictoryRewardsFn,
  grantHeldItemDrops as grantHeldItemDropsFn,
  handleDefeat as handleDefeatFn,
} from "./battle/battleResultRewards.ts";
import {
  startLearnMoveSelection as startLearnMoveSelectionFn,
  openNextLearnMoveSelection as openNextLearnMoveSelectionFn,
  renderLearnMoveReplaceMenu as renderLearnMoveReplaceMenuFn,
  confirmLearnMoveReplaceSelection as confirmLearnMoveReplaceSelectionFn,
  skipLearnMoveReplaceSelection as skipLearnMoveReplaceSelectionFn,
  handleLearnReplaceMenuNavigation as handleLearnReplaceMenuNavigationFn,
} from "./battle/battleLearnMove.ts";
import {
  createEmoSkipUI as createEmoSkipUIFn,
  updateEmoSkipProgress as updateEmoSkipProgressFn,
  destroyEmoSkipUI as destroyEmoSkipUIFn,
  executeEmoSkip as executeEmoSkipFn,
} from "./battle/battleEmoSkip.ts";
import {
  truncateLabel as truncateLabelFn,
  updateHud as updateHudFn,
  updateStatusBadge as updateStatusBadgeFn,
} from "./battle/battleHudUpdate.ts";

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

    this.battleStateActor = createBattleStateActor(BattleState.INTRO);
    this.state = this.battleStateActor.getSnapshot().value;
    this.events.once("shutdown", () => {
      if (this.battleStateActor) {
        this.battleStateActor.stop();
        this.battleStateActor = null;
      }
    });
    this.messageQueue = [];
    this.currentMessage = null;
    this.pendingActions = [];

    this.selectedMainIndex = 0;
    this.selectedMoveIndex = 0;
    this.selectedItemIndex = 0;
    this.selectedLearnReplaceIndex = 0;
    this.lastSelectedMainOption = "たたかう";
    this.lastSelectedMoveId = null;
    this.lastSelectedItemId = null;
    this.pendingLearnMoves = [];
    this.learnMoveMonster = null;
    this.currentLearnMove = null;

    this.isBoss = this.battle.isBoss || false;
    this.isArena = this.battle.isArena || false;
    this.isTrainer = this.battle.isTrainer || false;
    this.trainerName = this.battle.trainerName || "トレーナー";
    this.isFinalBoss = this.battle.isFinalBoss || false;
    this.resultType = null; // "win" | "lose" | "run" | "catch"
    this.isWildBattle = !this.battle.opponent?.trainer && !this.isBoss && !this.isArena && !this.isTrainer;
    this._reactionProcThisAction = false;

    // ── エモ・スキップ判定 ──
    // 野生バトルかつプレイヤーのレベルが相手より10以上高い場合に解禁
    const playerLevel = this.battle.player?.level || 1;
    const opponentLevel = this.battle.opponent?.level || 1;
    this.emoSkipAvailable = (gameState.gameplaySettings?.emoSkipEnabled !== false)
      && this.isWildBattle
      && (playerLevel - opponentLevel >= EMO_SKIP_LEVEL_GAP);
    this.emoSkipHoldTime = 0;
    this.emoSkipTriggered = false;
    this.emoSkipHoldThreshold = EMO_SKIP_HOLD_MS;

    // 天候初期化（マップ単位で保持された天候を引き継ぐ）
    this.weather = this._rollInitialWeather();
    this.weatherTurnCounter = 0;
    this.weatherDuration = 4 + Math.floor(Math.random() * 4); // 4〜7ターン

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Z,ENTER,SPACE,X,ESC,W,A,S,D");

    // タッチコントロール
    this.touchControls = new TouchControls(this);
    this.touchControls.create();
    this._touchNavCooldown = 0;

    audioManager.applySettings(gameState.audioSettings || {});
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);

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

  setBattleState(nextState) {
    if (!this.battleStateActor) {
      this.state = nextState;
      return this.state;
    }
    try {
      this.state = transitionBattleState(this.battleStateActor, nextState);
    } catch (error) {
      console.warn("BattleScene: 状態遷移に失敗しました", error);
      this.state = nextState;
    }
    return this.state;
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
        fontFamily: FONT.EMOJI,
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
        fontFamily: FONT.EMOJI,
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
      this.handleConfirm();
    };
    this.keys.Z.on("down", handleConfirmDown);
    this.keys.ENTER.on("down", handleConfirmDown);
    this.keys.SPACE.on("down", handleConfirmDown);
    this.keys.X.on("down", () => this.handleCancel());
    this.keys.ESC.on("down", () => this.handleCancel());

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

  hasBallsInInventory() { return hasBallsFn(); }


  getBestBall() { return getBestBallFn(); }


  consumeBall(ball) { consumeBallFn(ball); }


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
      const staminaCost = getMoveStaminaCost(selectedMove);
      const maxStamina = getMonsterMaxStamina();
      const currentStamina = Number.isFinite(this.battle.player?.stamina)
        ? Math.floor(this.battle.player.stamina)
        : maxStamina;
      if (currentStamina < staminaCost) {
        this.enqueueMessage("スタミナが たりない…");
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
    } else if (this.state === BattleState.PLAYER_SELECT_LEARN_REPLACE) {
      audioManager.playConfirm();
      this._confirmLearnMoveReplaceSelection();
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
    } else if (this.state === BattleState.PLAYER_SELECT_LEARN_REPLACE) {
      audioManager.playCancel();
      this._skipLearnMoveReplaceSelection();
    }
  }

  update(time, delta) {
    this._updateMessageFastForward(delta);

    // ── エモ・スキップ 自動判定 ──
    if (this.emoSkipAvailable && !this.emoSkipTriggered && this._isEmoSkipPhase()) {
      this.emoSkipTriggered = true;
      this.executeEmoSkip();
      return;
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
    else if (this.state === BattleState.PLAYER_SELECT_LEARN_REPLACE) this.handleLearnReplaceMenuNavigation();
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
    } else if (this.state === BattleState.PLAYER_SELECT_LEARN_REPLACE) {
      const moveCount = this.learnMoveMonster?.moveIds?.length || 0;
      const optionsCount = Math.min(MAX_MOVE_SLOTS, moveCount) + 1;
      if (optionsCount > 0) {
        this.selectedLearnReplaceIndex = (this.selectedLearnReplaceIndex + dir + optionsCount) % optionsCount;
        audioManager.playCursor();
        this._renderLearnMoveReplaceMenu();
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

  _initializeElementStates() { initializeElementStatesFn(this); }


  _updateElementStatesAtTurnStart(_monster) { /* battleCalcStatus内で直接呼出済み */ }


  isMoveHit(move, user = null) { return isMoveHitFn(move, user); }


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

  handleLearnReplaceMenuNavigation() { handleLearnReplaceMenuNavigationFn(this); }


  _startLearnMoveSelection(monster, learnedMoves) { startLearnMoveSelectionFn(this, monster, learnedMoves); }


  _openNextLearnMoveSelection() { return openNextLearnMoveSelectionFn(this); }


  _renderLearnMoveReplaceMenu() { renderLearnMoveReplaceMenuFn(this); }


  _confirmLearnMoveReplaceSelection() { confirmLearnMoveReplaceSelectionFn(this); }


  _skipLearnMoveReplaceSelection() { skipLearnMoveReplaceSelectionFn(this); }


  // ── 逃走 ──

  tryRun() { tryRunFn(this); }


  // ── 攻撃演出 ──

  playAttackAnimation(attacker, target, move, onComplete) { playAttackAnimationFn(this, attacker, target, move, onComplete); }


  spawnHitParticles(x, y, moveType) { spawnHitParticlesFn(this, x, y, moveType); }


  showFloatingDamage(x, y, damage, isSuper = false, isCritical = false) { showFloatingDamageFn(this, x, y, damage, isSuper, isCritical); }


  /** 回復数値のフローティング表示 */
  showFloatingHeal(x, y, amount) { showFloatingHealFn(this, x, y, amount); }


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

  tryApplyMoveStatus(target, move) { return tryApplyMoveStatusFn(target, move); }


  _applyElementReaction(attacker, defender, move, baseDamage) { return applyElementReactionFn(this, attacker, defender, move, baseDamage); }


  _updateElementStateAfterHit(attacker, defender, move) { updateElementStateAfterHitFn(this, attacker, defender, move); }


  /**
   * ターン開始時の状態異常処理。
   * @returns {"act" | "skip" | "fainted"}
   *   - "act"     : 行動可能
   *   - "skip"    : 行動不能（まひ・こおり・ねむり等）だがHP残存
   *   - "fainted" : 状態異常ダメージで戦闘不能
   */
  processTurnStartStatus(monster) { return processTurnStartStatusFn(this, monster); }


  // ── プレイヤー攻撃 ──

  /** 素早さに基づく行動順を決定する */
  _determineSpeedOrder(playerMove) { return determineSpeedOrderFn(this, playerMove); }


  performPlayerMove() { performPlayerMoveFn(this); }


  /** プレイヤーの攻撃を実行する内部メソッド */
  _executePlayerAttack(player, opponent, move, onComplete) { executePlayerAttackFn(this, player, opponent, move, onComplete); }


  /** 相手の攻撃をプレイヤー先攻後に実行する */
  _executeOpponentTurnAfterPlayer() { executeOpponentTurnAfterPlayerFn(this); }


  /** 相手の攻撃を直接実行（速度逆転時にも使用） */
  _executeOpponentAttackDirect(opponent, player, move, onComplete) { executeOpponentAttackDirectFn(this, opponent, player, move, onComplete); }


  /** 相手のラベルを取得（ジムリーダー/トレーナー/闘技場/野生） */
  _getOpponentLabel() { return getOpponentLabelFn(this); }


  handleStatusMove(user, target, move, isPlayer) { handleStatusMoveFn(this, user, target, move, isPlayer); }


  handleVictory() { handleVictoryFn(this); }


  /** 勝利/スキップ共通の報酬処理（経験値・レベルアップ・進化・お金・連勝） */
  _processVictoryRewards(opponent, leader) { processVictoryRewardsFn(this, opponent, leader); }


  _grantHeldItemDrops(opponent) { grantHeldItemDropsFn(this, opponent); }


  /** 倒れたモンスターの消滅エフェクト */
  _playDefeatEffect(emojiText) { playDefeatEffectFn(this, emojiText); }


  /** レベルアップのキラキラエフェクト（PostFX + パーティクルバースト） */
  _playLevelUpEffect(emojiText) { playLevelUpEffectFn(this, emojiText); }


  /** 進化の演出 — 光のバーストと絵文字チェンジ（強化版） */
  _playEvolutionEffect(emojiText, newEmoji, newSubEmojis = null, targetScale = 1) { playEvolutionEffectFn(this, emojiText, newEmoji, newSubEmojis, targetScale); }


  // ── アイテム使用 ──

  performUseItem() { performUseItemFn(this); }


  // ── 相手ターン ──

  startOpponentTurn() { startOpponentTurnFn(this); }


  chooseOpponentMove(opponent, player) { return chooseOpponentMoveFn(this, opponent, player); }


  handleDefeat() { handleDefeatFn(this); }


  // ── ダメージ計算 ──

  calculateDamage(attacker, defender, move) { return calculateDamageFn(this, attacker, defender, move); }


  getEffectiveness(attackType, primaryDefendType, secondaryDefendType) { return getEffectivenessFn(attackType, primaryDefendType, secondaryDefendType); }


  getMonsterAbility(monster) { return getMonsterAbilityFn(monster); }


  isLowHp(monster) { return isLowHpFn(monster); }


  getAbilityDamageModifier(attacker, defender, move) { return getAbilityDamageModifierFn(attacker, defender, move); }


  // ── HUD 更新 ──

  _truncateLabel(text, maxChars = 16) { return truncateLabelFn(text, maxChars); }


  updateHud(animate = false) { updateHudFn(this, animate); }


  /** モンスター絵文字の下に状態異常アイコンを表示 */
  _updateStatusBadge(side, statusCondition) { updateStatusBadgeFn(this, side, statusCondition); }


  // ── エモ・スキップ UI ──

  /** スキップ可能ヒントとプログレスバーの生成 */
  _createEmoSkipUI() { createEmoSkipUIFn(this); }


  /** スキッププログレスバーを更新 (0.0 〜 1.0) */
  _updateEmoSkipProgress(ratio) { updateEmoSkipProgressFn(this, ratio); }


  /** スキップUI要素を破棄 */
  _destroyEmoSkipUI() { destroyEmoSkipUIFn(this); }


  /** エモ・スキップ実行 — 一瞬でバトル結果を生成して終了 */
  executeEmoSkip() { executeEmoSkipFn(this); }


  startPlayerTurn() { startPlayerTurnFn(this); }


  // ── 捕獲 ──

  attemptCatch(selectedBall = null) { attemptCatchFn(this, selectedBall); }






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

  performSwitch() { performSwitchFn(this); }


  // ── バトル終了 ──

  endBattle() {
    audioManager.stopBgm();
    gameState.updateBattleWinStreak(this.resultType === "win");
    gameState.setLastBattleResult({
      isTrainer: !!this.isTrainer,
      trainerBattleKey: this.battle?.trainerBattleKey || null,
      storyBattleKey: this.battle?.storyBattleKey || null,
      won: this.resultType === "win",
    });
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
      this.keys.ESC.removeAllListeners("down");
    }

    // タッチコントロールを破棄
    if (this.touchControls) {
      this.touchControls.destroy();
    }

    gameState.party.forEach((m) => {
      if (m && m.statusCondition) m.statusCondition = StatusCondition.NONE;
    });

    // 敗北時は回復して最後に回復した地点へ戻す（闘技場では現在地に留まる）
    if (this.resultType === "lose") {
      gameState.party.forEach((m) => {
        if (m.species) {
          m.currentHp = calcStats(m.species, m.level || 1).maxHp;
        }
      });
      if (!this.isArena) {
        const respawn = gameState.getLastHealPoint();
        gameState.setPlayerPosition(respawn.x, respawn.y);
        gameState.currentMap = respawn.mapKey;
      }
    }

    // バトル終了時に実績チェック
    gameState.checkAchievements();

    // バトル終了時にオートセーブ
    if (gameState.isAutoSaveEnabled()) {
      gameState.save();
    }

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      if (this.resultType === "lose" && !this.isArena) {
        const respawn = gameState.getLastHealPoint();
        // WorldScene を完全再起動
        this.scene.stop(this.fromSceneKey || "WorldScene");
        this.scene.start("WorldScene", { mapKey: respawn.mapKey, startX: respawn.x, startY: respawn.y });
      } else {
        this.scene.resume(this.fromSceneKey || "WorldScene");
      }
    });
  }
}

