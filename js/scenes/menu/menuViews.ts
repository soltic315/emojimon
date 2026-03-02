// メニュービュー – バレルモジュール（ルーター＋再エクスポート）
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { MENU_ITEMS } from "./menuConstants.ts";
import {
  MAIN_MENU_PANEL_WIDTH,
  MAIN_MENU_RIGHT_MARGIN,
  MAIN_MENU_TOP_MARGIN,
  fitLabelToWidth,
} from "./menuViewsShared.ts";

// ── 個別ビューから再エクスポート ──
export { renderPartyView, showPartyMessage } from "./views/partyView.ts";
export { renderBoxView, renderBoxSwapView, showBoxMessage } from "./views/boxView.ts";
export { renderBagView, renderBagTargetView, showBagMessage } from "./views/bagView.ts";
export { renderPokedexView } from "./views/pokedexView.ts";
export { renderTrainerView } from "./views/trainerView.ts";
export { renderGlobalMapView } from "./views/globalMapView.ts";
export { renderGuideTocView, renderGuideView } from "./views/guideView.ts";
export { renderSettingsView } from "./views/settingsView.ts";
export { renderAchievementsView } from "./views/achievementsView.ts";

// ── 個別ビュー関数（dispatch用ローカルインポート） ──
import { renderPartyView } from "./views/partyView.ts";
import { renderBoxView, renderBoxSwapView } from "./views/boxView.ts";
import { renderBagView, renderBagTargetView } from "./views/bagView.ts";
import { renderPokedexView } from "./views/pokedexView.ts";
import { renderTrainerView } from "./views/trainerView.ts";
import { renderGlobalMapView } from "./views/globalMapView.ts";
import { renderGuideTocView, renderGuideView } from "./views/guideView.ts";
import { renderSettingsView } from "./views/settingsView.ts";
import { renderAchievementsView } from "./views/achievementsView.ts";

// ── メインメニュー描画 ──

export function renderMainMenu(scene) {
  scene.menuPanel.removeAll(true);
  const { width } = scene.scale;
  const panelW = MAIN_MENU_PANEL_WIDTH;
  const panelX = width - panelW - MAIN_MENU_RIGHT_MARGIN;
  const panelY = MAIN_MENU_TOP_MARGIN;
  const rowH = 38;
  const panelH = MENU_ITEMS.length * rowH + 24;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, panelH, { radius: 12, headerHeight: 22 });
  scene.menuPanel.add(bg);

  MENU_ITEMS.forEach((item, index) => {
    const y = panelY + 16 + index * rowH;
    const selected = index === scene.menuIndex;

    const rowShadow = scene.rexUI?.add
      .roundRectangle(panelX + panelW / 2 + 2, y + 15, panelW - 18, 30, 8, 0x000000, selected ? 0.34 : 0.2);
    if (rowShadow) {
      scene.menuPanel.add(rowShadow);
    }

    const rowCard = scene.rexUI?.add
      .roundRectangle(panelX + panelW / 2, y + 15, panelW - 18, 30, 8, selected ? 0x162338 : 0x0e1726, selected ? 0.9 : 0.72)
      .setStrokeStyle(selected ? 1.8 : 1, selected ? 0xfbbf24 : 0x3f516b, selected ? 0.95 : 0.72);
    if (rowCard) {
      scene.menuPanel.add(rowCard);
    }

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 1, panelW - 16, 32, { radius: 7 });
      scene.menuPanel.add(selBg);
    }

    const label = `${item.icon} ${item.label}`;
    const rawText = selected ? `▶ ${label}` : `  ${label}`;
    const text = scene.add.text(panelX + 20, y, rawText, {
      fontFamily: FONT.UI,
      fontSize: selected ? 17 : 16,
      color: selected ? "#fde68a" : "#dbe5f3",
      fontStyle: selected ? "700" : "500",
    });
    fitLabelToWidth(text, rawText, panelW - 30);
    scene.menuPanel.add(text);
  });
}

// ── サブメニュー ディスパッチ ──

export function renderSubMenu(scene) {
  scene.subPanel.removeAll(true);
  switch (scene.subMenuType) {
    case "party":
      renderPartyView(scene);
      break;
    case "box":
      renderBoxView(scene);
      break;
    case "box_swap":
      renderBoxSwapView(scene);
      break;
    case "bag":
      renderBagView(scene);
      break;
    case "bag_target":
      renderBagTargetView(scene);
      break;
    case "pokedex":
      renderPokedexView(scene);
      break;
    case "achievements":
      renderAchievementsView(scene);
      break;
    case "trainer":
      renderTrainerView(scene);
      break;
    case "globalMap":
      renderGlobalMapView(scene);
      break;
    case "guide":
      renderGuideView(scene);
      break;
    case "guide_toc":
      renderGuideTocView(scene);
      break;
    case "guide_detail":
      renderGuideView(scene);
      break;
    case "settings":
      renderSettingsView(scene);
      break;
  }
}
