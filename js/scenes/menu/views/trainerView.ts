// トレーナー情報ビュー
import { gameState } from "../../../state/gameState.ts";
import { getAllMonsters } from "../../../data/monsters.ts";
import { FONT, drawPanel } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

export function renderTrainerView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "👤 トレーナー情報", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const playTimeMin = Math.floor(gameState.playTimeMs / 60000);
  const playTimeH = Math.floor(playTimeMin / 60);
  const playTimeM = playTimeMin % 60;
  const timeStr = playTimeH > 0 ? `${playTimeH}時間${playTimeM}分` : `${playTimeM}分`;

  const allMons = getAllMonsters();
  const gymStatus = gameState.gymCleared ? "✅ クリア済み" : "❌ 未クリア";
  const gym2Status = gameState.storyFlags?.frozenPeakGymCleared ? "✅ クリア済み" : "❌ 未クリア";
  const eliteDefeated = [
    gameState.storyFlags?.eliteFourWind,
    gameState.storyFlags?.eliteFourFlame,
    gameState.storyFlags?.eliteFourTide,
    gameState.storyFlags?.eliteFourFrost,
  ].filter(Boolean).length;
  const eliteStatus = eliteDefeated >= 4 ? "✅ 制覇" : `${eliteDefeated}/4 人撃破`;
  const postGameStatus = gameState.storyFlags?.legendaryDefeated
    ? "✅ 伝説制覇"
    : gameState.storyFlags?.ruinsFinalDone
      ? "⏳ 伝説挑戦中"
      : "❌ 未到達";

  const info = [
    `名前　 : ${gameState.playerName}`,
    `所持金 : ${gameState.money}G`,
    "",
    `── 冒険の記録 ──`,
    `プレイ時間 : ${timeStr}`,
    `バトル回数 : ${gameState.totalBattles}回`,
    `捕獲回数　 : ${gameState.totalCatches}回`,
    "",
    `── 図鑑 ──`,
    `みつけた　 : ${gameState.seenIds.length}/${allMons.length}`,
    `つかまえた : ${gameState.caughtIds.length}/${allMons.length}`,
    "",
    `── ジムバッジ ──`,
    `エモの森ジム : ${gymStatus}`,
    `氷峰ジム　　 : ${gym2Status}`,
    "",
    `── 四天王進捗 ──`,
    `四天王　　　 : ${eliteStatus}`,
    "",
    `── ポストゲーム ──`,
    `伝説イベント : ${postGameStatus}`,
    "",
    `── 闘技場 ──`,
    `最高記録　 : ${gameState.arenaHighScore || 0}連勝`,
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
