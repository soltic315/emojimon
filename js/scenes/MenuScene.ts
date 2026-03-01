/**
 * MenuScene - フィールドから呼び出せるゲーム内メニュー
 * パーティ / アイテム / ずかん / プレイヤー情報 / 設定
 */
import { gameState } from "../state/gameState.ts";
import { getItemById } from "../data/items.ts";
import { calcStats, getMonsterMoves } from "../data/monsters.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { FONT, COLORS, TEXT_COLORS, applyCanvasBrightness } from "../ui/UIHelper.ts";
import { MENU_ITEMS, GUIDE_PAGES } from "./menu/menuConstants.ts";
import { clampScreenBrightness } from "./menu/settingsShared.ts";
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
    this.navRepeatDelayMs = 260;
    this.navRepeatIntervalMs = 95;
    this.guideTocIndex = 0;
    this.settingsConfirmActive = false;
    this.settingsConfirmIndex = 0;
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);

    // 半透明オーバーレイ
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    const overlayGlow = this.add.graphics();
    overlayGlow.fillStyle(0x0f172a, 0.22);
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
      case "close":
        this.closeMenu();
        break;
    }
  }

  handleCancel() {
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
    if (!this.subMenuActive || this.subMenuType !== "party") return;
    if (this.partySwapMode || this.partyFusionMode) return;
    const mon = gameState.party[this.subMenuIndex];
    if (!mon || !mon.species) return;

    const currentName = mon.nickname || "";
    const input = prompt(
      `${mon.species.emoji} ${mon.species.name} のニックネームを入力\n（空欄で元の名前に戻す / 最大12文字）`,
      currentName,
    );
    if (input === null) return; // キャンセル

    const trimmed = input.trim().slice(0, 12);
    mon.nickname = trimmed.length > 0 ? trimmed : null;
    audioManager.playConfirm();
    if (mon.nickname) {
      this._showPartyMessage(`${mon.species.name}に「${mon.nickname}」というニックネームをつけた！`);
    } else {
      this._showPartyMessage(`${mon.species.name}のニックネームを元に戻した！`);
    }
    this._renderSubMenu();
  }

  // ── ボックス画面 ──
  _handleBoxConfirm() {
    const box = gameState.box || [];
    if (box.length === 0) return;
    const boxIndex = this.subMenuIndex;
    if (boxIndex < 0 || boxIndex >= box.length) return;
    const partyCount = (gameState.party || []).length;

    if (partyCount < 6) {
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
    const order = ["NORMAL", "FAST", "TURBO"];
    const current = gameState.gameplaySettings?.battleSpeed || "NORMAL";
    const idx = Math.max(0, order.indexOf(current));
    const nextIndex = (idx + direction + order.length) % order.length;
    gameState.gameplaySettings.battleSpeed = order[nextIndex];
  }

  _toggleGameplayFlag(flagKey) {
    gameState.gameplaySettings[flagKey] = !gameState.gameplaySettings[flagKey];
  }

  _persistSettingsChanges(playSe = true) {
    audioManager.applySettings(gameState.audioSettings);
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);
    gameState.saveAudioSettings();
    if (playSe) audioManager.playCursor();
    this._renderSubMenu();
  }

  _adjustVolume(delta) {
    if (this.subMenuType !== "settings") return;
    const row = this.settingsRows?.[this.subMenuIndex];
    if (!row) return;

    if (row.key === "bgm") {
      gameState.audioSettings.bgmVolume = Phaser.Math.Clamp(gameState.audioSettings.bgmVolume + delta, 0, 1);
    } else if (row.key === "se") {
      gameState.audioSettings.seVolume = Phaser.Math.Clamp(gameState.audioSettings.seVolume + delta, 0, 1);
    } else if (row.key === "mute") {
      gameState.audioSettings.muted = !gameState.audioSettings.muted;
    } else if (row.key === "battleSpeed") {
      this._cycleBattleSpeed(delta >= 0 ? 1 : -1);
    } else if (row.key === "autoAdvanceMessages") {
      this._toggleGameplayFlag("autoAdvanceMessages");
    } else if (row.key === "shortEncounterEffect") {
      this._toggleGameplayFlag("shortEncounterEffect");
    } else if (row.key === "emoSkipEnabled") {
      this._toggleGameplayFlag("emoSkipEnabled");
    } else if (row.key === "autoSaveEnabled") {
      this._toggleGameplayFlag("autoSaveEnabled");
    } else if (row.key === "screenBrightness") {
      const current = clampScreenBrightness(gameState.gameplaySettings?.screenBrightness);
      const step = delta >= 0 ? 10 : -10;
      gameState.gameplaySettings.screenBrightness = clampScreenBrightness(current + step);
    } else {
      return;
    }

    this._persistSettingsChanges(true);
  }

  _handleSettingsAction() {
    const row = this.settingsRows?.[this.subMenuIndex];
    if (!row) return;

    if (row.key === "mute") {
      gameState.audioSettings.muted = !gameState.audioSettings.muted;
      this._persistSettingsChanges(false);
    } else if (row.key === "battleSpeed") {
      this._cycleBattleSpeed(1);
      this._persistSettingsChanges(false);
    } else if (row.key === "autoAdvanceMessages") {
      this._toggleGameplayFlag("autoAdvanceMessages");
      this._persistSettingsChanges(false);
    } else if (row.key === "shortEncounterEffect") {
      this._toggleGameplayFlag("shortEncounterEffect");
      this._persistSettingsChanges(false);
    } else if (row.key === "emoSkipEnabled") {
      this._toggleGameplayFlag("emoSkipEnabled");
      this._persistSettingsChanges(false);
    } else if (row.key === "autoSaveEnabled") {
      this._toggleGameplayFlag("autoSaveEnabled");
      this._persistSettingsChanges(false);
    } else if (row.key === "screenBrightness") {
      const current = clampScreenBrightness(gameState.gameplaySettings?.screenBrightness);
      gameState.gameplaySettings.screenBrightness = clampScreenBrightness(current + 10);
      this._persistSettingsChanges(false);
    }
  }

  _executeDeleteSave() {
    gameState.deleteSave();
    audioManager.playConfirm();
    const msg = this.add.text(this.scale.width / 2, this.scale.height / 2, "セーブデータを削除しました", {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: "#fca5a5",
      backgroundColor: "#0f172a",
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(100);
    msg.setStroke("#000000", 2);
    this.time.delayedCall(900, () => {
      msg.destroy();
      audioManager.stopBgm();
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop(this.fromScene);
        this.scene.start("TitleScene");
      });
    });
  }

  _showCenterMessage(text, color = "#fde68a") {
    const msg = this.add.text(this.scale.width / 2, this.scale.height / 2, text, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color,
      backgroundColor: "#0f172a",
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(100);
    msg.setStroke("#000000", 2);
    this.time.delayedCall(900, () => msg.destroy());
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
    const now = this.time.now;

    if (isUpDown) {
      this[holdDirectionKey] = -1;
      this[nextRepeatAtKey] = now + this.navRepeatDelayMs;
      audioManager.playCursor();
      onUp();
      return;
    }

    if (isDownDown) {
      this[holdDirectionKey] = 1;
      this[nextRepeatAtKey] = now + this.navRepeatDelayMs;
      audioManager.playCursor();
      onDown();
      return;
    }

    const holdDirection = isUpHeld ? -1 : isDownHeld ? 1 : 0;
    if (holdDirection === 0) {
      this[holdDirectionKey] = 0;
      return;
    }

    if (this[holdDirectionKey] !== holdDirection) {
      this[holdDirectionKey] = holdDirection;
      this[nextRepeatAtKey] = now + this.navRepeatDelayMs;
      return;
    }

    if (now >= this[nextRepeatAtKey]) {
      this[nextRepeatAtKey] = now + this.navRepeatIntervalMs;
      audioManager.playCursor();
      if (holdDirection < 0) onUp();
      else onDown();
    }
  }
}
