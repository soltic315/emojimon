const SPEED_LABEL_MAP = {
  NORMAL: "ノーマル",
  FAST: "はやい",
  TURBO: "さいこうそく",
};

export function clampScreenBrightness(value) {
  const safe = Number.isFinite(value) ? Math.round(value) : 115;
  return Math.min(140, Math.max(60, safe));
}

function toVolumeBar(value) {
  const level = Math.max(0, Math.min(10, Math.round(value * 10)));
  return `${"█".repeat(level)}${"░".repeat(10 - level)}`;
}

export function buildUnifiedSettingsRows(audioSettings, gameplaySettings) {
  const settings = audioSettings || { muted: false, bgmVolume: 0.3, seVolume: 0.5 };
  const gameplay = gameplaySettings || {};
  const battleSpeedLabel = SPEED_LABEL_MAP[gameplay.battleSpeed] || SPEED_LABEL_MAP.NORMAL;
  const brightness = clampScreenBrightness(gameplay.screenBrightness);

  return [
    { key: "mute", label: `ミュート: ${settings.muted ? "ON" : "OFF"}` },
    { key: "bgm", label: `BGM音量 : ${toVolumeBar(settings.bgmVolume || 0)} ${Math.round((settings.bgmVolume || 0) * 100)}%` },
    { key: "se", label: `SE音量  : ${toVolumeBar(settings.seVolume || 0)} ${Math.round((settings.seVolume || 0) * 100)}%` },
    { key: "battleSpeed", label: `バトル速度: ${battleSpeedLabel}` },
    { key: "autoAdvanceMessages", label: `メッセージ自動送り: ${gameplay.autoAdvanceMessages ? "ON" : "OFF"}` },
    { key: "shortEncounterEffect", label: `エンカウント演出短縮: ${gameplay.shortEncounterEffect ? "ON" : "OFF"}` },
    { key: "emoSkipEnabled", label: `エモスキップ: ${gameplay.emoSkipEnabled !== false ? "ON" : "OFF"}` },
    { key: "autoSaveEnabled", label: `オートセーブ: ${gameplay.autoSaveEnabled !== false ? "ON" : "OFF"}` },
    { key: "screenBrightness", label: `画面の明るさ: ${brightness}%` },
  ];
}
