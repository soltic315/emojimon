import { gameState } from "../../state/gameState.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, applyCanvasBrightness, drawPanel } from "../../ui/UIHelper.ts";
import { buildUnifiedSettingsRows, clampScreenBrightness } from "../menu/settingsShared.ts";

type TitleSceneLike = Phaser.Scene & Record<string, any>;
type SettingsMutator = (audio: Record<string, any>, gameplay: Record<string, any>) => void;

export function showSettings(scene: TitleSceneLike): void {
  scene.settingsVisible = true;
  scene.settingsIndex = 0;
  renderSettingsPanel(scene);
}

export function hideSettings(scene: TitleSceneLike): void {
  scene.settingsVisible = false;
  if (scene.settingsPanel) {
    scene.settingsPanel.destroy(true);
    scene.settingsPanel = null;
  }
}

export function applyAudioSettings(scene: TitleSceneLike): void {
  audioManager.applySettings(gameState.audioSettings);
  applyCanvasBrightness(scene, gameState.gameplaySettings?.screenBrightness);
}

export function cycleBattleSpeed(direction = 1): void {
  const order = ["NORMAL", "FAST", "TURBO"];
  const current = gameState.gameplaySettings?.battleSpeed || "NORMAL";
  const idx = Math.max(0, order.indexOf(current));
  const nextIndex = (idx + direction + order.length) % order.length;
  gameState.gameplaySettings.battleSpeed = order[nextIndex];
}

export function updateSettings(scene: TitleSceneLike, mutator: SettingsMutator): void {
  mutator(gameState.audioSettings, gameState.gameplaySettings);
  gameState.audioSettings.bgmVolume = Phaser.Math.Clamp(gameState.audioSettings.bgmVolume, 0, 1);
  gameState.audioSettings.seVolume = Phaser.Math.Clamp(gameState.audioSettings.seVolume, 0, 1);
  gameState.gameplaySettings.screenBrightness = clampScreenBrightness(gameState.gameplaySettings.screenBrightness);
  gameState.saveAudioSettings();
  applyAudioSettings(scene);
  renderSettingsPanel(scene);
}

export function handleSettingsNavigation(scene: TitleSceneLike): void {
  if (Phaser.Input.Keyboard.JustDown(scene.cursors.up)) {
    scene.settingsIndex = (scene.settingsIndex - 1 + scene.settingsRows.length) % scene.settingsRows.length;
    audioManager.playCursor();
    renderSettingsPanel(scene);
    return;
  }

  if (Phaser.Input.Keyboard.JustDown(scene.cursors.down)) {
    scene.settingsIndex = (scene.settingsIndex + 1) % scene.settingsRows.length;
    audioManager.playCursor();
    renderSettingsPanel(scene);
    return;
  }

  const left = Phaser.Input.Keyboard.JustDown(scene.cursors.left);
  const right = Phaser.Input.Keyboard.JustDown(scene.cursors.right);
  if (left || right) {
    const delta = right ? 1 : -1;
    const row = scene.settingsRows[scene.settingsIndex]?.key;
    if (row === "bgm") {
      updateSettings(scene, (audio) => {
        audio.bgmVolume += delta * 0.05;
        audio.muted = false;
      });
      audioManager.playCursor();
    } else if (row === "se") {
      updateSettings(scene, (audio) => {
        audio.seVolume += delta * 0.05;
        audio.muted = false;
      });
      audioManager.playCursor();
    } else if (row === "mute") {
      updateSettings(scene, (audio) => {
        audio.muted = !audio.muted;
      });
      audioManager.playCursor();
    } else if (row === "battleSpeed") {
      updateSettings(scene, () => {
        cycleBattleSpeed(delta >= 0 ? 1 : -1);
      });
      audioManager.playCursor();
    } else if (row === "autoAdvanceMessages" || row === "shortEncounterEffect" || row === "emoSkipEnabled" || row === "autoSaveEnabled") {
      updateSettings(scene, (_, gameplay) => {
        gameplay[row] = !gameplay[row];
      });
      audioManager.playCursor();
    } else if (row === "screenBrightness") {
      updateSettings(scene, (_, gameplay) => {
        gameplay.screenBrightness = clampScreenBrightness((gameplay.screenBrightness || 100) + (delta * 10));
      });
      audioManager.playCursor();
    }
  }
}

export function handleSettingsConfirm(scene: TitleSceneLike): void {
  const row = scene.settingsRows[scene.settingsIndex]?.key;
  if (row === "mute") {
    updateSettings(scene, (audio) => {
      audio.muted = !audio.muted;
    });
    return;
  }

  if (row === "battleSpeed") {
    updateSettings(scene, () => cycleBattleSpeed(1));
    return;
  }

  if (row === "autoAdvanceMessages" || row === "shortEncounterEffect" || row === "emoSkipEnabled" || row === "autoSaveEnabled") {
    updateSettings(scene, (_, gameplay) => {
      gameplay[row] = !gameplay[row];
    });
    return;
  }

  if (row === "screenBrightness") {
    updateSettings(scene, (_, gameplay) => {
      gameplay.screenBrightness = clampScreenBrightness((gameplay.screenBrightness || 100) + 10);
    });
  }
}

export function renderSettingsPanel(scene: TitleSceneLike): void {
  if (!scene.settingsVisible) return;

  if (scene.settingsPanel) {
    scene.settingsPanel.destroy(true);
    scene.settingsPanel = null;
  }

  const { width, height } = scene.scale;
  scene.settingsRows = buildUnifiedSettingsRows(gameState.audioSettings, gameState.gameplaySettings);
  scene.settingsIndex = Phaser.Math.Clamp(scene.settingsIndex, 0, Math.max(0, scene.settingsRows.length - 1));

  scene.settingsPanel = scene.add.container(0, 0);

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
  scene.settingsPanel.add(overlay);

  const panelBg = scene.add.graphics();
  drawPanel(panelBg, 108, 62, width - 216, height - 124, { headerHeight: 44, glow: true });
  scene.settingsPanel.add(panelBg);

  const headerCard = scene.rexUI?.add
    .roundRectangle(width / 2, 92, width - 252, 32, 10, 0x111827, 0.72)
    .setStrokeStyle(1, 0x334155, 0.7);
  if (headerCard) scene.settingsPanel.add(headerCard);

  const title = scene.add.text(width / 2, 92, "設定", {
    fontFamily: FONT.UI,
    fontSize: 24,
    color: "#fde68a",
  }).setOrigin(0.5);
  scene.settingsPanel.add(title);

  const rowCount = Math.max(1, scene.settingsRows.length);
  const listTop = 136;
  const listBottom = height - 130;
  const availableHeight = Math.max(220, listBottom - listTop);
  const rowGap = rowCount > 1
    ? Phaser.Math.Clamp(Math.floor(availableHeight / (rowCount - 1)), 30, 40)
    : 40;
  const rowFontSize = rowGap <= 32 ? 13 : 15;
  const rowCardHeight = rowGap <= 32 ? 32 : 36;

  scene.settingsRows.forEach((row: { label: string }, index: number) => {
    const y = listTop + index * rowGap;
    const selected = index === scene.settingsIndex;
    const rowCard = scene.rexUI?.add
      .roundRectangle(width / 2, y + Math.floor(rowCardHeight / 2), 352, rowCardHeight, 8, selected ? 0x1f2937 : 0x0f172a, selected ? 0.92 : 0.66)
      .setStrokeStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
    if (rowCard) scene.settingsPanel.add(rowCard);

    const text = scene.add.text(width / 2, y, selected ? `▶ ${row.label}` : `  ${row.label}`, {
      fontFamily: FONT.UI,
      fontSize: rowFontSize,
      color: selected ? "#fde68a" : "#e2e8f0",
    }).setOrigin(0.5, 0);
    scene.settingsPanel.add(text);
  });

  const help = scene.add.text(width / 2, height - 90, "↑↓:選択  ←→:変更  Z:決定  X:戻る", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5);
  scene.settingsPanel.add(help);
}
