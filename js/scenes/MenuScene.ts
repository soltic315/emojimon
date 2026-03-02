/**
 * MenuScene - フィールドから呼び出せるゲーム内メニュー
 * パーティ / アイテム / ずかん / プレイヤー情報 / 設定
 */
import { gameState, PARTY_CAPACITY } from "../state/gameState.ts";
import { getItemById } from "../data/items.ts";
import { calcStats, getMonsterMoves } from "../data/monsters.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { applyCanvasBrightness } from "../ui/UIHelper.ts";
import { GAME_KEYBOARD_COLS } from "../ui/gameKeyboard.ts";
import { NAV_REPEAT_INITIAL_DELAY_MS, NAV_REPEAT_INTERVAL_MS } from "../ui/inputConstants.ts";
import { MENU_ITEMS, GUIDE_PAGES } from "./menu/menuConstants.ts";
import {
  renderMainMenu,
  renderSubMenu,
  renderPartyView,
  showPartyMessage,
  renderBagView,
  renderBagTargetView,
  showBagMessage,
  showBoxMessage,
  renderPokedexView,
  renderTrainerView,
  renderGuideView,
  renderSettingsView,
} from "./menu/menuViews.ts";
import { handleVerticalRepeatInput } from "./menu/menuSceneInput.ts";
import {
  handleNicknameShortcut,
  openNicknameKeyboard,
  handleNicknameKeyboardNavigation,
  confirmNicknameInput,
  deleteNicknameChar,
  updateNicknameInputDisplay,
  updateNicknameKeyboardDisplay,
  closeNicknameKeyboard,
} from "./menu/menuSceneNickname.ts";
import {
  cycleBattleSpeed,
  toggleGameplayFlag,
  persistSettingsChanges,
  adjustVolume,
  handleSettingsAction,
  executeDeleteSave,
  showCenterMessage,
} from "./menu/menuSceneSettings.ts";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  init(data) {
    this.fromScene = data.from || "WorldScene";
  }

  create() {
    const { width, height } = this.scale;
    this.menuIndex = 0;
    this.subMenuActive = false;
    this.subMenuType = null;
    this.subMenuIndex = 0;
    this.partySwapMode = false;
    this.partySwapIndex = -1;
    this.partyFusionMode = false;
    this.partyFusionIndex = -1;
    this.boxPendingIndex = -1; // ボックス交換待ちのインデックス
    this.mainNavHoldDirection = 0;
    this.mainNavNextRepeatAt = 0;
    this.subNavHoldDirection = 0;
    this.subNavNextRepeatAt = 0;
    this.navRepeatDelayMs = NAV_REPEAT_INITIAL_DELAY_MS;
    this.navRepeatIntervalMs = NAV_REPEAT_INTERVAL_MS;
    this.guideTocIndex = 0;
    this.settingsConfirmActive = false;
    this.settingsConfirmIndex = 0;
    this.nicknameInputActive = false;
    this.nicknameTargetMonster = null;
    this.nicknameInput = "";
    this.nicknameKeyboardIndex = 0;
    this.nicknameKeyboardCols = GAME_KEYBOARD_COLS;
    this.nicknameKeyboardKeys = [];
    this.nicknameKeyboardButtons = [];
    this.nicknamePanel = null;
    this.nicknameInputText = null;
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);

    // 半透明オーバーレイ
    this.add.rectangle(width / 2, height / 2, width, height, 0x02040a, 0.62);
    const overlayGradient = this.add.graphics();
    overlayGradient.fillGradientStyle(0x0b1220, 0x0f172a, 0x02040a, 0x030712, 0.28);
    overlayGradient.fillRect(0, 0, width, height);
    const overlayGlow = this.add.graphics();
    overlayGlow.fillStyle(0x1a2638, 0.2);
    overlayGlow.fillCircle(width / 2, height / 2, Math.max(width, height) * 0.62);
    overlayGlow.setBlendMode(Phaser.BlendModes.ADD);

    // メインメニューパネル（右側）
    this.menuPanel = this.add.container(0, 0);
    this._renderMainMenu();

    // サブパネル（左側）
    this.subPanel = this.add.container(0, 0);

    // 入力
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-Z", () => this.handleConfirm());
    this.input.keyboard.on("keydown-ENTER", () => this.handleConfirm());
    this.input.keyboard.on("keydown-SPACE", () => this.handleConfirm());
    this.input.keyboard.on("keydown-X", () => this.handleCancel());
    this.input.keyboard.on("keydown-ESC", () => this.handleCancel());
    this.input.keyboard.on("keydown-C", () => this.handlePartyFusionShortcut());
    this.input.keyboard.on("keydown-N", () => this.handleNicknameShortcut());
  }

  update() {
    if (this.nicknameInputActive) {
      this._handleNicknameKeyboardNavigation();
      return;
    }

    if (this.subMenuActive) {
      this._handleSubMenuNav();
    } else {
      this._handleMainMenuNav();
    }
  }

  // ── メインメニュー描画 ──
  _renderMainMenu() {
    renderMainMenu(this);
  }

  _handleMainMenuNav() {
    this._handleVerticalRepeatInput({
      isUpDown: Phaser.Input.Keyboard.JustDown(this.cursors.up),
      isDownDown: Phaser.Input.Keyboard.JustDown(this.cursors.down),
      isUpHeld: this.cursors.up.isDown,
      isDownHeld: this.cursors.down.isDown,
      holdDirectionKey: "mainNavHoldDirection",
      nextRepeatAtKey: "mainNavNextRepeatAt",
      onUp: () => {
        this.menuIndex = (this.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        this._renderMainMenu();
      },
      onDown: () => {
        this.menuIndex = (this.menuIndex + 1) % MENU_ITEMS.length;
        this._renderMainMenu();
      },
    });
  }

  handleConfirm() {
    if (this.nicknameInputActive) {
      this._confirmNicknameInput();
      return;
    }

    audioManager.playConfirm();
    if (this.subMenuActive) {
      this._handleSubMenuConfirm();
      return;
    }

    const action = MENU_ITEMS[this.menuIndex].action;
    switch (action) {
      case "party":
        this.openSubMenu("party");
        break;
      case "box":
        this.openSubMenu("box");
        break;
      case "bag":
        this.openSubMenu("bag");
        break;
      case "pokedex":
        this.openSubMenu("pokedex");
        break;
      case "achievements":
        this.openSubMenu("achievements");
        break;
      case "trainer":
        this.openSubMenu("trainer");
        break;
      case "quest":
        this.openSubMenu("quest");
        break;
      case "globalMap":
        this.openSubMenu("globalMap");
        break;
      case "guide":
        this.openSubMenu("guide");
        break;
      case "save": {
        const ok = gameState.save();
        if (ok) {
          audioManager.playSave();
          this._showCenterMessage("セーブしました！", "#86efac");
        } else {
          audioManager.playCancel();
          this._showCenterMessage("セーブに失敗しました…", "#fca5a5");
        }
        break;
      }
      case "settings":
        this.openSubMenu("settings");
        break;
    }
  }

  handleCancel() {
    if (this.nicknameInputActive) {
      audioManager.playCancel();
      this._closeNicknameKeyboard(false);
      return;
    }

    if (this.settingsConfirmActive) {
      audioManager.playCancel();
      this.settingsConfirmActive = false;
      this.settingsConfirmIndex = 0;
      this._renderSubMenu();
      return;
    }

    audioManager.playCancel();
    if (this.partyFusionMode) {
      this.partyFusionMode = false;
      this.partyFusionIndex = -1;
      this._renderSubMenu();
      return;
    }
    if (this.partySwapMode) {
      this.partySwapMode = false;
      this.partySwapIndex = -1;
      this._renderSubMenu();
      return;
    }
    // バッグターゲット選択を戻す
    if (this.subMenuType === "bag_target") {
      this.subMenuType = "bag";
      this._pendingItemIndex = -1;
      this.subMenuIndex = 0;
      this._renderSubMenu();
      return;
    }
    // ボックス交換選択を戻す
    if (this.subMenuType === "box_swap") {
      this.subMenuType = "box";
      this.boxPendingIndex = -1;
      this.subMenuIndex = 0;
      this._renderSubMenu();
      return;
    }
    if (this.subMenuType === "guide_detail") {
      this.subMenuType = "guide_toc";
      this.subMenuIndex = this.guideTocIndex || 0;
      this._renderSubMenu();
      return;
    }
    if (this.subMenuActive) {
      this.subMenuActive = false;
      this.subMenuType = null;
      this.subPanel.removeAll(true);
      return;
    }
    this.closeMenu();
  }

  closeMenu() {
    this.scene.stop();
    this.scene.resume(this.fromScene);
  }

  // ── サブメニュー ──
  openSubMenu(type) {
    this.subMenuActive = true;
    this.settingsConfirmActive = false;
    this.settingsConfirmIndex = 0;
    if (type === "guide") {
      this.subMenuType = "guide_toc";
      this.subMenuIndex = this.guideTocIndex || 0;
    } else {
      this.subMenuType = type;
      this.subMenuIndex = 0;
    }
    this._renderSubMenu();
  }

  _handleSubMenuNav() {
    if (this.settingsConfirmActive) {
      this._handleVerticalRepeatInput({
        isUpDown: Phaser.Input.Keyboard.JustDown(this.cursors.up),
        isDownDown: Phaser.Input.Keyboard.JustDown(this.cursors.down),
        isUpHeld: this.cursors.up.isDown,
        isDownHeld: this.cursors.down.isDown,
        holdDirectionKey: "subNavHoldDirection",
        nextRepeatAtKey: "subNavNextRepeatAt",
        onUp: () => {
          this.settingsConfirmIndex = 0;
          this._renderSubMenu();
        },
        onDown: () => {
          this.settingsConfirmIndex = 1;
          this._renderSubMenu();
        },
      });
      return;
    }

    this._handleVerticalRepeatInput({
      isUpDown: Phaser.Input.Keyboard.JustDown(this.cursors.up),
      isDownDown: Phaser.Input.Keyboard.JustDown(this.cursors.down),
      isUpHeld: this.cursors.up.isDown,
      isDownHeld: this.cursors.down.isDown,
      holdDirectionKey: "subNavHoldDirection",
      nextRepeatAtKey: "subNavNextRepeatAt",
      onUp: () => {
        this.subMenuIndex = Math.max(0, this.subMenuIndex - 1);
        this._renderSubMenu();
      },
      onDown: () => {
        this.subMenuIndex++;
        this._renderSubMenu();
      },
    });
  }

  _handleSubMenuConfirm() {
    if (this.settingsConfirmActive) {
      if (this.settingsConfirmIndex === 0) {
        this.settingsConfirmActive = false;
        this.settingsConfirmIndex = 0;
        this._executeDeleteSave();
        return;
      }
      this.settingsConfirmActive = false;
      this.settingsConfirmIndex = 0;
      this._renderSubMenu();
      return;
    }

    if (this.subMenuType === "party") {
      this._handlePartyConfirm();
    } else if (this.subMenuType === "box") {
      this._handleBoxConfirm();
    } else if (this.subMenuType === "box_swap") {
      this._handleBoxSwapConfirm();
    } else if (this.subMenuType === "bag") {
      this._handleBagConfirm();
    } else if (this.subMenuType === "bag_target") {
      this._handleBagTargetConfirm();
    } else if (this.subMenuType === "guide_toc" || this.subMenuType === "guide_detail") {
      this._handleGuideConfirm();
    } else if (this.subMenuType === "settings") {
      this._handleSettingsAction();
    }
  }

  _renderSubMenu() {
    renderSubMenu(this);
  }

  // ── パーティ画面 ──
  _renderPartyView() {
    renderPartyView(this);
  }

  _handlePartyConfirm() {
    if (gameState.party.length < 2) return;

    if (this.partyFusionMode) {
      this.partyFusionMode = false;
      this.partyFusionIndex = -1;
    }

    if (!this.partySwapMode) {
      this.partySwapMode = true;
      this.partySwapIndex = this.subMenuIndex;
      this._renderSubMenu();
    } else {
      if (this.subMenuIndex !== this.partySwapIndex) {
        gameState.swapPartyOrder(this.partySwapIndex, this.subMenuIndex);
        audioManager.playConfirm();
      }
      this.partySwapMode = false;
      this.partySwapIndex = -1;
      this._renderSubMenu();
    }
  }

  handlePartyFusionShortcut() {
    if (!this.subMenuActive || this.subMenuType !== "party") return;
    this._handlePartyFusionConfirm();
  }

  _handlePartyFusionConfirm() {
    if (gameState.party.length < 2) {
      this._showPartyMessage("合成できるモンスターが いない…");
      return;
    }

    if (this.partySwapMode) {
      this.partySwapMode = false;
      this.partySwapIndex = -1;
    }

    if (!this.partyFusionMode) {
      this.partyFusionMode = true;
      this.partyFusionIndex = this.subMenuIndex;
      audioManager.playConfirm();
      this._renderSubMenu();
      return;
    }

    if (this.subMenuIndex === this.partyFusionIndex) {
      this._showPartyMessage("ベースとは別の素材を選んでください");
      return;
    }

    const beforeDiscoveries = gameState.getFusionDiscoveries().length;
    const result = gameState.fusePartyMonsters(this.partyFusionIndex, this.subMenuIndex);
    const afterDiscoveries = gameState.getFusionDiscoveries().length;
    this.partyFusionMode = false;
    this.partyFusionIndex = -1;

    if (!result?.success) {
      this._showPartyMessage(result?.reason || "合成に失敗した…");
      this._renderSubMenu();
      return;
    }

    this.subMenuIndex = Phaser.Math.Clamp(result.baseIndex || 0, 0, gameState.party.length - 1);
    audioManager.playHeal();
    if (result.transformed) {
      this._showPartyMessage(
        `${result.baseName}が ${result.materialName}と共鳴し ${result.resultName}に変化！${afterDiscoveries > beforeDiscoveries ? "（新レシピ発見）" : ""}`,
      );
    } else {
      this._showPartyMessage(
        `${result.baseName}に ${result.materialName}を合成！ Lv+${result.levelUps} / HP+${result.healed}`,
      );
    }
    this._renderSubMenu();
  }

  _showPartyMessage(text) {
    showPartyMessage(this, text);
  }

  // ── ニックネーム変更 ──
  handleNicknameShortcut() {
    handleNicknameShortcut(this);
  }

  _openNicknameKeyboard(monster) {
    openNicknameKeyboard(this, monster);
  }

  _handleNicknameKeyboardNavigation() {
    handleNicknameKeyboardNavigation(this);
  }

  _confirmNicknameInput() {
    confirmNicknameInput(this);
  }

  _deleteNicknameChar() {
    deleteNicknameChar(this);
  }

  _updateNicknameInputDisplay() {
    updateNicknameInputDisplay(this);
  }

  _updateNicknameKeyboardDisplay() {
    updateNicknameKeyboardDisplay(this);
  }

  _closeNicknameKeyboard(applyChanges) {
    closeNicknameKeyboard(this, applyChanges);
  }

  // ── ボックス画面 ──
  _handleBoxConfirm() {
    const box = gameState.box || [];
    if (box.length === 0) return;
    const boxIndex = this.subMenuIndex;
    if (boxIndex < 0 || boxIndex >= box.length) return;
    const partyCount = (gameState.party || []).length;

    if (partyCount < PARTY_CAPACITY) {
      // 空きがある → そのままパーティに追加
      const mon = box[boxIndex];
      const ok = gameState.moveBoxToParty(boxIndex);
      if (ok) {
        audioManager.playConfirm();
        this._showBoxMessage(`${mon.species?.name ?? "？"}を パーティに加えた！`);
        // インデックスが範囲を超えないよう調整
        this.subMenuIndex = Math.min(this.subMenuIndex, Math.max(0, (gameState.box || []).length - 1));
        this._renderSubMenu();
      }
    } else {
      // パーティが満員 → 交換先選択へ
      this.boxPendingIndex = boxIndex;
      this.subMenuType = "box_swap";
      this.subMenuIndex = 0;
      audioManager.playCursor();
      this._renderSubMenu();
    }
  }

  _handleBoxSwapConfirm() {
    const partyIndex = this.subMenuIndex;
    const boxIndex = this.boxPendingIndex;
    if (boxIndex < 0 || partyIndex < 0) return;
    if (partyIndex >= (gameState.party || []).length) return;

    const boxMon = (gameState.box || [])[boxIndex];
    const partyMon = (gameState.party || [])[partyIndex];
    const ok = gameState.swapBoxWithParty(boxIndex, partyIndex);
    if (ok) {
      audioManager.playConfirm();
      this._showBoxMessage(
        `${boxMon?.species?.name ?? "？"} と ${partyMon?.species?.name ?? "？"} を 入れ替えた！`,
      );
      this.subMenuType = "box";
      this.boxPendingIndex = -1;
      this.subMenuIndex = 0;
      this._renderSubMenu();
    } else {
      this._showBoxMessage("入れ替えできなかった…");
    }
  }

  _showBoxMessage(text) {
    showBoxMessage(this, text);
  }
  _renderBagView() {
    renderBagView(this);
  }

  /** バッグで Z を押してアイテム使用を開始 */
  _handleBagConfirm() {
    const inventory = gameState.inventory.filter((it) => it.quantity > 0);
    if (inventory.length === 0) return;
    const entry = inventory[this.subMenuIndex];
    if (!entry) return;
    const item = getItemById(entry.itemId);
    if (!item) return;

    // フィールドで使えるのは回復系・リバイブ系・PP回復系
    const canUseInField = item.effect && (
      item.effect.type === "heal" ||
      item.effect.type === "revive" ||
      item.effect.type === "healAllPP"
    );
    if (!canUseInField) {
      this._showBagMessage("フィールドでは つかえない…");
      return;
    }

    // ターゲット選択へ遷移
    this._pendingItemIndex = this.subMenuIndex;
    this._pendingItemEntry = entry;
    this._pendingItemDef = item;
    this.subMenuType = "bag_target";
    this.subMenuIndex = 0;
    this._renderSubMenu();
  }

  /** バッグ使用のターゲット選択画面 */
  _renderBagTargetView() {
    renderBagTargetView(this);
  }

  /** バッグターゲット選択でZを押した */
  _handleBagTargetConfirm() {
    const party = gameState.party;
    const target = party[this.subMenuIndex];
    if (!target || !target.species) return;
    const item = this._pendingItemDef;
    const entry = this._pendingItemEntry;
    if (!item || !entry) return;

    let used = false;

    if (item.effect.type === "heal") {
      if (target.currentHp <= 0) {
        this._showBagMessage("ひんしの モンスターには つかえない…");
        return;
      }
      const stats = calcStats(target.species, target.level);
      const maxHp = stats.maxHp;
      if (target.currentHp >= maxHp) {
        this._showBagMessage("HPは まんたんだ！");
        return;
      }
      const before = target.currentHp;
      target.currentHp = Math.min(maxHp, target.currentHp + (item.effect.amount || 0));
      const healed = target.currentHp - before;
      audioManager.playHeal();
      this._showBagMessage(`${target.species.name}の HPが ${healed} かいふくした！`);
      used = true;
    } else if (item.effect.type === "revive") {
      if (target.currentHp > 0) {
        this._showBagMessage("このモンスターは げんきだ！");
        return;
      }
      const stats = calcStats(target.species, target.level);
      target.currentHp = Math.floor(stats.maxHp * (item.effect.amount || 0.5));
      audioManager.playHeal();
      this._showBagMessage(`${target.species.name}が ふっかつした！`);
      used = true;
    } else if (item.effect.type === "healAllPP") {
      // エーテル・マックスエリクサー: 全技のPPを回復
      const moves = getMonsterMoves(target);
      if (!Array.isArray(target.pp)) target.pp = [];
      let ppHealed = false;
      moves.forEach((move, i) => {
        const maxPp = move.pp || 10;
        const current = (target.pp[i] !== undefined) ? target.pp[i] : maxPp;
        const restoreAmount = item.effect.amount < 0 ? maxPp : (item.effect.amount || 10);
        const newPp = Math.min(maxPp, current + restoreAmount);
        if (newPp > current) {
          target.pp[i] = newPp;
          ppHealed = true;
        }
      });
      if (!ppHealed) {
        this._showBagMessage("PPは まんたんだ！");
        return;
      }
      audioManager.playHeal();
      this._showBagMessage(`${target.species.name}の わざの PPが かいふくした！`);
      used = true;
    }

    if (used) {
      entry.quantity = Math.max(0, entry.quantity - 1);
      gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
      // 使用後にバッグ画面に戻す
      this.time.delayedCall(800, () => {
        this.subMenuType = "bag";
        this.subMenuIndex = 0;
        this._renderSubMenu();
      });
    }
  }

  /** バッグ画面に一時メッセージを表示 */
  _showBagMessage(text) {
    showBagMessage(this, text);
  }

  // ── 図鑑画面 ──
  _renderPokedexView() {
    renderPokedexView(this);
  }

  // ── トレーナー情報 ──
  _renderTrainerView() {
    renderTrainerView(this);
  }

  // ── ガイド画面 ──
  _getGuidePages() {
    return GUIDE_PAGES;
  }

  _renderGuideView() {
    renderGuideView(this);
  }

  _handleGuideConfirm() {
    const pages = this._getGuidePages();
    if (this.subMenuType === "guide_toc") {
      this.guideTocIndex = Phaser.Math.Clamp(this.subMenuIndex, 0, Math.max(0, pages.length - 1));
      this.subMenuIndex = this.guideTocIndex;
      this.subMenuType = "guide_detail";
      this._renderSubMenu();
      return;
    }

    if (this.subMenuIndex < pages.length - 1) {
      this.subMenuIndex += 1;
      this.guideTocIndex = this.subMenuIndex;
      this._renderSubMenu();
      return;
    }

    this.subMenuType = "guide_toc";
    this.subMenuIndex = this.guideTocIndex || 0;
    this._renderSubMenu();
  }

  // ── 設定画面 ──
  _renderSettingsView() {
    renderSettingsView(this);
  }

  _cycleBattleSpeed(direction = 1) {
    cycleBattleSpeed(direction);
  }

  _toggleGameplayFlag(flagKey) {
    toggleGameplayFlag(flagKey);
  }

  _persistSettingsChanges(playSe = true) {
    persistSettingsChanges(this, playSe);
  }

  _adjustVolume(delta) {
    adjustVolume(this, delta);
  }

  _handleSettingsAction() {
    handleSettingsAction(this);
  }

  _executeDeleteSave() {
    executeDeleteSave(this);
  }

  _showCenterMessage(text, color = "#fde68a") {
    showCenterMessage(this, text, color);
  }

  _handleVerticalRepeatInput({
    isUpDown,
    isDownDown,
    isUpHeld,
    isDownHeld,
    holdDirectionKey,
    nextRepeatAtKey,
    onUp,
    onDown,
  }) {
    handleVerticalRepeatInput(this, {
      isUpDown,
      isDownDown,
      isUpHeld,
      isDownHeld,
      holdDirectionKey,
      nextRepeatAtKey,
      onUp,
      onDown,
    });
  }
}
