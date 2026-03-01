import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";

type TitleSceneLike = Phaser.Scene & Record<string, any>;

const NAME_KEYBOARD_KEYS = [
  "あ", "い", "う", "え", "お", "か",
  "き", "く", "け", "こ", "さ", "し",
  "す", "せ", "そ", "た", "ち", "つ",
  "て", "と", "な", "に", "ぬ", "ね",
  "の", "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ", "ん", "けす", "おわる",
];

const NAME_KEYBOARD_COLS = 6;

export function showNameSelect(scene: TitleSceneLike): void {
  const { width, height } = scene.scale;

  if (scene.namePanel) scene.namePanel.destroy(true);
  scene.namePanel = scene.add.container(0, 0);

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
  scene.namePanel.add(overlay);

  const panelW = 452;
  const panelH = Math.min(440, height - 24);
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, panelH, { headerHeight: 36, glow: true });
  scene.namePanel.add(bg);

  scene.namePanel.add(scene.add.text(width / 2, panelY + 18, "なまえを にゅうりょくしてね！", {
    fontFamily: FONT.UI,
    fontSize: 15,
    color: "#fde68a",
  }).setOrigin(0.5, 0));

  const inputBg = scene.add.graphics();
  drawSelection(inputBg, width / 2 - 145, panelY + 68, 290, 44, { radius: 8 });
  scene.namePanel.add(inputBg);

  scene._nameInput = "";
  scene._nameInputText = scene.add.text(width / 2, panelY + 78, "", {
    fontFamily: FONT.UI,
    fontSize: 24,
    color: "#e5e7eb",
    align: "center",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(scene._nameInputText);

  const guide = scene.add.text(width / 2, panelY + 124, "↑↓←→: もじをえらぶ（最大8文字）", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(guide);

  const controls = scene.add.text(width / 2, panelY + 150, "Z/Enter: 入力  けす: 1文字削除", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(controls);

  const confirmHint = scene.add.text(width / 2, panelY + 176, "おわる: けってい  X: もどる", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(confirmHint);

  scene._nameKeyboardKeys = [...NAME_KEYBOARD_KEYS];
  scene._nameKeyboardCols = NAME_KEYBOARD_COLS;
  scene._nameKeyboardIndex = 0;
  scene._nameKeyboardButtons = [];

  const keyStartX = width / 2 - 186;
  const keyStartY = panelY + 204;
  const keyW = 54;
  const keyH = 30;
  const keyGapX = 10;
  const keyGapY = 8;

  scene._nameKeyboardKeys.forEach((label: string, index: number) => {
    const col = index % scene._nameKeyboardCols;
    const row = Math.floor(index / scene._nameKeyboardCols);
    const x = keyStartX + col * (keyW + keyGapX);
    const y = keyStartY + row * (keyH + keyGapY);

    const bgKey = scene.add.graphics();
    scene.namePanel.add(bgKey);

    const text = scene.add.text(x + keyW / 2, y + keyH / 2, label, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: "#e2e8f0",
    }).setOrigin(0.5);
    scene.namePanel.add(text);

    scene._nameKeyboardButtons.push({ bgKey, text, x, y, w: keyW, h: keyH, label });
  });

  updateNameDisplay(scene);
  updateNameKeyboardDisplay(scene);
  scene._nameActive = true;
  scene._bindNameSelectKeyboardHandlers();
}

export function updateNameDisplay(scene: TitleSceneLike): void {
  if (!scene._nameInputText) return;
  const hasText = Array.from(scene._nameInput || "").length > 0;
  const display = hasText ? formatNameForDisplay(scene._nameInput, 5) : "なまえ";
  scene._nameInputText.setText(display);
  scene._nameInputText.setFontSize(display.includes("\n") ? 18 : 24);
  scene._nameInputText.setColor(hasText ? "#e5e7eb" : "#94a3b8");
}

export function formatNameForDisplay(value: string, chunkSize: number): string {
  const chars = Array.from(value || "");
  if (chars.length <= chunkSize) return chars.join("");

  const lines = [];
  for (let i = 0; i < chars.length; i += chunkSize) {
    lines.push(chars.slice(i, i + chunkSize).join(""));
  }

  return lines.join("\n");
}

export function confirmName(scene: TitleSceneLike): void {
  if (!scene._nameActive) return;
  const key = scene._nameKeyboardKeys?.[scene._nameKeyboardIndex];
  if (!key) return;

  if (key === "けす") {
    deleteNameChar(scene);
    return;
  }

  if (key === "おわる") {
    const normalized = (scene._nameInput || "").trim();
    const name = normalized.length > 0 ? normalized : "ユウ";
    scene._doStartNewGame(name);
    return;
  }

  const next = `${scene._nameInput || ""}${key}`;
  scene._nameInput = truncateName(next, 8);
  audioManager.playCursor();
  updateNameDisplay(scene);
}

export function handleNameKeyboardNavigation(scene: TitleSceneLike): void {
  if (!scene._nameActive) return;
  const keyCount = scene._nameKeyboardKeys?.length || 0;
  const cols = scene._nameKeyboardCols || 1;
  if (keyCount === 0) return;

  let moved = false;
  if (Phaser.Input.Keyboard.JustDown(scene.cursors.left)) {
    scene._nameKeyboardIndex = (scene._nameKeyboardIndex - 1 + keyCount) % keyCount;
    moved = true;
  } else if (Phaser.Input.Keyboard.JustDown(scene.cursors.right)) {
    scene._nameKeyboardIndex = (scene._nameKeyboardIndex + 1) % keyCount;
    moved = true;
  } else if (Phaser.Input.Keyboard.JustDown(scene.cursors.up)) {
    scene._nameKeyboardIndex = (scene._nameKeyboardIndex - cols + keyCount) % keyCount;
    moved = true;
  } else if (Phaser.Input.Keyboard.JustDown(scene.cursors.down)) {
    scene._nameKeyboardIndex = (scene._nameKeyboardIndex + cols) % keyCount;
    moved = true;
  }

  if (moved) {
    audioManager.playCursor();
    updateNameKeyboardDisplay(scene);
  }
}

export function updateNameKeyboardDisplay(scene: TitleSceneLike): void {
  if (!scene._nameKeyboardButtons) return;
  scene._nameKeyboardButtons.forEach((button: Record<string, any>, index: number) => {
    const selected = index === scene._nameKeyboardIndex;
    button.bgKey.clear();
    button.bgKey.fillStyle(selected ? 0x1f2937 : 0x0f172a, selected ? 0.94 : 0.7);
    button.bgKey.fillRoundedRect(button.x, button.y, button.w, button.h, 8);
    button.bgKey.lineStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
    button.bgKey.strokeRoundedRect(button.x, button.y, button.w, button.h, 8);
    button.text.setColor(selected ? "#fde68a" : "#e2e8f0");
  });
}

export function deleteNameChar(scene: TitleSceneLike): void {
  if (!scene._nameActive) return;
  const chars = Array.from(scene._nameInput || "");
  if (chars.length === 0) return;
  chars.pop();
  scene._nameInput = chars.join("");
  audioManager.playCursor();
  updateNameDisplay(scene);
}

export function truncateName(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join("");
}

export function closeNameSelect(scene: TitleSceneLike): void {
  scene._nameActive = false;
  if (scene.namePanel) {
    scene.namePanel.destroy(true);
    scene.namePanel = null;
  }
  scene._nameKeyboardButtons = [];
  scene._bindDefaultKeyboardHandlers();
}
