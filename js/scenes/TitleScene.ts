import { gameState } from "../state/gameState.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { applyCanvasBrightness } from "../ui/UIHelper.ts";
import { closeNameSelect, confirmName, deleteNameChar, formatNameForDisplay, handleNameDirectInput, showNameSelect, truncateName, updateNameDisplay } from "./title/titleNameInput.ts";
import { hideHelp, showHelp } from "./title/titleHelp.ts";
import { applyAudioSettings, handleSettingsConfirm, handleSettingsNavigation, hideSettings, renderSettingsPanel, showSettings, updateSettings } from "./title/titleSettings.ts";
import { createTitleVisuals, updateFloatingEmojis, updateTitleMenuDisplay } from "./title/titleVisuals.ts";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.selectedIndex = 0;
    this.hasSave = gameState.hasSaveData();
    this.settingsVisible = false;
    this.settingsIndex = 0;
    this.settingsRows = [];

    audioManager.applySettings(gameState.audioSettings);
    applyCanvasBrightness(this, gameState.gameplaySettings?.screenBrightness);

    createTitleVisuals(this);

    this.helpPanel = null;
    this.helpVisible = false;
    this.settingsPanel = null;
    this._nameDirectInputHandler = (event) => this._handleNameDirectInput(event);

    this.cursors = this.input.keyboard.createCursorKeys();
    this._bindDefaultKeyboardHandlers();
  }

  update() {
    updateFloatingEmojis(this);

    if (this.helpVisible) return;
    if (this.settingsVisible) {
      this.handleSettingsNavigation();
      return;
    }

    if (this._nameActive) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      audioManager.playCursor();
      this.updateMenuDisplay();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
      audioManager.playCursor();
      this.updateMenuDisplay();
    }
  }

  updateMenuDisplay() {
    updateTitleMenuDisplay(this);
  }

  _clearTitleKeyListeners() {
    this.input.keyboard.off("keydown-Z");
    this.input.keyboard.off("keydown-ENTER");
    this.input.keyboard.off("keydown-SPACE");
    this.input.keyboard.off("keydown-X");
    this.input.keyboard.off("keydown-ESC");
    if (this._nameDirectInputHandler) {
      this.input.keyboard.off("keydown", this._nameDirectInputHandler);
    }
  }

  _handleDefaultCancel() {
    if (this.helpVisible) this.hideHelp();
    if (this.settingsVisible) this.hideSettings();
  }

  _bindDefaultKeyboardHandlers() {
    this._clearTitleKeyListeners();
    this.input.keyboard.on("keydown-Z", () => this.handleConfirm());
    this.input.keyboard.on("keydown-ENTER", () => this.handleConfirm());
    this.input.keyboard.on("keydown-SPACE", () => this.handleConfirm());
    this.input.keyboard.on("keydown-X", () => this._handleDefaultCancel());
    this.input.keyboard.on("keydown-ESC", () => this._handleDefaultCancel());
  }

  _bindNameSelectKeyboardHandlers() {
    this._clearTitleKeyListeners();
    this.input.keyboard.on("keydown", this._nameDirectInputHandler);
  }

  handleConfirm() {
    audioManager.init();
    audioManager.applySettings(gameState.audioSettings);
    audioManager.playTitleBgm();
    audioManager.playConfirm();

    if (this.helpVisible) {
      this.hideHelp();
      return;
    }

    if (this.settingsVisible) {
      this.handleSettingsConfirm();
      return;
    }

    const action = this.menuOptions[this.selectedIndex].action;
    if (action === "new") {
      this.startNewGame();
    } else if (action === "continue") {
      this.continueGame();
    } else if (action === "settings") {
      this.showSettings();
    }
  }

  startNewGame() {
    this._showNameSelect();
  }

  _showNameSelect() {
    showNameSelect(this);
  }

  _updateNameDisplay() {
    updateNameDisplay(this);
  }

  _formatNameForDisplay(value, chunkSize) {
    return formatNameForDisplay(value, chunkSize);
  }

  _confirmName() {
    confirmName(this);
  }

  _handleNameDirectInput(event) {
    handleNameDirectInput(this, event);
  }

  _deleteNameChar() {
    deleteNameChar(this);
  }

  _truncateName(value, maxLength) {
    return truncateName(value, maxLength);
  }

  _closeNameSelect() {
    closeNameSelect(this);
  }

  _doStartNewGame(playerName) {
    this._closeNameSelect();
    gameState.reset();
    gameState.playerName = playerName;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("PrologueScene");
    });
  }

  continueGame() {
    const success = gameState.load();
    if (success) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("WorldScene", {
          mapKey: gameState.currentMap,
          startX: gameState.playerPosition.x,
          startY: gameState.playerPosition.y,
        });
      });
    } else {
      this.startNewGame();
    }
  }

  showHelp() {
    showHelp(this);
  }

  hideHelp() {
    hideHelp(this);
  }

  showSettings() {
    showSettings(this);
  }

  hideSettings() {
    hideSettings(this);
  }

  applyAudioSettings() {
    applyAudioSettings(this);
  }

  updateSettings(mutator) {
    updateSettings(this, mutator);
  }

  handleSettingsNavigation() {
    handleSettingsNavigation(this);
  }

  handleSettingsConfirm() {
    handleSettingsConfirm(this);
  }

  renderSettingsPanel() {
    renderSettingsPanel(this);
  }
}
