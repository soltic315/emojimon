/**
 * UIHelper - プロフェッショナルなUI描画のためのデザインシステム
 * 全シーンで一貫したビジュアルスタイルを提供する
 */

// ── フォント定義 ──
export const FONT = {
  /** タイトルロゴ用（太字・装飾的） */
  TITLE: "'M PLUS Rounded 1c', 'Segoe UI', system-ui, sans-serif",
  /** UI全般（メニュー、メッセージ、ラベル） */
  UI: "'M PLUS Rounded 1c', 'Segoe UI', system-ui, sans-serif",
  /** 数値・ステータス表示用モノスペース */
  MONO: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
};

// ── カラーパレット ──
export const COLORS = {
  // パネル背景
  PANEL_BG: 0x0d1117,
  PANEL_BG_ALT: 0x161b22,
  PANEL_HEADER: 0x1c2333,
  PANEL_BORDER: 0x30363d,
  PANEL_BORDER_LIGHT: 0x484f58,

  // アクセント
  GOLD: 0xf59e0b,
  GOLD_LIGHT: 0xfde68a,
  GOLD_DARK: 0xb45309,
  AMBER_GLOW: 0xfbbf24,
  BLUE: 0x3b82f6,
  BLUE_LIGHT: 0x93c5fd,
  INDIGO: 0x6366f1,
  RED: 0xef4444,
  RED_LIGHT: 0xfca5a5,

  // HP バー
  HP_HIGH: 0x22c55e,
  HP_HIGH_LIGHT: 0x4ade80,
  HP_MID: 0xeab308,
  HP_MID_LIGHT: 0xfbbf24,
  HP_LOW: 0xef4444,
  HP_LOW_LIGHT: 0xf87171,

  // EXP バー
  EXP: 0x6366f1,
  EXP_LIGHT: 0x818cf8,

  // 選択ハイライト
  SELECT_BG: 0xf59e0b,
  SELECT_BORDER: 0xfcd34d,
  SELECT_FOCUS: 0xfef3c7,

  // タイプカラー（hex 数値）
  TYPE_HEX: {
    FIRE: 0xf97316,
    WATER: 0x3b82f6,
    GRASS: 0x22c55e,
    NORMAL: 0x6b7280,
    ELECTRIC: 0xeab308,
    ICE: 0x06b6d4,
  },
};

// ── テキストカラー（CSS文字列） ──
export const TEXT_COLORS = {
  PRIMARY: "#f0f6fc",
  SECONDARY: "#8b949e",
  ACCENT: "#fbbf24",
  GOLD: "#fde68a",
  MUTED: "#636e7b",
  WHITE: "#ffffff",
  DANGER: "#f87171",
  SUCCESS: "#4ade80",
  INFO: "#93c5fd",
  // タイプ色
  FIRE: "#fb923c",
  WATER: "#60a5fa",
  GRASS: "#4ade80",
  NORMAL: "#9ca3af",
  ELECTRIC: "#fbbf24",
  ICE: "#67e8f9",
};

/**
 * プロフェッショナルなパネル背景を描画する
 * ドロップシャドウ、ヘッダーグラデーション、インナーグロウ付き
 *
 * @param {Phaser.GameObjects.Graphics} g - Phaserグラフィックスオブジェクト
 * @param {number} x - パネルのX座標
 * @param {number} y - パネルのY座標
 * @param {number} w - パネル幅
 * @param {number} h - パネル高さ
 * @param {object} opts - オプション設定
 */
export function drawPanel(g, x, y, w, h, opts = {}) {
  const {
    radius = 14,
    bgAlpha = 0.97,
    headerHeight = 0,
    shadow = true,
    glow = false,
    borderColor = COLORS.PANEL_BORDER,
    borderWidth = 2,
    bgColor = COLORS.PANEL_BG,
  } = opts;

  // ドロップシャドウ（二重で柔らかく）
  if (shadow) {
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(x + 5, y + 5, w, h, radius);
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(x + 2, y + 2, w + 1, h + 1, radius);
  }

  // メイン背景
  g.fillStyle(bgColor, bgAlpha);
  g.fillRoundedRect(x, y, w, h, radius);

  // ヘッダーグラデーション
  if (headerHeight > 0) {
    g.fillStyle(COLORS.PANEL_HEADER, 0.45);
    g.fillRoundedRect(x, y, w, headerHeight, { tl: radius, tr: radius, bl: 0, br: 0 });
    // ヘッダー下のセパレータライン
    g.lineStyle(1, COLORS.PANEL_BORDER, 0.35);
    g.lineBetween(x + radius, y + headerHeight, x + w - radius, y + headerHeight);
  } else {
    // ヘッダーが無い場合でも上部を少し明るく
    g.fillStyle(COLORS.PANEL_HEADER, 0.25);
    g.fillRoundedRect(x, y, w, Math.min(h, h * 0.12), { tl: radius, tr: radius, bl: 0, br: 0 });
  }

  // インナーハイライト（上端の光沢）
  g.lineStyle(1, 0xffffff, 0.06);
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, Math.max(0, radius - 1));

  // オプション：アクセントグロウ
  if (glow) {
    g.lineStyle(3, COLORS.GOLD, 0.12);
    g.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, radius + 1);
  }

  // メインボーダー
  g.lineStyle(borderWidth, borderColor, 0.85);
  g.strokeRoundedRect(x, y, w, h, radius);
}

/**
 * 選択ハイライトを描画する
 *
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {object} opts
 */
export function drawSelection(g, x, y, w, h, opts = {}) {
  const {
    radius = 8,
    glowColor = COLORS.SELECT_BG,
    borderColor = COLORS.SELECT_BORDER,
    intensity = 1.0,
  } = opts;

  // アウターグロウ
  g.fillStyle(glowColor, 0.06 * intensity);
  g.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, radius + 4);

  // 背景フィル
  g.fillStyle(glowColor, 0.15 * intensity);
  g.fillRoundedRect(x, y, w, h, radius);

  // ボーダー
  g.lineStyle(1.5, borderColor, 0.85 * intensity);
  g.strokeRoundedRect(x, y, w, h, radius);

  // トップハイライトライン
  g.lineStyle(1, 0xffffff, 0.07 * intensity);
  g.lineBetween(x + radius, y + 1, x + w - radius, y + 1);
}

/**
 * HPバーを描画する
 * グラデーション + シャイン効果 + 色段階変化
 *
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x
 * @param {number} y
 * @param {number} w - バーの全幅
 * @param {number} h - バーの高さ
 * @param {number} ratio - HP割合 (0.0 ~ 1.0)
 */
export function drawHpBar(g, x, y, w, h, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));

  // 背景（凹み効果）
  g.fillStyle(0x0d1117, 1);
  g.fillRoundedRect(x, y, w, h, h / 2);
  g.fillStyle(0x1f2937, 0.8);
  g.fillRoundedRect(x + 1, y + 1, w - 2, h - 2, (h - 2) / 2);
  g.lineStyle(1, 0x30363d, 0.6);
  g.strokeRoundedRect(x, y, w, h, h / 2);

  const fillW = Math.max(0, (w - 4) * ratio);
  if (fillW <= 0) return;

  // カラー選択
  let mainColor, lightColor;
  if (ratio > 0.5) {
    mainColor = COLORS.HP_HIGH;
    lightColor = COLORS.HP_HIGH_LIGHT;
  } else if (ratio > 0.25) {
    mainColor = COLORS.HP_MID;
    lightColor = COLORS.HP_MID_LIGHT;
  } else {
    mainColor = COLORS.HP_LOW;
    lightColor = COLORS.HP_LOW_LIGHT;
  }

  // メインフィル
  g.fillStyle(mainColor, 1);
  g.fillRoundedRect(x + 2, y + 2, fillW, h - 4, (h - 4) / 2);

  // 下部を暗くして擬似グラデーション
  g.fillStyle(0x000000, 0.2);
  g.fillRect(x + 3, y + h / 2, Math.max(0, fillW - 2), h / 2 - 3);

  // 上部シャイン
  if (fillW > 6) {
    g.fillStyle(lightColor, 0.35);
    g.fillRoundedRect(x + 3, y + 3, fillW - 2, Math.max(1, (h - 6) / 3), Math.max(1, (h - 6) / 3));
  }
}

/**
 * EXPバーを描画する
 *
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} ratio - EXP割合 (0.0 ~ 1.0)
 */
export function drawExpBar(g, x, y, w, h, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));

  // 背景
  g.fillStyle(0x0d1117, 1);
  g.fillRoundedRect(x, y, w, h, h / 2);
  g.lineStyle(1, 0x1f2937, 0.6);
  g.strokeRoundedRect(x, y, w, h, h / 2);

  const fillW = Math.max(0, (w - 2) * ratio);
  if (fillW <= 0) return;

  // メインフィル
  g.fillStyle(COLORS.EXP, 1);
  g.fillRoundedRect(x + 1, y + 1, fillW, h - 2, (h - 2) / 2);

  // シャイン
  if (fillW > 4) {
    g.fillStyle(COLORS.EXP_LIGHT, 0.3);
    g.fillRoundedRect(x + 2, y + 2, fillW - 2, Math.max(1, (h - 4) / 3), Math.max(1, (h - 4) / 3));
  }
}

/**
 * タイプに応じたバッジを描画する
 * 角丸の背景付きタイプラベル
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} type - タイプ名 (FIRE, WATER, etc.)
 * @param {object} opts
 * @returns {Phaser.GameObjects.Container}
 */
export function createTypeBadge(scene, x, y, type, opts = {}) {
  const { scale = 1.0 } = opts;
  const typeColor = COLORS.TYPE_HEX[type] || 0x6b7280;
  const typeTextColor = TEXT_COLORS[type] || TEXT_COLORS.NORMAL;
  const typeLabels = {
    FIRE: "ほのお",
    WATER: "みず",
    GRASS: "くさ",
    NORMAL: "ノーマル",
    ELECTRIC: "でんき",
    ICE: "こおり",
  };
  const label = typeLabels[type] || type;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const badgeW = 56 * scale;
  const badgeH = 18 * scale;
  bg.fillStyle(typeColor, 0.25);
  bg.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, badgeH / 2);
  bg.lineStyle(1, typeColor, 0.7);
  bg.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, badgeH / 2);
  container.add(bg);

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT.UI,
    fontSize: 10 * scale,
    color: typeTextColor,
    fontStyle: "bold",
  }).setOrigin(0.5);
  container.add(text);

  return container;
}

/**
 * テキスト生成のショートカット（統一フォント適用）
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} content
 * @param {object} style - Phaser TextStyle 追加設定
 * @returns {Phaser.GameObjects.Text}
 */
export function createText(scene, x, y, content, style = {}) {
  const defaultStyle = {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: TEXT_COLORS.PRIMARY,
  };
  return scene.add.text(x, y, content, { ...defaultStyle, ...style });
}

/**
 * 背景の微光パーティクルを生成する
 * ふわふわ浮く光の粒でプロフェッショナルな空気感を演出
 *
 * @param {Phaser.Scene} scene
 * @param {number} count - パーティクル数
 * @param {object} opts
 */
export function createAmbientParticles(scene, count = 15, opts = {}) {
  const { width, height } = scene.scale;
  const {
    color = 0xffffff,
    minAlpha = 0.03,
    maxAlpha = 0.12,
    minSize = 1,
    maxSize = 3,
  } = opts;

  for (let i = 0; i < count; i++) {
    const spark = scene.add.circle(
      Math.random() * width,
      Math.random() * height,
      minSize + Math.random() * (maxSize - minSize),
      color,
      minAlpha + Math.random() * (maxAlpha - minAlpha),
    );
    scene.tweens.add({
      targets: spark,
      y: spark.y - (15 + Math.random() * 40),
      alpha: 0,
      duration: 2200 + Math.random() * 1800,
      repeat: -1,
      ease: "sine.out",
      delay: Math.random() * 2000,
      onRepeat: () => {
        spark.x = Math.random() * width;
        spark.y = height + 10;
        spark.alpha = minAlpha + Math.random() * (maxAlpha - minAlpha);
      },
    });
  }
}

/**
 * フィールド上の天候カラーテーマを取得
 *
 * @param {string} weather - 天候キー
 * @returns {object} { primary, secondary, text }
 */
export function getWeatherColors(weather) {
  switch (weather) {
    case "SUNNY":
      return { primary: 0xf97316, secondary: 0xfbbf24, text: "#fb923c" };
    case "RAINY":
      return { primary: 0x3b82f6, secondary: 0x60a5fa, text: "#60a5fa" };
    case "WINDY":
      return { primary: 0x22c55e, secondary: 0x4ade80, text: "#4ade80" };
    default:
      return { primary: 0x6b7280, secondary: 0x9ca3af, text: "#9ca3af" };
  }
}
