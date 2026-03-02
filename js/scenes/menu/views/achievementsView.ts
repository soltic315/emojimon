// 実績画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import {
  getAchievementsByCategory,
  getAchievementProgress,
  getAchievementHint,
  getAchievementRewardText,
  ACHIEVEMENT_CATEGORY_LABELS,
} from "../../../data/achievements.ts";
import { SUB_PANEL_WIDTH_OFFSET, fitLabelToWidth } from "../menuViewsShared.ts";

export function renderAchievementsView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const unlockedIds = gameState.unlockedAchievements || [];
  const progress = getAchievementProgress(unlockedIds);
  const byCategory = getAchievementsByCategory(unlockedIds);

  // ヘッダー
  const title = scene.add.text(panelX + 16, panelY + 8, `🏆 実績  ${progress.unlocked}/${progress.total} (${progress.percent}%)`, {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  // プログレスバー
  const barX = panelX + 16;
  const barY = panelY + 30;
  const barWidth = panelW - 32;
  const barHeight = 6;
  const barBg = scene.add.graphics();
  barBg.fillStyle(0x1e293b, 1);
  barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
  barBg.fillStyle(0xfbbf24, 1);
  barBg.fillRoundedRect(barX, barY, Math.max(2, barWidth * (progress.percent / 100)), barHeight, 3);
  scene.subPanel.add(barBg);

  // フラットリストとして全実績を表示（カテゴリヘッダー付き）
  const allItems = [];
  const categories = ["BATTLE", "COLLECTION", "EXPLORATION", "MASTERY"];
  for (const cat of categories) {
    const items = byCategory.get(cat) || [];
    const catInfo = ACHIEVEMENT_CATEGORY_LABELS[cat];
    allItems.push({ type: "header", label: `${catInfo.icon} ${catInfo.label}`, cat });
    items.forEach((item) => {
      allItems.push({ type: "achievement", ...item });
    });
  }

  // スクロール可能な表示
  const visibleAreaY = panelY + 42;
  const visibleAreaH = height - 20 - 42;
  const itemHeight = 28;
  const headerHeight = 30;
  const rowHeight = (item) => (item.type === "header" ? headerHeight : itemHeight);

  // subMenuIndex をクランプ
  const totalSelectable = allItems.filter((item) => item.type === "achievement").length;
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, Math.max(0, totalSelectable - 1));

  // 選択可能なインデックスをフラットインデックスに変換
  let selectableCount = 0;
  let selectedFlatIndex = -1;
  allItems.forEach((item, idx) => {
    if (item.type === "achievement") {
      if (selectableCount === scene.subMenuIndex) {
        selectedFlatIndex = idx;
      }
      selectableCount++;
    }
  });

  // スクロールオフセット計算（ヘッダー/項目の高さ差を考慮）
  const rowTops = [];
  let totalHeight = 0;
  for (const item of allItems) {
    rowTops.push(totalHeight);
    totalHeight += rowHeight(item);
  }
  const selectedTop = selectedFlatIndex >= 0 ? rowTops[selectedFlatIndex] : 0;
  const selectedHeight = selectedFlatIndex >= 0 ? rowHeight(allItems[selectedFlatIndex]) : itemHeight;
  const selectedCenter = selectedTop + Math.floor(selectedHeight / 2);
  const maxScrollY = Math.max(0, totalHeight - visibleAreaH);
  const scrollY = Phaser.Math.Clamp(selectedCenter - Math.floor(visibleAreaH / 2), 0, maxScrollY);

  let scrollOffset = 0;
  for (let i = 0; i < allItems.length; i++) {
    const top = rowTops[i];
    const bottom = top + rowHeight(allItems[i]);
    if (bottom > scrollY) {
      scrollOffset = i;
      break;
    }
  }

  const visibleBottomY = visibleAreaY + visibleAreaH;
  let drawY = visibleAreaY - (scrollY - rowTops[scrollOffset]);

  for (let i = scrollOffset; i < allItems.length; i++) {
    const item = allItems[i];
    if (!item) break;
    const currentHeight = rowHeight(item);
    if (drawY >= visibleBottomY) break;

    if (item.type === "header") {
      const headerText = scene.add.text(panelX + 16, drawY + 4, item.label, {
        fontFamily: FONT.UI,
        fontSize: 13,
        color: "#94a3b8",
      });
      scene.subPanel.add(headerText);
      drawY += currentHeight;
      continue;
    }

    const isSelected = i === selectedFlatIndex;
    const { def, unlocked } = item;

    if (isSelected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, drawY - 1, panelW - 16, 26, { radius: 4 });
      scene.subPanel.add(selBg);
    }

    const icon = unlocked ? def.icon : "🔒";
    const name = unlocked ? def.name : "？？？";
    const color = unlocked
      ? (isSelected ? "#fbbf24" : "#e5e7eb")
      : (isSelected ? "#94a3b8" : "#64748b");
    const cursor = isSelected ? "▶" : " ";

    const lineText = scene.add.text(panelX + 16, drawY + 2, `${cursor} ${icon} ${name}`, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color,
    });
    scene.subPanel.add(lineText);

    // 選択中の場合、説明/ヒントと報酬を表示
    if (isSelected) {
      const leftText = unlocked ? def.description : getAchievementHint(def);
      const rewardText = getAchievementRewardText(def);
      const infoText = `${leftText} / 報酬: ${rewardText}`;
      const descText = scene.add.text(panelX + panelW - 12, drawY + 4, infoText, {
        fontFamily: FONT.UI,
        fontSize: 10,
        color: unlocked ? "#94a3b8" : "#fcd34d",
      }).setOrigin(1, 0);
      fitLabelToWidth(descText, infoText, panelW * 0.45);
      scene.subPanel.add(descText);
    }

    drawY += currentHeight;
  }
}
