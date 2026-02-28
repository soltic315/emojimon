import { gameState } from "../state/gameState.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { FONT, COLORS, TEXT_COLORS, drawPanel, drawSelection, createAmbientParticles } from "../ui/UIHelper.ts";
import { addCameraVignette, addCameraBloom, addGlow, addShine } from "../ui/FXHelper.ts";
import { gsap } from "gsap";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const { width, height } = this.scale;
    this.selectedIndex = 0;
    this.hasSave = gameState.hasSaveData();
    this.settingsVisible = false;
    this.settingsIndex = 0;
    this.settingsRows = ["mute", "bgm", "se", "close"];

    audioManager.applySettings(gameState.audioSettings);

    // ── 背景グラデーション ──
    // ── 背景 ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1222, 0x1e293b, 0x020617, 0x0a1020, 1);
    bg.fillRect(0, 0, width, height);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x020617, 0.28);
    vignette.fillCircle(width / 2, height / 2, Math.max(width, height) * 0.9);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // 背景の装飾ライン
    const deco = this.add.graphics();
    deco.lineStyle(1, 0x1e293b, 0.3);
    for (let i = 0; i < 12; i++) {
      deco.lineBetween(0, height * 0.1 + i * 40, width, height * 0.05 + i * 40);
    }

    const shine = this.add.rectangle(-120, height * 0.28, 170, height * 0.9, 0xf8fafc, 0.05)
      .setAngle(-24)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: shine,
      x: width + 160,
      duration: 6800,
      repeat: -1,
      ease: "sine.inOut",
    });

    // ── 浮遊パーティクル（絵文字が漂う） ──
    this.floatingEmojis = [];
    const emojis = ["🧸", "💧", "🍃", "⭐", "🔥", "🐢", "💎", "🐾", "🌙", "🌋", "🦭", "🌵"];
    for (let i = 0; i < 20; i++) {
      const emoji = emojis[i % emojis.length];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const text = this.add.text(x, y, emoji, {
        fontSize: 14 + Math.random() * 18,
      }).setAlpha(0.1 + Math.random() * 0.15);
      this.floatingEmojis.push({
        text,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.15 - Math.random() * 0.25,
      });
    }

    // ── タイトルロゴ ──
    // 光の後ろグロウ
    const glow = this.add.circle(width / 2, height * 0.22, 100, 0xfbbf24, 0.06);
    this.tweens.add({
      targets: glow,
      radius: 120,
      alpha: 0.03,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const titleShadow = this.add.text(width / 2 + 3, height * 0.22 + 3, "EMOJIMON", {
      fontFamily: FONT.TITLE,
      fontSize: 64,
      fontStyle: "800",
      color: "#000000",
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(width / 2, height * 0.22, "EMOJIMON", {
      fontFamily: FONT.TITLE,
      fontSize: 64,
      fontStyle: "800",
      color: "#fde68a",
      stroke: "#92400e",
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: "#000000", blur: 16, fill: true },
    }).setOrigin(0.5);

    // PostFX: タイトルにグロー + シャインエフェクト
    addGlow(title, { color: 0xfbbf24, outerStrength: 6, innerStrength: 2 });
    addShine(title, { speed: 0.3, lineWidth: 0.4, gradient: 4 });

    // PostFX: カメラにビネット + ブルーム
    addCameraVignette(this.cameras.main, { radius: 0.4, strength: 0.22 });
    addCameraBloom(this.cameras.main, { strength: 1.0, blurStrength: 0.6, steps: 3 });

    this.tweens.add({
      targets: [title, titleShadow],
      y: "-=6",
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // ── サブタイトル ──
    const subtitle = this.add.text(width / 2, height * 0.35, "〜 絵文字モンスターの世界へようこそ 〜", {
      fontFamily: FONT.UI,
      fontSize: 15,
      fontStyle: "500",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
    this.tweens.add({
      targets: subtitle,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // ── バージョン表示 ──
    this.add.text(width - 16, 8, "v1.0.0", {
      fontFamily: FONT.MONO,
      fontSize: 11,
      color: "#374151",
    }).setOrigin(1, 0);

    // ── メニュー構築 ──
    this.menuOptions = [];
    if (this.hasSave) {
      this.menuOptions.push({ label: "つづきから", action: "continue" });
    }
    this.menuOptions.push({ label: "はじめから", action: "new" });
    this.menuOptions.push({ label: "サウンド設定", action: "settings" });
    this.menuOptions.push({ label: "あそびかた", action: "help" });

    this.menuTexts = [];
    this.menuBgs = [];
    this.menuCards = [];
    const menuStartY = height * 0.5;
    const menuSpacing = 44;

    this.menuOptions.forEach((opt, i) => {
      const y = menuStartY + i * menuSpacing;

      const menuCard = this.rexUI?.add
        .roundRectangle(width / 2, y, 320, 40, 12, 0x0f172a, 0.62)
        .setStrokeStyle(1, 0x334155, 0.75);
      if (menuCard) {
        this.menuCards.push(menuCard);
      }

      const menuBg = this.add.graphics();
      this.menuBgs.push(menuBg);

      const text = this.add.text(width / 2, y, opt.label, {
        fontFamily: FONT.UI,
        fontSize: 21,
        fontStyle: "700",
        color: "#e5e7eb",
        padding: { x: 24, y: 8 },
      }).setOrigin(0.5);
      this.menuTexts.push(text);
    });

    this.updateMenuDisplay();

    // ── 操作ヒント ──
    this.hintText = this.add.text(width / 2, height - 62, "↑↓：えらぶ  Z/Enter：けってい", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.hintText,
      alpha: 0.3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // ── 著作権 ──
    this.add.text(width / 2, height - 22, "© 2026 EMOJIMON Project", {
      fontFamily: "system-ui, sans-serif",
      fontSize: 11,
      color: "#64748b",
    }).setOrigin(0.5);

    // ── ヘルプパネル（非表示で準備） ──
    this.helpPanel = null;
    this.helpVisible = false;
    this.settingsPanel = null;

    // ── 入力 ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-Z", () => this.handleConfirm());
    this.input.keyboard.on("keydown-ENTER", () => this.handleConfirm());
    this.input.keyboard.on("keydown-X", () => {
      if (this.helpVisible) this.hideHelp();
      if (this.settingsVisible) this.hideSettings();
    });
  }

  update() {
    // 浮遊パーティクル
    const { width, height } = this.scale;
    this.floatingEmojis.forEach((e) => {
      e.text.x += e.speedX;
      e.text.y += e.speedY;
      if (e.text.y < -30) {
        e.text.y = height + 20;
        e.text.x = Math.random() * width;
      }
      if (e.text.x < -30) e.text.x = width + 20;
      if (e.text.x > width + 30) e.text.x = -20;
    });

    if (this.helpVisible) return;
    if (this.settingsVisible) {
      this.handleSettingsNavigation();
      return;
    }

    // 名前入力UI表示中はゲーム内キーボード操作
    if (this._nameActive) {
      this._handleNameKeyboardNavigation();
      return;
    }

    // メニュー操作
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
    const { width } = this.scale;
    this.menuTexts.forEach((text, i) => {
      const selected = i === this.selectedIndex;
      text.setColor(selected ? "#fde68a" : "#e5e7eb");
      text.setFontSize(selected ? 23 : 21);

      // カーソルの三角形をテキストに追加
      const label = this.menuOptions[i].label;
      text.setText(selected ? `▶ ${label}` : `  ${label}`);

      gsap.killTweensOf(text);
      gsap.to(text, {
        x: selected ? width / 2 + 4 : width / 2,
        duration: 0.18,
        ease: "power2.out",
      });

      const menuCard = this.menuCards?.[i];
      if (menuCard) {
        menuCard.setFillStyle(selected ? 0x1f2937 : 0x0f172a, selected ? 0.92 : 0.62);
        menuCard.setStrokeStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
        gsap.killTweensOf(menuCard);
        gsap.to(menuCard, {
          scaleX: selected ? 1.03 : 1,
          scaleY: selected ? 1.03 : 1,
          duration: 0.18,
          ease: "power2.out",
        });
      }

      // 背景
      this.menuBgs[i].clear();
      if (selected) {
        drawSelection(this.menuBgs[i], width / 2 - 156, text.y - 18, 312, 40, { radius: 10 });
      }
    });
  }

  handleConfirm() {
    // AudioManager 初期化（ユーザー操作トリガー）
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
    } else if (action === "help") {
      this.showHelp();
    }
  }

  startNewGame() {
    // 名前入力UIを表示
    this._showNameSelect();
  }

  _showNameSelect() {
    const { width, height } = this.scale;

    // 既存パネルを破棄
    if (this.namePanel) this.namePanel.destroy(true);
    this.namePanel = this.add.container(0, 0);

    // オーバーレイ
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
    this.namePanel.add(overlay);

    const panelW = 452;
    const panelH = Math.min(440, height - 24);
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2;

    const bg = this.add.graphics();
    drawPanel(bg, panelX, panelY, panelW, panelH, { headerHeight: 36, glow: true });
    this.namePanel.add(bg);

    this.namePanel.add(this.add.text(width / 2, panelY + 18, "なまえを にゅうりょくしてね！", {
      fontFamily: FONT.UI,
      fontSize: 15,
      color: "#fde68a",
    }).setOrigin(0.5, 0));

    const inputBg = this.add.graphics();
    drawSelection(inputBg, width / 2 - 145, panelY + 68, 290, 44, { radius: 8 });
    this.namePanel.add(inputBg);

    this._nameInput = "";
    this._nameInputText = this.add.text(width / 2, panelY + 78, "", {
      fontFamily: FONT.UI,
      fontSize: 24,
      color: "#e5e7eb",
      align: "center",
    }).setOrigin(0.5, 0);
    this.namePanel.add(this._nameInputText);

    const guide = this.add.text(width / 2, panelY + 124, "↑↓←→: もじをえらぶ（最大8文字）", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5, 0);
    this.namePanel.add(guide);

    const controls = this.add.text(width / 2, panelY + 150, "Z/Enter: 入力  けす: 1文字削除", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5, 0);
    this.namePanel.add(controls);

    const confirmHint = this.add.text(width / 2, panelY + 176, "おわる: けってい  X: もどる", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5, 0);
    this.namePanel.add(confirmHint);

    this._nameKeyboardKeys = [
      "あ", "い", "う", "え", "お", "か",
      "き", "く", "け", "こ", "さ", "し",
      "す", "せ", "そ", "た", "ち", "つ",
      "て", "と", "な", "に", "ぬ", "ね",
      "の", "ま", "み", "む", "め", "も",
      "や", "ゆ", "よ", "ん", "けす", "おわる",
    ];
    this._nameKeyboardCols = 6;
    this._nameKeyboardIndex = 0;
    this._nameKeyboardButtons = [];

    const keyStartX = width / 2 - 186;
    const keyStartY = panelY + 204;
    const keyW = 54;
    const keyH = 30;
    const keyGapX = 10;
    const keyGapY = 8;

    this._nameKeyboardKeys.forEach((label, index) => {
      const col = index % this._nameKeyboardCols;
      const row = Math.floor(index / this._nameKeyboardCols);
      const x = keyStartX + col * (keyW + keyGapX);
      const y = keyStartY + row * (keyH + keyGapY);

      const bgKey = this.add.graphics();
      this.namePanel.add(bgKey);

      const text = this.add.text(x + keyW / 2, y + keyH / 2, label, {
        fontFamily: FONT.UI,
        fontSize: 16,
        color: "#e2e8f0",
      }).setOrigin(0.5);
      this.namePanel.add(text);

      this._nameKeyboardButtons.push({ bgKey, text, x, y, w: keyW, h: keyH, label });
    });

    this._updateNameDisplay();
    this._updateNameKeyboardDisplay();
    this._nameActive = true;

    // キー処理を一時的に上書き
    this.input.keyboard.off("keydown-Z");
    this.input.keyboard.off("keydown-ENTER");
    this.input.keyboard.on("keydown-Z", () => this._confirmName());
    this.input.keyboard.on("keydown-ENTER", () => this._confirmName());
    this.input.keyboard.on("keydown-X", () => {
      this._closeNameSelect();
    });
  }

  _updateNameDisplay() {
    if (!this._nameInputText) return;
    const hasText = Array.from(this._nameInput || "").length > 0;
    const display = hasText ? this._formatNameForDisplay(this._nameInput, 5) : "なまえ";
    this._nameInputText.setText(display);
    this._nameInputText.setFontSize(display.includes("\n") ? 18 : 24);
    this._nameInputText.setColor(hasText ? "#e5e7eb" : "#94a3b8");
  }

  _formatNameForDisplay(value, chunkSize) {
    const chars = Array.from(value || "");
    if (chars.length <= chunkSize) return chars.join("");

    const lines = [];
    for (let i = 0; i < chars.length; i += chunkSize) {
      lines.push(chars.slice(i, i + chunkSize).join(""));
    }

    return lines.join("\n");
  }

  _confirmName() {
    if (!this._nameActive) return;
    const key = this._nameKeyboardKeys?.[this._nameKeyboardIndex];
    if (!key) return;

    if (key === "けす") {
      this._deleteNameChar();
      return;
    }

    if (key === "おわる") {
      const normalized = (this._nameInput || "").trim();
      const name = normalized.length > 0 ? normalized : "ユウ";
      this._doStartNewGame(name);
      return;
    }

    const next = `${this._nameInput || ""}${key}`;
    this._nameInput = this._truncateName(next, 8);
    audioManager.playCursor();
    this._updateNameDisplay();
  }

  _handleNameKeyboardNavigation() {
    if (!this._nameActive) return;
    const keyCount = this._nameKeyboardKeys?.length || 0;
    const cols = this._nameKeyboardCols || 1;
    if (keyCount === 0) return;

    let moved = false;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this._nameKeyboardIndex = (this._nameKeyboardIndex - 1 + keyCount) % keyCount;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this._nameKeyboardIndex = (this._nameKeyboardIndex + 1) % keyCount;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this._nameKeyboardIndex = (this._nameKeyboardIndex - cols + keyCount) % keyCount;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this._nameKeyboardIndex = (this._nameKeyboardIndex + cols) % keyCount;
      moved = true;
    }

    if (moved) {
      audioManager.playCursor();
      this._updateNameKeyboardDisplay();
    }
  }

  _updateNameKeyboardDisplay() {
    if (!this._nameKeyboardButtons) return;
    this._nameKeyboardButtons.forEach((button, index) => {
      const selected = index === this._nameKeyboardIndex;
      button.bgKey.clear();
      button.bgKey.fillStyle(selected ? 0x1f2937 : 0x0f172a, selected ? 0.94 : 0.7);
      button.bgKey.fillRoundedRect(button.x, button.y, button.w, button.h, 8);
      button.bgKey.lineStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
      button.bgKey.strokeRoundedRect(button.x, button.y, button.w, button.h, 8);
      button.text.setColor(selected ? "#fde68a" : "#e2e8f0");
    });
  }

  _deleteNameChar() {
    if (!this._nameActive) return;
    const chars = Array.from(this._nameInput || "");
    if (chars.length === 0) return;
    chars.pop();
    this._nameInput = chars.join("");
    audioManager.playCursor();
    this._updateNameDisplay();
  }

  _truncateName(value, maxLength) {
    return Array.from(value).slice(0, maxLength).join("");
  }

  _closeNameSelect() {
    this._nameActive = false;
    if (this.namePanel) {
      this.namePanel.destroy(true);
      this.namePanel = null;
    }
    this._nameKeyboardButtons = [];
    // Z/Enterを元に戻す
    this.input.keyboard.off("keydown-Z");
    this.input.keyboard.off("keydown-ENTER");
    this.input.keyboard.off("keydown-X");
    this.input.keyboard.on("keydown-Z", () => this.handleConfirm());
    this.input.keyboard.on("keydown-ENTER", () => this.handleConfirm());
    this.input.keyboard.on("keydown-X", () => {
      if (this.helpVisible) this.hideHelp();
      if (this.settingsVisible) this.hideSettings();
    });
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
      // ロード失敗→新規ゲーム
      this.startNewGame();
    }
  }

  showHelp() {
    this.helpVisible = true;
    const { width, height } = this.scale;

    this.helpPanel = this.add.container(0, 0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.helpPanel.add(overlay);

    const panelBg = this.add.graphics();
    drawPanel(panelBg, 52, 34, width - 104, height - 68, { headerHeight: 42, glow: true });
    this.helpPanel.add(panelBg);

    const helpTitle = this.add.text(width / 2, 64, "あそびかた", {
      fontFamily: FONT.UI,
      fontSize: 22,
      color: "#fbbf24",
    }).setOrigin(0.5);
    this.helpPanel.add(helpTitle);

    const helpContent = [
      "【フィールド】",
      "  ←↑→↓ : いどう",
      "  Z     : はなす / アクション",
      "",
      "【バトル】",
      "  ↑↓   : コマンド・わざをえらぶ",
      "  Z     : けってい",
      "  X     : キャンセル",
      "",
      "【ヒント】",
      "  草むらを歩くとモンスターに出会うよ！",
      "  タイプ相性：🔥→🍃→💧→🔥",
    ];

    const helpSizer = this.rexUI?.add.sizer({
      x: width / 2,
      y: height / 2 + 6,
      width: width - 150,
      height: height - 120,
      orientation: "y",
      space: {
        left: 20,
        right: 20,
        top: 14,
        bottom: 14,
        item: 8,
      },
    });

    if (helpSizer) {
      helpSizer.addBackground(
        this.rexUI.add
          .roundRectangle(0, 0, 0, 0, 12, 0x0f172a, 0.72)
          .setStrokeStyle(1, 0x334155, 0.75)
      );

      const sectionTitle = this.rexUI.add.label({
        background: this.rexUI.add
          .roundRectangle(0, 0, 0, 0, 8, 0x111827, 0.8)
          .setStrokeStyle(1, 0x334155, 0.75),
        text: this.add.text(0, 0, "ガイド", {
          fontFamily: FONT.UI,
          fontSize: 14,
          color: "#fde68a",
        }),
        align: "center",
        space: {
          left: 12,
          right: 12,
          top: 5,
          bottom: 5,
        },
      });

      const helpText = this.add.text(0, 0, helpContent.join("\n"), {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: "#e2e8f0",
        lineSpacing: 6,
      });

      const closeHint = this.add.text(0, 0, "X キーでとじる", {
        fontFamily: FONT.UI,
        fontSize: 13,
        color: "#94a3b8",
      }).setOrigin(0.5, 0.5);

      helpSizer.add(sectionTitle, {
        proportion: 0,
        expand: true,
        align: "center",
        padding: { bottom: 4 },
      });
      helpSizer.add(helpText, {
        proportion: 1,
        expand: true,
        align: "left",
      });
      helpSizer.add(closeHint, {
        proportion: 0,
        align: "center",
      });

      helpSizer.layout();
      this.helpPanel.add(helpSizer);
    }
  }

  hideHelp() {
    this.helpVisible = false;
    if (this.helpPanel) {
      this.helpPanel.destroy(true);
      this.helpPanel = null;
    }
  }

  showSettings() {
    this.settingsVisible = true;
    this.settingsIndex = 0;
    this.renderSettingsPanel();
  }

  hideSettings() {
    this.settingsVisible = false;
    if (this.settingsPanel) {
      this.settingsPanel.destroy(true);
      this.settingsPanel = null;
    }
  }

  applyAudioSettings() {
    audioManager.applySettings(gameState.audioSettings);
  }

  updateAudioSettings(mutator) {
    mutator(gameState.audioSettings);
    gameState.audioSettings.bgmVolume = Phaser.Math.Clamp(gameState.audioSettings.bgmVolume, 0, 1);
    gameState.audioSettings.seVolume = Phaser.Math.Clamp(gameState.audioSettings.seVolume, 0, 1);
    gameState.saveAudioSettings();
    this.applyAudioSettings();
    this.renderSettingsPanel();
  }

  handleSettingsNavigation() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.settingsIndex = (this.settingsIndex - 1 + this.settingsRows.length) % this.settingsRows.length;
      audioManager.playCursor();
      this.renderSettingsPanel();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.settingsIndex = (this.settingsIndex + 1) % this.settingsRows.length;
      audioManager.playCursor();
      this.renderSettingsPanel();
      return;
    }

    const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
    if (left || right) {
      const delta = right ? 0.05 : -0.05;
      const row = this.settingsRows[this.settingsIndex];
      if (row === "bgm") {
        this.updateAudioSettings((s) => {
          s.bgmVolume += delta;
          s.muted = false;
        });
        audioManager.playCursor();
      } else if (row === "se") {
        this.updateAudioSettings((s) => {
          s.seVolume += delta;
          s.muted = false;
        });
        audioManager.playCursor();
      } else if (row === "mute") {
        this.updateAudioSettings((s) => {
          s.muted = !s.muted;
        });
        audioManager.playCursor();
      }
    }
  }

  handleSettingsConfirm() {
    const row = this.settingsRows[this.settingsIndex];
    if (row === "mute") {
      this.updateAudioSettings((s) => {
        s.muted = !s.muted;
      });
      return;
    }

    if (row === "close") {
      this.hideSettings();
    }
  }

  renderSettingsPanel() {
    if (!this.settingsVisible) return;

    if (this.settingsPanel) {
      this.settingsPanel.destroy(true);
      this.settingsPanel = null;
    }

    const { width, height } = this.scale;
    const settings = gameState.audioSettings;

    this.settingsPanel = this.add.container(0, 0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.settingsPanel.add(overlay);

    const panelBg = this.add.graphics();
    drawPanel(panelBg, 108, 62, width - 216, height - 124, { headerHeight: 44, glow: true });
    this.settingsPanel.add(panelBg);

    const headerCard = this.rexUI?.add
      .roundRectangle(width / 2, 92, width - 252, 32, 10, 0x111827, 0.72)
      .setStrokeStyle(1, 0x334155, 0.7);
    if (headerCard) this.settingsPanel.add(headerCard);

    const title = this.add.text(width / 2, 92, "サウンド設定", {
      fontFamily: FONT.UI,
      fontSize: 24,
      color: "#fde68a",
    }).setOrigin(0.5);
    this.settingsPanel.add(title);

    const rows = [
      `ミュート: ${settings.muted ? "ON" : "OFF"}`,
      `BGM音量 : ${Math.round(settings.bgmVolume * 100)}%`,
      `SE音量  : ${Math.round(settings.seVolume * 100)}%`,
      "とじる",
    ];

    rows.forEach((label, index) => {
      const y = 146 + index * 44;
      const selected = index === this.settingsIndex;
      const rowCard = this.rexUI?.add
        .roundRectangle(width / 2, y + 14, 352, 36, 8, selected ? 0x1f2937 : 0x0f172a, selected ? 0.92 : 0.66)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
      if (rowCard) this.settingsPanel.add(rowCard);

      const text = this.add.text(width / 2, y, selected ? `▶ ${label}` : `  ${label}`, {
        fontFamily: FONT.UI,
        fontSize: 19,
        color: selected ? "#fde68a" : "#e2e8f0",
      }).setOrigin(0.5, 0);
      this.settingsPanel.add(text);
    });

    const help = this.add.text(width / 2, height - 90, "↑↓:選択  ←→:変更  Z:決定  X:戻る", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5);
    this.settingsPanel.add(help);
  }
}

