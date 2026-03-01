// 図鑑画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { getAllMonsters, calcStats } from "../../../data/monsters.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

export function renderPokedexView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const allMons = getAllMonsters();
  const byId = new Map(allMons.map((mon) => [mon.id, mon]));
  const caughtCount = gameState.caughtIds.length;
  const seenCount = gameState.seenIds.length;

  const title = scene.add.text(panelX + 16, panelY + 10,
    `📖 ずかん  みつけた:${seenCount}  つかまえた:${caughtCount}/${allMons.length}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#fbbf24",
    });
  scene.subPanel.add(title);

  const detailPanelTop = height - 182;
  const visibleCount = Math.max(1, Math.floor((detailPanelTop - (panelY + 44)) / 28));
  const maxIndex = allMons.length - 1;
  scene.subMenuIndex = Math.min(scene.subMenuIndex, maxIndex);
  const scrollStart = Math.max(0, Math.min(scene.subMenuIndex - Math.floor(visibleCount / 2), maxIndex - visibleCount + 1));

  for (let visibleIndex = 0; visibleIndex < visibleCount; visibleIndex++) {
    const index = scrollStart + visibleIndex;
    if (index >= allMons.length) break;
    const mon = allMons[index];
    const y = panelY + 40 + visibleIndex * 28;
    const selected = index === scene.subMenuIndex;
    const seen = gameState.seenIds.includes(mon.id);
    const caught = gameState.caughtIds.includes(mon.id);

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 2, panelW - 16, 26, { radius: 4 });
      scene.subPanel.add(selBg);
    }

    const no = String(index + 1).padStart(3, "0");
    const emoji = seen ? mon.emoji : "？";
    const name = seen ? mon.name : "？？？？？";
    const caughtMark = caught ? "●" : seen ? "○" : "—";
    const typeColors = { FIRE: "#f97316", WATER: "#3b82f6", GRASS: "#22c55e", NORMAL: "#9ca3af", ELECTRIC: "#fbbf24", ICE: "#67e8f9" };
    const typeStr = seen
      ? (mon.secondaryType ? `${mon.primaryType}/${mon.secondaryType}` : mon.primaryType)
      : "???";
    const cursor = selected ? "▶" : " ";

    const label = `${cursor} ${no} ${emoji} ${name}`;
    const text = scene.add.text(panelX + 16, y, label, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: selected ? "#fbbf24" : caught ? "#e5e7eb" : seen ? "#9ca3af" : "#4b5563",
    });
    scene.subPanel.add(text);

    if (seen) {
      const tColor = typeColors[mon.primaryType] || "#9ca3af";
      const tt = scene.add.text(panelX + panelW - 120, y, typeStr, {
        fontFamily: FONT.UI,
        fontSize: 11,
        color: tColor,
      });
      scene.subPanel.add(tt);
    }

    const markText = scene.add.text(panelX + panelW - 30, y, caughtMark, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: caught ? "#22c55e" : seen ? "#fbbf24" : "#4b5563",
    });
    scene.subPanel.add(markText);
  }

  const detailBg = scene.add.graphics();
  drawPanel(detailBg, panelX + 10, detailPanelTop, panelW - 20, 156, { radius: 8, headerHeight: 22 });
  scene.subPanel.add(detailBg);

  const selectedMon = allMons[scene.subMenuIndex];
  if (!selectedMon || !gameState.seenIds.includes(selectedMon.id)) {
    const unknown = scene.add.text(panelX + 22, detailPanelTop + 34, "未発見のモンスターです", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#9ca3af",
    });
    scene.subPanel.add(unknown);
    return;
  }

  const detailTitle = scene.add.text(panelX + 22, detailPanelTop + 8, "詳細", {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: "#fbbf24",
  });
  scene.subPanel.add(detailTitle);

  const isCaught = gameState.caughtIds.includes(selectedMon.id);
  if (!isCaught) {
    const limited = scene.add.text(panelX + 22, detailPanelTop + 34, "つかまえると詳細（ステータス・わざ・進化）が表示されます", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#9ca3af",
      wordWrap: { width: panelW - 48 },
    });
    scene.subPanel.add(limited);
    const descText = scene.add.text(panelX + 22, detailPanelTop + 70, selectedMon.description || "情報なし", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#cbd5e1",
      wordWrap: { width: panelW - 48 },
    });
    scene.subPanel.add(descText);
    return;
  }

  const typeLabel = selectedMon.secondaryType
    ? `${selectedMon.primaryType}/${selectedMon.secondaryType}`
    : selectedMon.primaryType;
  const stats = selectedMon.baseStats || {};
  const statLine = `タイプ:${typeLabel}  HP:${stats.maxHp ?? "?"}  ATK:${stats.attack ?? "?"}  DEF:${stats.defense ?? "?"}  SPD:${stats.speed ?? "?"}`;
  const statText = scene.add.text(panelX + 22, detailPanelTop + 34, statLine, {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#e5e7eb",
    wordWrap: { width: panelW - 48 },
  });
  scene.subPanel.add(statText);

  const evolution = selectedMon.evolution;
  let evoLine = "進化: なし";
  if (evolution?.evolvesTo) {
    const evoTarget = byId.get(evolution.evolvesTo);
    const evoName = evoTarget ? `${evoTarget.emoji} ${evoTarget.name}` : evolution.evolvesTo;
    if (evolution.condition?.type === "LEVEL") {
      evoLine = `進化: Lv.${evolution.condition.value} で ${evoName}`;
    } else if (evolution.condition?.type === "ITEM") {
      evoLine = `進化: ${evolution.condition.value} で ${evoName}`;
    } else {
      evoLine = `進化: ${evoName}`;
    }
  }
  const evoText = scene.add.text(panelX + 22, detailPanelTop + 54, evoLine, {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#c4b5fd",
    wordWrap: { width: panelW - 48 },
  });
  scene.subPanel.add(evoText);

  const learnset = Array.isArray(selectedMon.learnset) ? selectedMon.learnset : [];
  const moveLines = learnset.slice(0, 6).map((move, idx) => {
    const level = Array.isArray(selectedMon.learnsetLevels)
      ? (selectedMon.learnsetLevels[idx] ?? (1 + idx * 2))
      : (1 + idx * 2);
    return `Lv.${level} ${move.name || move.id || "？？？"}`;
  });
  const moveText = scene.add.text(panelX + 22, detailPanelTop + 76, `わざ: ${moveLines.join(" / ") || "なし"}`, {
    fontFamily: FONT.UI,
    fontSize: 10,
    color: "#93c5fd",
    wordWrap: { width: panelW - 48 },
    lineSpacing: 3,
  });
  scene.subPanel.add(moveText);

  const descText = scene.add.text(panelX + 22, detailPanelTop + 116, selectedMon.description || "情報なし", {
    fontFamily: FONT.UI,
    fontSize: 10,
    color: "#9ca3af",
    wordWrap: { width: panelW - 48 },
  });
  scene.subPanel.add(descText);
}
