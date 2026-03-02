import { gameState } from "../../state/gameState.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, COLORS, TEXT_COLORS, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { applyKeyboardInput, GAME_KEYBOARD_COLS, GAME_KEYBOARD_KEYS, getNextKeyboardIndex } from "../../ui/gameKeyboard.ts";

type MenuSceneLike = Phaser.Scene & Record<string, any>;

export function handleNicknameShortcut(scene: MenuSceneLike) {
  if (!scene.subMenuActive || scene.subMenuType !== "party") return;
  if (scene.partySwapMode || scene.partyFusionMode) return;
  const mon = gameState.party[scene.subMenuIndex];
  if (!mon || !mon.species) return;

  openNicknameKeyboard(scene, mon);
}

export function openNicknameKeyboard(scene: MenuSceneLike, monster: any) {
  if (!monster) return;

  scene.nicknameInputActive = true;
  scene.nicknameTargetMonster = monster;
  scene.nicknameInput = (monster.nickname || "").slice(0, 12);
  scene.nicknameKeyboardIndex = 0;
  scene.nicknameKeyboardCols = GAME_KEYBOARD_COLS;
  scene.nicknameKeyboardKeys = [...GAME_KEYBOARD_KEYS];
  scene.nicknameKeyboardButtons = [];

  if (scene.nicknamePanel) {
    scene.nicknamePanel.destroy(true);
    scene.nicknamePanel = null;
  }

  const { width, height } = scene.scale;
  const panelY = 26;
  scene.nicknamePanel = scene.add.container(0, 0).setDepth(2000);

  const shade = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58);
  scene.nicknamePanel.add(shade);

  const panelBg = scene.add.graphics();
  drawPanel(panelBg, width / 2 - 220, panelY, 440, height - 52, {
    radius: 12,
    headerHeight: 26,
    bgAlpha: 0.96,
    glow: true,
    borderColor: COLORS.SELECT_BORDER,
  });
  scene.nicknamePanel.add(panelBg);

  const title = scene.add.text(width / 2, panelY + 12, `${monster.species.emoji} ニックネーム入力`, {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: TEXT_COLORS.ACCENT,
  }).setOrigin(0.5, 0);
  scene.nicknamePanel.add(title);

  const inputBg = scene.add.graphics();
  drawSelection(inputBg, width / 2 - 150, panelY + 56, 300, 42, { radius: 8 });
  scene.nicknamePanel.add(inputBg);

  scene.nicknameInputText = scene.add.text(width / 2, panelY + 66, "", {
    fontFamily: FONT.UI,
    fontSize: 22,
    color: "#e5e7eb",
    align: "center",
  }).setOrigin(0.5, 0);
  scene.nicknamePanel.add(scene.nicknameInputText);

  const guide = scene.add.text(width / 2, panelY + 106, "↑↓←→: もじ選択（最大12文字）", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.nicknamePanel.add(guide);

  const controls = scene.add.text(width / 2, panelY + 126, "Z/Enter/Space: 入力  ぜんけし: 全削除  X: キャンセル", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.nicknamePanel.add(controls);

  const keyStartX = width / 2 - 193;
  const keyStartY = panelY + 154;
  const keyW = 50;
  const keyH = 28;
  const keyGapX = 6;
  const keyGapY = 6;

  scene.nicknameKeyboardKeys.forEach((label: string, index: number) => {
    const col = index % scene.nicknameKeyboardCols;
    const row = Math.floor(index / scene.nicknameKeyboardCols);
    const x = keyStartX + col * (keyW + keyGapX);
    const y = keyStartY + row * (keyH + keyGapY);

    const bgKey = scene.add.graphics();
    const text = scene.add.text(x + keyW / 2, y + keyH / 2, label, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: "#e2e8f0",
    }).setOrigin(0.5);
    scene.nicknamePanel.add(bgKey);
    scene.nicknamePanel.add(text);
    scene.nicknameKeyboardButtons.push({ bgKey, text, x, y, w: keyW, h: keyH });
  });

  updateNicknameInputDisplay(scene);
  updateNicknameKeyboardDisplay(scene);
}

export function handleNicknameKeyboardNavigation(scene: MenuSceneLike) {
  if (!scene.nicknameInputActive) return;
  const keyCount = scene.nicknameKeyboardKeys?.length || 0;
  const cols = scene.nicknameKeyboardCols || 1;
  if (keyCount === 0) return;

  const nextIndex = getNextKeyboardIndex(scene.nicknameKeyboardIndex, keyCount, cols, {
    left: Phaser.Input.Keyboard.JustDown(scene.cursors.left),
    right: Phaser.Input.Keyboard.JustDown(scene.cursors.right),
    up: Phaser.Input.Keyboard.JustDown(scene.cursors.up),
    down: Phaser.Input.Keyboard.JustDown(scene.cursors.down),
  });
  const moved = nextIndex !== scene.nicknameKeyboardIndex;
  scene.nicknameKeyboardIndex = nextIndex;

  if (moved) {
    audioManager.playCursor();
    updateNicknameKeyboardDisplay(scene);
  }
}

export function confirmNicknameInput(scene: MenuSceneLike) {
  if (!scene.nicknameInputActive) return;
  const key = scene.nicknameKeyboardKeys?.[scene.nicknameKeyboardIndex];
  if (!key) return;

  const result = applyKeyboardInput(scene.nicknameInput || "", key, 12);
  if (result.submitted) {
    closeNicknameKeyboard(scene, true);
    return;
  }

  scene.nicknameInput = result.value;
  audioManager.playCursor();
  updateNicknameInputDisplay(scene);
}

export function deleteNicknameChar(scene: MenuSceneLike) {
  const result = applyKeyboardInput(scene.nicknameInput || "", "けす", 12);
  if (result.value === (scene.nicknameInput || "")) return;
  scene.nicknameInput = result.value;
  audioManager.playCursor();
  updateNicknameInputDisplay(scene);
}

export function updateNicknameInputDisplay(scene: MenuSceneLike) {
  if (!scene.nicknameInputText) return;
  const chars = Array.from(scene.nicknameInput || "");
  const hasText = chars.length > 0;
  const display = hasText ? chars.join("") : "（元の名前）";
  scene.nicknameInputText.setText(display);
  scene.nicknameInputText.setColor(hasText ? "#e5e7eb" : "#94a3b8");
}

export function updateNicknameKeyboardDisplay(scene: MenuSceneLike) {
  if (!scene.nicknameKeyboardButtons) return;
  scene.nicknameKeyboardButtons.forEach((button: any, index: number) => {
    const selected = index === scene.nicknameKeyboardIndex;
    button.bgKey.clear();
    button.bgKey.fillStyle(selected ? 0x1f2937 : 0x0f172a, selected ? 0.94 : 0.7);
    button.bgKey.fillRoundedRect(button.x, button.y, button.w, button.h, 8);
    button.bgKey.lineStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
    button.bgKey.strokeRoundedRect(button.x, button.y, button.w, button.h, 8);
    button.text.setColor(selected ? "#fde68a" : "#e2e8f0");
  });
}

export function closeNicknameKeyboard(scene: MenuSceneLike, applyChanges: boolean) {
  const mon = scene.nicknameTargetMonster;
  const normalized = (scene.nicknameInput || "").trim().slice(0, 12);

  if (applyChanges && mon && mon.species) {
    mon.nickname = normalized.length > 0 ? normalized : null;
    audioManager.playConfirm();
    if (mon.nickname) {
      scene._showPartyMessage(`${mon.species.name}に「${mon.nickname}」というニックネームをつけた！`);
    } else {
      scene._showPartyMessage(`${mon.species.name}のニックネームを元に戻した！`);
    }
    scene._renderSubMenu();
  }

  if (scene.nicknamePanel) {
    scene.nicknamePanel.destroy(true);
    scene.nicknamePanel = null;
  }
  scene.nicknameInputActive = false;
  scene.nicknameTargetMonster = null;
  scene.nicknameInput = "";
  scene.nicknameKeyboardButtons = [];
  scene.nicknameInputText = null;
}
