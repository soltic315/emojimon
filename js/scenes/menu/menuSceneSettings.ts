import { gameState } from "../../state/gameState.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, applyCanvasBrightness } from "../../ui/UIHelper.ts";
import { clampScreenBrightness } from "./settingsShared.ts";

type MenuSceneLike = Phaser.Scene & Record<string, any>;

export function cycleBattleSpeed(direction = 1) {
  const order = ["NORMAL", "FAST", "TURBO"];
  const current = gameState.gameplaySettings?.battleSpeed || "NORMAL";
  const idx = Math.max(0, order.indexOf(current));
  const nextIndex = (idx + direction + order.length) % order.length;
  gameState.gameplaySettings.battleSpeed = order[nextIndex];
}

export function toggleGameplayFlag(flagKey: string) {
  gameState.gameplaySettings[flagKey] = !gameState.gameplaySettings[flagKey];
}

export function persistSettingsChanges(scene: MenuSceneLike, playSe = true) {
  audioManager.applySettings(gameState.audioSettings);
  applyCanvasBrightness(scene, gameState.gameplaySettings?.screenBrightness);
  gameState.saveAudioSettings();
  if (playSe) audioManager.playCursor();
  scene._renderSubMenu();
}

export function adjustVolume(scene: MenuSceneLike, delta: number) {
  if (scene.subMenuType !== "settings") return;
  const row = scene.settingsRows?.[scene.subMenuIndex];
  if (!row) return;

  if (row.key === "bgm") {
    gameState.audioSettings.bgmVolume = Phaser.Math.Clamp(gameState.audioSettings.bgmVolume + delta, 0, 1);
  } else if (row.key === "se") {
    gameState.audioSettings.seVolume = Phaser.Math.Clamp(gameState.audioSettings.seVolume + delta, 0, 1);
  } else if (row.key === "mute") {
    gameState.audioSettings.muted = !gameState.audioSettings.muted;
  } else if (row.key === "battleSpeed") {
    cycleBattleSpeed(delta >= 0 ? 1 : -1);
  } else if (row.key === "autoAdvanceMessages") {
    toggleGameplayFlag("autoAdvanceMessages");
  } else if (row.key === "shortEncounterEffect") {
    toggleGameplayFlag("shortEncounterEffect");
  } else if (row.key === "emoSkipEnabled") {
    toggleGameplayFlag("emoSkipEnabled");
  } else if (row.key === "autoSaveEnabled") {
    toggleGameplayFlag("autoSaveEnabled");
  } else if (row.key === "screenBrightness") {
    const current = clampScreenBrightness(gameState.gameplaySettings?.screenBrightness);
    const step = delta >= 0 ? 10 : -10;
    gameState.gameplaySettings.screenBrightness = clampScreenBrightness(current + step);
  } else {
    return;
  }

  persistSettingsChanges(scene, true);
}

export function handleSettingsAction(scene: MenuSceneLike) {
  const row = scene.settingsRows?.[scene.subMenuIndex];
  if (!row) return;

  if (row.key === "mute") {
    gameState.audioSettings.muted = !gameState.audioSettings.muted;
    persistSettingsChanges(scene, false);
  } else if (row.key === "battleSpeed") {
    cycleBattleSpeed(1);
    persistSettingsChanges(scene, false);
  } else if (row.key === "autoAdvanceMessages") {
    toggleGameplayFlag("autoAdvanceMessages");
    persistSettingsChanges(scene, false);
  } else if (row.key === "shortEncounterEffect") {
    toggleGameplayFlag("shortEncounterEffect");
    persistSettingsChanges(scene, false);
  } else if (row.key === "emoSkipEnabled") {
    toggleGameplayFlag("emoSkipEnabled");
    persistSettingsChanges(scene, false);
  } else if (row.key === "autoSaveEnabled") {
    toggleGameplayFlag("autoSaveEnabled");
    persistSettingsChanges(scene, false);
  } else if (row.key === "screenBrightness") {
    const current = clampScreenBrightness(gameState.gameplaySettings?.screenBrightness);
    gameState.gameplaySettings.screenBrightness = clampScreenBrightness(current + 10);
    persistSettingsChanges(scene, false);
  }
}

export function executeDeleteSave(scene: MenuSceneLike) {
  gameState.deleteSave();
  audioManager.playConfirm();
  const msg = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, "セーブデータを削除しました", {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: "#fca5a5",
    backgroundColor: "#0f172a",
    padding: { x: 16, y: 8 },
  }).setOrigin(0.5).setDepth(100);
  msg.setStroke("#000000", 2);
  scene.time.delayedCall(900, () => {
    msg.destroy();
    audioManager.stopBgm();
    scene.cameras.main.fadeOut(220, 0, 0, 0);
    scene.cameras.main.once("camerafadeoutcomplete", () => {
      scene.scene.stop(scene.fromScene);
      scene.scene.start("TitleScene");
    });
  });
}

export function showCenterMessage(scene: MenuSceneLike, text: string, color = "#fde68a") {
  const msg = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, text, {
    fontFamily: FONT.UI,
    fontSize: 16,
    color,
    backgroundColor: "#0f172a",
    padding: { x: 14, y: 8 },
  }).setOrigin(0.5).setDepth(100);
  msg.setStroke("#000000", 2);
  scene.time.delayedCall(900, () => msg.destroy());
}
