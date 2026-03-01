// ガイド画面ビュー（目次＋詳細）
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { GUIDE_PAGES } from "../menuConstants.ts";
import { SUB_PANEL_WIDTH_OFFSET, fitLabelToWidth } from "../menuViewsShared.ts";

export function renderGuideTocView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "🧭 ガイド目次", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const rowH = 32;
  const listTop = panelY + 44;
  const visibleCount = Math.max(1, Math.floor((height - 90) / rowH));
  const maxIndex = GUIDE_PAGES.length - 1;
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, maxIndex);
  const scrollStart = Math.max(0, Math.min(scene.subMenuIndex - Math.floor(visibleCount / 2), maxIndex - visibleCount + 1));

  for (let vi = 0; vi < visibleCount; vi++) {
    const index = scrollStart + vi;
    if (index > maxIndex) break;
    const y = listTop + vi * rowH;
    const selected = index === scene.subMenuIndex;
    const page = GUIDE_PAGES[index];

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 12, y - 3, panelW - 24, 28, { radius: 6 });
      scene.subPanel.add(selBg);
    }

    const row = scene.add.text(panelX + 24, y, `${selected ? "▶" : " "} ${String(index + 1).padStart(2, "0")}. ${page.title}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : "#e5e7eb",
    });
    fitLabelToWidth(row, `${selected ? "▶" : " "} ${String(index + 1).padStart(2, "0")}. ${page.title}`, panelW - 40);
    scene.subPanel.add(row);
  }

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:項目選択  Z:ひらく  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}

export function renderGuideView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const maxPage = GUIDE_PAGES.length - 1;
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, maxPage);
  const page = GUIDE_PAGES[scene.subMenuIndex];

  const title = scene.add.text(panelX + 16, panelY + 10, `🧭 ${page.title} (${scene.subMenuIndex + 1}/${GUIDE_PAGES.length})`, {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const body = scene.add.text(panelX + 20, panelY + 42, page.lines.join("\n"), {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#e5e7eb",
    lineSpacing: 5,
    wordWrap: { width: panelW - 40 },
  });
  scene.subPanel.add(body);

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:項目切替  Z:次へ  X:目次へ", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}
