// パーティ画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { calcStats, getMonsterMoves } from "../../../data/monsters.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

export function renderPartyView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "👥 パーティ", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  if (scene.partySwapMode) {
    const hint = scene.add.text(panelX + 160, panelY + 12, "いれかえ先を選んでください", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#f97316",
    });
    scene.subPanel.add(hint);
  }

  if (scene.partyFusionMode) {
    const hint = scene.add.text(panelX + 160, panelY + 12, "素材モンスターを選んでください", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#a78bfa",
    });
    scene.subPanel.add(hint);
  }

  const party = gameState.party;
  scene.subMenuIndex = Math.min(scene.subMenuIndex, party.length - 1);
  if (scene.subMenuIndex < 0) scene.subMenuIndex = 0;

  party.forEach((mon, index) => {
    if (!mon.species) return;
    const y = panelY + 40 + index * 76;
    const selected = index === scene.subMenuIndex;
    const stats = calcStats(mon.species, mon.level);
    const hpPct = Math.round((mon.currentHp / stats.maxHp) * 100);

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 4, panelW - 16, 58);
      scene.subPanel.add(selBg);
    }

    if (scene.partySwapMode && scene.partySwapIndex === index) {
      const swapBg = scene.add.graphics();
      swapBg.fillStyle(0x3b82f6, 0.2);
      swapBg.fillRoundedRect(panelX + 8, y - 4, panelW - 16, 58, 8);
      scene.subPanel.add(swapBg);
    }

    if (scene.partyFusionMode && scene.partyFusionIndex === index) {
      const fusionBg = scene.add.graphics();
      fusionBg.fillStyle(0x8b5cf6, 0.24);
      fusionBg.fillRoundedRect(panelX + 8, y - 4, panelW - 16, 58, 8);
      scene.subPanel.add(fusionBg);
    }

    const cursor = selected ? "▶" : " ";
    const bondMarker = (mon.bond || 0) >= 80 ? "❤️" : "";
    const displayName = mon.nickname || mon.species.name;
    const nameStr = `${cursor} ${mon.species.emoji} ${displayName}${bondMarker}  Lv.${mon.level}`;
    const nameText = scene.add.text(panelX + 16, y, nameStr, {
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
      fontFamily: FONT.UI,
      fontSize: 11,
      color: typeColor,
      backgroundColor: "#1e293b",
      padding: { x: 4, y: 2 },
    });
    scene.subPanel.add(typeText);

    const barX = panelX + 38;
    const barY = y + 22;
    const barW = 120;
    const barH = 8;
    const hpRatio = mon.currentHp / stats.maxHp;
    const barColor = hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xf97316 : 0xef4444;

    const barBg = scene.add.rectangle(barX, barY + barH / 2, barW, barH, 0x1f2937).setOrigin(0, 0.5);
    const bar = scene.add.rectangle(barX, barY + barH / 2, barW * hpRatio, barH, barColor).setOrigin(0, 0.5);
    scene.subPanel.add(barBg);
    scene.subPanel.add(bar);

    const hpStr = `HP ${mon.currentHp}/${stats.maxHp} (${hpPct}%)`;
    const hpText = scene.add.text(barX + barW + 8, barY - 2, hpStr, {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#9ca3af",
    });
    scene.subPanel.add(hpText);

    const statStr = `ATK:${stats.attack} DEF:${stats.defense} SPD:${stats.speed}  EXP:${mon.exp || 0}/${mon.nextLevelExp}  キズナ:${mon.bond || 0}`;
    const statText = scene.add.text(panelX + 38, y + 36, statStr, {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#6b7280",
    });
    scene.subPanel.add(statText);

    const knownMoves = getMonsterMoves(mon);
    if (knownMoves.length > 0) {
      const ppParts = knownMoves.map((move, moveIndex) => {
        const cur = (mon.pp && mon.pp[moveIndex] !== undefined) ? mon.pp[moveIndex] : (move.pp || 10);
        return `${move.name}:${cur}/${move.pp || 10}`;
      });
      const ppStr = ppParts.join(" ");
      const ppText = scene.add.text(panelX + 38, y + 50, ppStr, {
        fontFamily: FONT.UI,
        fontSize: 9,
        color: "#6b7280",
      });
      scene.subPanel.add(ppText);
    }
  });

  const hint = scene.add.text(panelX + 16, height - 30, "Z:いれかえ  C:ごうせい  N:ニックネーム  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);

  const recipeTitle = scene.add.text(panelX + panelW - 300, height - 74, "🧪 えもじレシピ", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#a78bfa",
  });
  scene.subPanel.add(recipeTitle);

  const previews = gameState.getFusionPreviewForParty(scene.subMenuIndex);
  if (previews.length > 0) {
    const line = previews
      .slice(0, 2)
      .map((entry) => `${entry.materialEmoji}+${entry.resultEmoji}`)
      .join("  ");
    const previewText = scene.add.text(panelX + panelW - 300, height - 56, line, {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#ddd6fe",
    });
    scene.subPanel.add(previewText);
  }
}

export function showPartyMessage(scene, text) {
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
