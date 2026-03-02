// 設定画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { buildUnifiedSettingsRows } from "../settingsShared.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

export function renderSettingsView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "⚙️ 設定", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const rows = buildUnifiedSettingsRows(gameState.audioSettings, gameState.gameplaySettings);

  scene.settingsRows = rows;
  scene.subMenuIndex = Math.min(scene.subMenuIndex, rows.length - 1);

  rows.forEach((row, index) => {
    const y = panelY + 50 + index * 36;
    const selected = index === scene.subMenuIndex;

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 12, y - 4, panelW - 24, 30, { radius: 6 });
      scene.subPanel.add(selBg);
    }

    const text = scene.add.text(panelX + 24, y, selected ? `▶ ${row.label}` : `  ${row.label}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : "#e5e7eb",
    });
    scene.subPanel.add(text);
  });

  const hint = scene.add.text(panelX + 16, height - 30, "←→/Z:値変更・切替  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);

  if (scene._settingsLeftHandler) {
    scene.input.keyboard.off("keydown-LEFT", scene._settingsLeftHandler);
  }
  if (scene._settingsRightHandler) {
    scene.input.keyboard.off("keydown-RIGHT", scene._settingsRightHandler);
  }
  scene._settingsLeftHandler = () => scene._adjustVolume(-0.05);
  scene._settingsRightHandler = () => scene._adjustVolume(0.05);
  scene.input.keyboard.on("keydown-LEFT", scene._settingsLeftHandler);
  scene.input.keyboard.on("keydown-RIGHT", scene._settingsRightHandler);
}
