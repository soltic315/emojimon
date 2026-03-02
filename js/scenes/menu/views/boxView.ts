// ボックス画面ビュー
import { gameState, PARTY_CAPACITY } from "../../../state/gameState.ts";
import { calcStats } from "../../../data/monsters.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

// ── ボックス画面共通ヘルパー ──
function _drawMonRow(scene, mon, index, selected, panelX, panelW, y) {
  if (!mon.species) return;
  const stats = calcStats(mon.species, mon.level);
  const hpRatio = Math.max(0, mon.currentHp / stats.maxHp);

  if (selected) {
    const selBg = scene.add.graphics();
    drawSelection(selBg, panelX + 8, y - 4, panelW - 16, 50);
    scene.subPanel.add(selBg);
  }

  const cursor = selected ? "▶" : " ";
  const nameText = scene.add.text(panelX + 16, y,
    `${cursor} ${mon.species.emoji} ${mon.species.name}  Lv.${mon.level}`, {
      fontFamily: FONT.UI,
      fontSize: 15,
      color: selected ? "#fbbf24" : "#e5e7eb",
    });
  scene.subPanel.add(nameText);

  const typeColors = { FIRE: "#f97316", WATER: "#3b82f6", GRASS: "#22c55e", NORMAL: "#9ca3af", ELECTRIC: "#fbbf24", ICE: "#67e8f9" };
  const typeColor = typeColors[mon.species.primaryType] || "#9ca3af";
  const typeLabel = mon.species.secondaryType
    ? `${mon.species.primaryType}/${mon.species.secondaryType}`
    : mon.species.primaryType;
  const typeText = scene.add.text(panelX + panelW - 90, y, typeLabel, {
    fontFamily: FONT.UI, fontSize: 11, color: typeColor,
    backgroundColor: "#1e293b", padding: { x: 4, y: 2 },
  });
  scene.subPanel.add(typeText);

  const barX = panelX + 38;
  const barY = y + 22;
  const barW = 120;
  const barH = 7;
  const barColor = hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xf97316 : 0xef4444;
  scene.subPanel.add(scene.add.rectangle(barX, barY + barH / 2, barW, barH, 0x1f2937).setOrigin(0, 0.5));
  scene.subPanel.add(scene.add.rectangle(barX, barY + barH / 2, barW * hpRatio, barH, barColor).setOrigin(0, 0.5));
  scene.subPanel.add(scene.add.text(barX + barW + 8, barY - 2, `HP ${mon.currentHp}/${stats.maxHp}`, {
    fontFamily: FONT.UI, fontSize: 11, color: "#9ca3af",
  }));
}

export function renderBoxView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 28 });
  scene.subPanel.add(bg);

  const box = gameState.box || [];
  const partyCount = (gameState.party || []).length;
  const title = scene.add.text(panelX + 16, panelY + 10,
    `\u{1F4E6} ボックス (${box.length}体)  パーティ: ${partyCount}/${PARTY_CAPACITY}`, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: "#fbbf24",
    });
  scene.subPanel.add(title);

  if (box.length === 0) {
    scene.subPanel.add(scene.add.text(panelX + 20, panelY + 56, "ボックスは からっぽだ", {
      fontFamily: FONT.UI, fontSize: 14, color: "#6b7280",
    }));
    scene.subPanel.add(scene.add.text(panelX + 16, height - 30, "X:もどる", {
      fontFamily: FONT.UI, fontSize: 11, color: "#6b7280",
    }));
    return;
  }

  const rowH = 56;
  const visibleCount = Math.floor((height - 90) / rowH);
  scene.subMenuIndex = Math.min(Math.max(scene.subMenuIndex, 0), box.length - 1);
  const scrollStart = Math.max(0, Math.min(scene.subMenuIndex - Math.floor(visibleCount / 2), box.length - visibleCount));

  for (let vi = 0; vi < visibleCount; vi++) {
    const index = scrollStart + vi;
    if (index >= box.length) break;
    _drawMonRow(scene, box[index], index, index === scene.subMenuIndex, panelX, panelW, panelY + 44 + vi * rowH);
  }

  const actionHint = partyCount < PARTY_CAPACITY
    ? "Z:パーティに加える  X:もどる"
    : "Z:パーティと交換  X:もどる";
  scene.subPanel.add(scene.add.text(panelX + 16, height - 30, actionHint, {
    fontFamily: FONT.UI, fontSize: 11, color: "#6b7280",
  }));
}

export function renderBoxSwapView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 28 });
  scene.subPanel.add(bg);

  const boxMon = (gameState.box || [])[scene.boxPendingIndex];
  const boxName = boxMon ? `${boxMon.species?.emoji ?? ""} ${boxMon.species?.name ?? "?"}` : "?";
  const titleText = `${boxName} と 交換するパーティメンバーを選んでください`;
  scene.subPanel.add(scene.add.text(panelX + 16, panelY + 10, titleText, {
    fontFamily: FONT.UI, fontSize: 13, color: "#a78bfa", wordWrap: { width: panelW - 32 },
  }));

  const party = gameState.party || [];
  scene.subMenuIndex = Math.min(Math.max(scene.subMenuIndex, 0), party.length - 1);

  party.forEach((mon, index) => {
    if (!mon.species) return;
    const y = panelY + 48 + index * 60;
    const selected = index === scene.subMenuIndex;
    _drawMonRow(scene, mon, index, selected, panelX, panelW, y);
  });

  scene.subPanel.add(scene.add.text(panelX + 16, height - 30, "Z:交換する  X:もどる", {
    fontFamily: FONT.UI, fontSize: 11, color: "#6b7280",
  }));
}

export function showBoxMessage(scene, text) {
  const { width, height } = scene.scale;
  const msg = scene.add.text(width / 2 - 130, height / 2, text, {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: "#fde68a",
    backgroundColor: "#0f172a",
    padding: { x: 12, y: 8 },
  }).setDepth(100);
  msg.setStroke("#000000", 2);
  scene.time.delayedCall(1200, () => msg.destroy());
}
