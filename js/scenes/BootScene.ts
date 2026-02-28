import { initAbilitiesFromJson, initMonstersFromJson } from "../data/monsters.ts";
import { initItemsFromJson } from "../data/items.ts";
import { initMovesFromJson } from "../data/moves.ts";
import { validateGameData } from "../data/dataValidation.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { FONT, COLORS, createAmbientParticles } from "../ui/UIHelper.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // ローディング画面
    const { width, height } = this.scale;
    const barW = 320;
    const barH = 14;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 50;

    // 背景グラデーション
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x070b14, 0x0f1629, 0x020617, 0x070b14, 1);
    bg.fillRect(0, 0, width, height);

    // 中央グロウ
    const centerGlow = this.add.graphics();
    centerGlow.fillStyle(0x6366f1, 0.04);
    centerGlow.fillCircle(width / 2, height / 2 - 20, 200);
    centerGlow.setBlendMode(Phaser.BlendModes.ADD);

    // 微光パーティクル
    createAmbientParticles(this, 20, { color: 0xc4b5fd, minAlpha: 0.04, maxAlpha: 0.15 });

    // タイトルロゴ
    this.add.text(width / 2, height / 2 - 30, "EMOJIMON", {
      fontFamily: FONT.TITLE,
      fontSize: 42,
      fontStyle: "800",
      color: "#fde68a",
      stroke: "#78350f",
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: "#000000", blur: 12, fill: true },
    }).setOrigin(0.5);

    // サブテキスト
    this.add.text(width / 2, height / 2 + 10, "Now Loading...", {
      fontFamily: FONT.UI,
      fontSize: 13,
      fontStyle: "500",
      color: "#93c5fd",
      letterSpacing: 2,
    }).setOrigin(0.5);

    // プログレスバー背景
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0d1117, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, barH / 2);
    barBg.lineStyle(1, 0x30363d, 0.7);
    barBg.strokeRoundedRect(barX, barY, barW, barH, barH / 2);

    const barFill = this.add.graphics();

    this.load.on("progress", (value) => {
      barFill.clear();
      const fillW = Math.max(0, (barW - 4) * value);

      // メインフィル
      barFill.fillStyle(0xfbbf24, 1);
      barFill.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, (barH - 4) / 2);

      // 上部シャイン
      if (fillW > 6) {
        barFill.fillStyle(0xfde68a, 0.4);
        barFill.fillRoundedRect(barX + 3, barY + 3, fillW - 2, (barH - 6) / 2, (barH - 6) / 2);
      }
    });

    // データ JSON を読み込む
    const movesJsonUrl = new URL("../../assets/data/moves.json", import.meta.url).href;
    const monstersJsonUrl = new URL("../../assets/data/monsters.json", import.meta.url).href;
    const itemsJsonUrl = new URL("../../assets/data/items.json", import.meta.url).href;
    const abilitiesJsonUrl = new URL("../../assets/data/abilities.json", import.meta.url).href;

    this.load.json("moves", movesJsonUrl);
    this.load.json("monsters", monstersJsonUrl);
    this.load.json("items", itemsJsonUrl);
    this.load.json("abilities", abilitiesJsonUrl);
  }

  create() {
    // テクスチャ生成
    this.createTextures();

    // JSON から技・モンスター・アイテム定義を初期化
    const rawData = {
      moves: this.cache.json.get("moves"),
      monsters: this.cache.json.get("monsters"),
      items: this.cache.json.get("items"),
      abilities: this.cache.json.get("abilities"),
    };

    try {
      const validatedData = validateGameData(rawData);
      initMovesFromJson(validatedData.moves);
      initAbilitiesFromJson(validatedData.abilities);
      initMonstersFromJson(validatedData.monsters);
      initItemsFromJson(validatedData.items);
    } catch (error) {
      console.error(error);
      this.showDataValidationError(error);
      return;
    }

    // Audio 初期化をユーザー操作まで遅延
    this.scene.start("TitleScene");
  }

  showDataValidationError(error) {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.PANEL_BG);

    this.add.text(width / 2, height / 2 - 70, "データ読み込みエラー", {
      fontFamily: FONT.TITLE,
      fontSize: 34,
      fontStyle: "800",
      color: "#fca5a5",
      stroke: "#450a0a",
      strokeThickness: 5,
    }).setOrigin(0.5);

    const reason = error instanceof Error ? error.message : "不明なエラー";
    const shortReason = reason.length > 520 ? `${reason.slice(0, 520)}...` : reason;

    this.add.text(width / 2, height / 2 + 5, shortReason, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#fecaca",
      align: "center",
      wordWrap: { width: Math.min(760, width - 48) },
      lineSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 120, "assets/data のJSON定義を確認してください。", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#fef3c7",
      align: "center",
    }).setOrigin(0.5);
  }

  createTextures() {
    const g = this.add.graphics();

    this.generateFieldTileVariants(g);

    // ── プレイヤー（高品質トレーナー風キャラ） ──
    g.clear();
    // 影（楕円、柔らかに）
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(16, 29, 20, 7);

    // 足
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(10, 23, 5, 7, 1);
    g.fillRoundedRect(17, 23, 5, 7, 1);
    // 靴底
    g.fillStyle(0x111827, 1);
    g.fillRect(9, 28, 6, 2);
    g.fillRect(17, 28, 6, 2);

    // 体（ジャケット）
    g.fillStyle(0x2563eb, 1);
    g.fillRoundedRect(8, 13, 16, 12, 3);
    // ジャケットの光沢
    g.fillStyle(0x3b82f6, 0.4);
    g.fillRoundedRect(8, 13, 8, 6, { tl: 3, tr: 0, bl: 0, br: 0 });
    // インナー
    g.fillStyle(0xe2e8f0, 1);
    g.fillRect(14, 15, 4, 9);

    // 腕
    g.fillStyle(0x2563eb, 1);
    g.fillRoundedRect(6, 14, 3, 8, 1);
    g.fillRoundedRect(23, 14, 3, 8, 1);
    // 手
    g.fillStyle(0xfcd34d, 1);
    g.fillCircle(7, 23, 2);
    g.fillCircle(24, 23, 2);

    // 顔
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(16, 10, 6);
    // 頬紅
    g.fillStyle(0xfbbf24, 0.15);
    g.fillCircle(11, 12, 2);
    g.fillCircle(21, 12, 2);

    // 帽子
    g.fillStyle(0xdc2626, 1);
    g.fillRoundedRect(9, 2, 14, 5, 2);
    g.fillRect(8, 6, 16, 2);
    // 帽子のブリム光沢
    g.fillStyle(0xef4444, 0.5);
    g.fillRect(9, 3, 6, 2);
    // 帽子のロゴ
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(16, 5, 2);

    // 目
    g.fillStyle(0x0f172a, 1);
    g.fillRect(13, 9, 2, 3);
    g.fillRect(17, 9, 2, 3);
    // 瞳ハイライト
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(13, 9, 1, 1);
    g.fillRect(17, 9, 1, 1);

    // 輪郭ライン
    g.lineStyle(0.8, 0x0f172a, 0.6);
    g.strokeCircle(16, 10, 6);

    g.generateTexture("player", 32, 32);

    // ── NPC アイコン（高品質） ──
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 29, 20, 7);
    // 本体
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(16, 15, 12);
    // グラデーション光沢
    g.fillStyle(0xfcd34d, 0.35);
    g.fillCircle(12, 11, 8);
    // ほお紅
    g.fillStyle(0xf97316, 0.3);
    g.fillCircle(7, 18, 3);
    g.fillCircle(25, 18, 3);
    // 目
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(12, 13, 2.5);
    g.fillCircle(20, 13, 2.5);
    // 瞳ハイライト
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 1.2);
    g.fillCircle(21, 12, 1.2);
    // 口
    g.lineStyle(2, 0x1e293b, 0.9);
    g.beginPath();
    g.arc(16, 17, 4, 0.1, Math.PI - 0.1, false);
    g.strokePath();
    g.generateTexture("npc", 32, 32);

    // ── ショップ NPC ──
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 29, 20, 7);
    g.fillStyle(0x60a5fa, 1);
    g.fillCircle(16, 15, 12);
    g.fillStyle(0x93c5fd, 0.3);
    g.fillCircle(12, 11, 8);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(12, 13, 2.5);
    g.fillCircle(20, 13, 2.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 1.2);
    g.fillCircle(21, 12, 1.2);
    // 帽子（ショップ目印）
    g.fillStyle(0x2563eb, 1);
    g.fillRoundedRect(6, 1, 20, 5, 2);
    g.fillRect(8, 0, 16, 3);
    // 帽子光沢
    g.fillStyle(0x3b82f6, 0.4);
    g.fillRect(8, 1, 8, 2);
    g.lineStyle(2, 0x1e293b, 0.9);
    g.beginPath();
    g.arc(16, 17, 4, 0.1, Math.PI - 0.1, false);
    g.strokePath();
    g.generateTexture("npc-shop", 32, 32);

    // ── クエスト NPC ──
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 29, 20, 7);
    g.fillStyle(0xa78bfa, 1);
    g.fillCircle(16, 15, 12);
    g.fillStyle(0xc4b5fd, 0.3);
    g.fillCircle(12, 11, 8);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(12, 13, 2.5);
    g.fillCircle(20, 13, 2.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 1.2);
    g.fillCircle(21, 12, 1.2);
    // ！マーク（グロウ付き）
    g.fillStyle(0xfbbf24, 0.3);
    g.fillCircle(16, 5, 6);
    g.fillStyle(0xfde68a, 1);
    g.fillRoundedRect(14, 0, 4, 6, 1);
    g.fillCircle(16, 9, 2);
    g.lineStyle(2, 0x1e293b, 0.9);
    g.beginPath();
    g.arc(16, 17, 4, 0.1, Math.PI - 0.1, false);
    g.strokePath();
    g.generateTexture("npc-quest", 32, 32);

    // ── パーティクルテクスチャ（高品質グラデーション） ──
    // 光の粒
    g.clear();
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-white", 8, 8);

    // 星型パーティクル
    g.clear();
    g.fillStyle(0xfbbf24, 0.5);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-star", 8, 8);

    // 炎パーティクル
    g.clear();
    g.fillStyle(0xf97316, 0.5);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-fire", 8, 8);

    // 水パーティクル
    g.clear();
    g.fillStyle(0x3b82f6, 0.5);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x93c5fd, 0.8);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-water", 8, 8);

    // 草パーティクル
    g.clear();
    g.fillStyle(0x22c55e, 0.5);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x4ade80, 0.9);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-grass", 8, 8);

    // 電気パーティクル
    g.clear();
    g.fillStyle(0xeab308, 0.4);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(2, 0, 4, 8);
    g.fillRect(0, 2, 8, 4);
    g.generateTexture("particle-electric", 8, 8);

    // 氷パーティクル
    g.clear();
    g.fillStyle(0x06b6d4, 0.4);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x67e8f9, 0.9);
    g.fillCircle(4, 4, 2.5);
    g.fillStyle(0xecfeff, 0.6);
    g.fillCircle(3, 3, 1);
    g.generateTexture("particle-ice", 8, 8);

    // ヒットエフェクト（きらめくスター）
    g.clear();
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(8, 0); g.lineTo(10, 6); g.lineTo(16, 8);
    g.lineTo(10, 10); g.lineTo(8, 16); g.lineTo(6, 10);
    g.lineTo(0, 8); g.lineTo(6, 6);
    g.closePath();
    g.fillPath();
    g.generateTexture("particle-hit", 16, 16);

    g.destroy();
  }

  generateFieldTileVariants(g) {
    this.generateTileSet(g, "tile-ground", 4, (variant) => {
      g.clear();
      g.fillStyle(0x19273a, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x223247, 0.45);
      g.fillRect(0, 0, 32, 12);
      for (let i = 0; i < 34; i++) {
        const n = this._noise(variant * 131 + i * 17);
        const m = this._noise(variant * 191 + i * 31);
        const px = 1 + Math.floor(n * 30);
        const py = 1 + Math.floor(m * 30);
        const size = 1 + Math.floor(this._noise(variant * 59 + i * 13) * 2.5);
        g.fillStyle(0x101b2a + (i % 3) * 0x080808, 0.28 + (i % 4) * 0.08);
        g.fillRect(px, py, size, 1 + (i % 2));
      }
      g.lineStyle(1, 0x0f172a, 0.4);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-grass", 4, (variant) => {
      g.clear();
      g.fillStyle(0x0a3f22, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x14532d, 0.55);
      g.fillRect(0, 16, 32, 16);
      for (let i = 0; i < 16; i++) {
        const px = 1 + Math.floor(this._noise(variant * 71 + i * 23) * 28);
        const py = 2 + Math.floor(this._noise(variant * 97 + i * 19) * 25);
        const h = 4 + Math.floor(this._noise(variant * 167 + i * 11) * 7);
        const shade = [0x16a34a, 0x15803d, 0x22c55e][i % 3];
        g.fillStyle(shade, 0.5 + (i % 4) * 0.1);
        g.beginPath();
        g.moveTo(px + 1, py);
        g.lineTo(px - 1, py + h);
        g.lineTo(px + 3, py + h);
        g.closePath();
        g.fillPath();
      }
      g.fillStyle(0x86efac, 0.2);
      g.fillCircle(5 + variant * 5, 6 + variant * 3, 1.2);
      g.fillCircle(22 - variant * 2, 22 - variant, 1);
      g.lineStyle(1, 0x052e16, 0.35);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-wall", 3, (variant) => {
      g.clear();
      g.fillStyle(0x3d4d63, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x54637b, 0.35);
      g.fillRect(0, 0, 32, 12);
      g.lineStyle(1, 0x2a3443, 0.8);
      const yOffset = variant % 2;
      for (let row = 0; row < 4; row++) {
        const y = row * 8 + yOffset;
        const shift = row % 2 === 0 ? 0 : 8;
        for (let x = -shift; x < 32; x += 16) {
          g.strokeRect(x + 1, y + 1, 14, 6);
        }
      }
      g.fillStyle(0x93a2ba, 0.15);
      g.fillRect(2 + variant * 2, 3, 8, 2);
      g.lineStyle(1, 0x1e293b, 0.7);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-floor", 2, (variant) => {
      g.clear();
      g.fillStyle(0xcfd5df, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(variant === 0 ? 0xbdc6d2 : 0xc4ccd7, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillRect(16, 16, 16, 16);
      g.fillStyle(0xffffff, 0.22);
      g.fillRect(1, 1, 14, 5);
      g.fillRect(17, 17, 14, 5);
      g.lineStyle(1, 0xa9b2be, 0.35);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-door", 2, (variant) => {
      g.clear();
      g.fillStyle(0x7c3a0a, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x8b4513, 0.4);
      g.fillRect(0, 0, 32, 4);
      g.fillRect(0, 10, 32, 2);
      g.fillRect(0, 20, 32, 2);
      g.fillRect(0, 28, 32, 4);
      g.lineStyle(1.5, 0x5c2d0a, 0.9);
      g.strokeRect(4, 3, 24, 11);
      g.strokeRect(4, 18, 24, 11);
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(variant === 0 ? 24 : 8, 18, 3);
      g.fillStyle(0xfde68a, 0.6);
      g.fillCircle(variant === 0 ? 23 : 7, 17, 1.5);
      g.lineStyle(1.5, 0x451a03, 1);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-forest", 4, (variant) => {
      g.clear();
      g.fillStyle(0x052e16, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x0a3d1f, 0.5);
      g.fillRect(2, 24, 10, 4);
      g.fillRect(20, 26, 8, 3);
      const trunkX = 12 + (variant % 3);
      g.fillStyle(0x5c3d1e, 1);
      g.fillRect(trunkX, 16, 5, 16);
      g.fillStyle(0x7a5230, 0.4);
      g.fillRect(trunkX, 16, 2, 16);
      g.fillStyle(0x15803d, 1);
      g.beginPath();
      g.moveTo(16, 2 + (variant % 2));
      g.lineTo(3, 18);
      g.lineTo(29, 18);
      g.closePath();
      g.fillPath();
      g.fillStyle(0x22c55e, 0.6);
      g.beginPath();
      g.moveTo(16, 6);
      g.lineTo(6, 20);
      g.lineTo(26, 20);
      g.closePath();
      g.fillPath();
      g.fillStyle(0x4ade80, 0.2);
      g.beginPath();
      g.moveTo(16, 4);
      g.lineTo(10, 12);
      g.lineTo(20, 12);
      g.closePath();
      g.fillPath();
      g.lineStyle(1, 0x022c22, 0.5);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-water", 4, (variant) => {
      g.clear();
      g.fillStyle(0x1e3a8a, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x1e40af, 0.55);
      g.fillRect(0, 16, 32, 16);
      g.lineStyle(1.4, 0x60a5fa, 0.42);
      for (let row = 0; row < 4; row++) {
        g.beginPath();
        g.moveTo(0, 6 + row * 8);
        for (let x = 0; x <= 32; x += 2) {
          g.lineTo(x, 6 + row * 8 + Math.sin(x * 0.34 + row * 1.15 + variant) * 2.2);
        }
        g.strokePath();
      }
      g.fillStyle(0x93c5fd, 0.35);
      g.fillCircle(8 + variant, 9 + variant, 1.3);
      g.fillCircle(23 - variant, 22, 1);
      g.lineStyle(1, 0x1e3a8a, 0.4);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-gym", 2, (variant) => {
      g.clear();
      g.fillStyle(0x6d28d9, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7c3aed, 0.4);
      g.fillRect(0, 0, 32, 16);
      g.fillStyle(0xfde68a, 1);
      g.beginPath();
      g.moveTo(16, 4);
      g.lineTo(19 + variant, 12);
      g.lineTo(28, 12);
      g.lineTo(21, 18);
      g.lineTo(24 - variant, 27);
      g.lineTo(16, 22);
      g.lineTo(8 + variant, 27);
      g.lineTo(11, 18);
      g.lineTo(4, 12);
      g.lineTo(13, 12);
      g.closePath();
      g.fillPath();
      g.fillStyle(0xfbbf24, 0.2);
      g.fillCircle(16, 16, 12);
      g.lineStyle(1.5, 0x4c1d95, 1);
      g.strokeRect(0.5, 0.5, 31, 31);
    });

    this.generateTileSet(g, "tile-path", 4, (variant) => {
      g.clear();
      g.fillStyle(0x6b6358, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7a7268, 0.28);
      g.fillRect(0, 0, 32, 10);
      const pathColors = [0x605a50, 0x78716c, 0x5c5650, 0x8a8278];
      for (let i = 0; i < 24; i++) {
        const px = 2 + Math.floor(this._noise(variant * 103 + i * 17) * 26);
        const py = 2 + Math.floor(this._noise(variant * 47 + i * 31) * 26);
        g.fillStyle(pathColors[i % pathColors.length], 0.45 + (i % 3) * 0.12);
        g.fillRect(px, py, 2 + (i % 3), 1 + (i % 2));
      }
      g.lineStyle(1, 0x44403c, 0.45);
      g.strokeRect(0.5, 0.5, 31, 31);
    });
  }

  generateTileSet(g, key, variants, painter) {
    for (let variant = 0; variant < variants; variant++) {
      painter(variant);
      const textureKey = variant === 0 ? key : `${key}-${variant}`;
      g.generateTexture(textureKey, 32, 32);
    }
  }

  _noise(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}

