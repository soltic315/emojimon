import { gameState } from "../../../state/gameState.ts";
import { FONT, drawPanel } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

function formatQuestLine(label, done) {
  return `${label} : ${done ? "✅ 完了" : "📋 進行中"}`;
}

export function renderQuestView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const storyQuests = [
    { label: "ライバル初戦", done: !!gameState.storyFlags.townRivalBeaten },
    { label: "森ジム制覇", done: !!gameState.gymCleared },
    { label: "ダークタワー制圧", done: !!gameState.storyFlags.darkTowerVoidBeaten },
    { label: "氷峰ジム制覇", done: !!gameState.storyFlags.frozenPeakGymCleared },
    { label: "空の遺跡最終決戦", done: !!gameState.storyFlags.ruinsFinalDone },
    { label: "星降り盆地 最終ライバル", done: !!gameState.storyFlags.basinFinalRival },
    { label: "伝説討伐", done: !!gameState.storyFlags.legendaryDefeated },
  ];

  const sideQuests = [
    { label: "スターライト依頼", done: !!gameState.starQuestDone },
    { label: "氷峰アイスタイプ編成", done: !!gameState.storyFlags.frozenPeakIceQuest },
    { label: "珊瑚みずタイプ編成", done: !!gameState.storyFlags.coralWaterQuest },
    { label: "湿地の調合依頼", done: !!gameState.storyFlags.swampRemedyQuestDone },
    { label: "珊瑚の記録復元", done: !!gameState.storyFlags.coralArchivistQuestDone },
    { label: "図書館文献復元", done: !!gameState.storyFlags.libraryRestorationQuestDone },
    { label: "星降り観測最終報告", done: !!gameState.storyFlags.starResearchQuestDone },
  ];

  const storyDone = storyQuests.filter((entry) => entry.done).length;
  const sideDone = sideQuests.filter((entry) => entry.done).length;
  const totalDone = storyDone + sideDone;
  const totalCount = storyQuests.length + sideQuests.length;

  const title = scene.add.text(panelX + 16, panelY + 10, `📜 クエスト  ${totalDone}/${totalCount}`, {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const info = [
    `ストーリー進捗 : ${storyDone}/${storyQuests.length}`,
    `サブクエスト : ${sideDone}/${sideQuests.length}`,
    "",
    "── ストーリークエスト ──",
    ...storyQuests.map((entry) => formatQuestLine(entry.label, entry.done)),
    "",
    "── サブクエスト ──",
    ...sideQuests.map((entry) => formatQuestLine(entry.label, entry.done)),
  ];

  const lineH = 22;
  const listTop = panelY + 44;
  const listBottom = height - 52;
  const visibleCount = Math.max(1, Math.floor((listBottom - listTop) / lineH));
  const maxStart = Math.max(0, info.length - visibleCount);
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, maxStart);

  for (let visibleIndex = 0; visibleIndex < visibleCount; visibleIndex++) {
    const lineIndex = scene.subMenuIndex + visibleIndex;
    if (lineIndex >= info.length) break;
    const line = info[lineIndex];
    const y = listTop + visibleIndex * lineH;
    const text = scene.add.text(panelX + 24, y, line, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: line.startsWith("──") ? "#fbbf24" : "#d1d5db",
      wordWrap: { width: panelW - 48 },
    });
    scene.subPanel.add(text);
  }

  if (maxStart > 0) {
    const hint = scene.add.text(panelX + 16, height - 30, "↑↓:スクロール  X:もどる", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#6b7280",
    });
    scene.subPanel.add(hint);
  }
}