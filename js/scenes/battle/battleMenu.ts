import { gameState } from "../../state/gameState.ts";
import { calcStats, getMonsterMoves } from "../../data/monsters.ts";
import { getItemById } from "../../data/items.ts";
import { FONT, COLORS } from "../../ui/UIHelper.ts";
import { BattleState } from "./battleConstants.ts";

function setSceneBattleState(scene, nextState) {
  if (typeof scene?.setBattleState === "function") {
    scene.setBattleState(nextState);
    return;
  }
  scene.state = nextState;
}

function getMenuIcon(label) {
  if (label.includes("たたかう")) return "⚔";
  if (label.includes("いれかえ")) return "🔁";
  if (label.includes("アイテム")) return "🎒";
  if (label.includes("にげる")) return "🏃";
  return "◆";
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function resolvePanelLayout(scene) {
  const panelX = Number.isFinite(scene.panelX) ? scene.panelX : 6;
  const panelY = Number.isFinite(scene.panelY) ? scene.panelY : (scene.scale.height - 156);
  const panelWidth = Number.isFinite(scene.panelWidth) ? scene.panelWidth : (scene.scale.width - 12);
  const panelHeight = Number.isFinite(scene.panelHeight) ? scene.panelHeight : 150;
  const panelDividerX = Number.isFinite(scene.panelDividerX) ? scene.panelDividerX : (panelX + panelWidth * 0.56);

  const leftColumnLeft = panelX + 12;
  const leftColumnRight = panelDividerX - 12;
  const rightColumnLeft = panelDividerX + 12;
  const rightColumnRight = panelX + panelWidth - 12;

  const leftColumnWidth = Math.max(180, leftColumnRight - leftColumnLeft);
  const rightColumnWidth = Math.max(120, rightColumnRight - rightColumnLeft);

  return {
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    panelDividerX,
    leftColumnLeft,
    leftColumnWidth,
    rightColumnLeft,
    rightColumnWidth,
    leftColumnCenterX: leftColumnLeft + leftColumnWidth * 0.5,
    rightColumnCenterX: rightColumnLeft + rightColumnWidth * 0.5,
  };
}

function addMenuRow(scene, list, opts) {
  const {
    x,
    y,
    width,
    height,
    label,
    selected,
    fontSize = 14,
    rightLabel = "",
    rightFontSize = 12,
    rightTextColor = "#93c5fd",
    selectedTextColor = "#fde68a",
    textColor = "#e2e8f0",
  } = opts;

  const accentColor = selected ? COLORS.GOLD : 0x475569;

  const shadow = scene.rexUI?.add
    .roundRectangle(x + 2, y + height * 0.5 + 2, width, height, 9, 0x000000, selected ? 0.28 : 0.2);
  if (shadow) list.push(shadow);

  const card = scene.rexUI?.add
    .roundRectangle(
      x,
      y + height * 0.5,
      width,
      height,
      9,
      selected ? 0x1e293b : 0x0f172a,
      selected ? 0.95 : 0.74,
    )
    .setStrokeStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.98 : 0.78);
  if (card) list.push(card);

  const accent = scene.add.rectangle(x - width * 0.5 + 6, y + height * 0.5, 4, height - 8, accentColor, selected ? 1 : 0.65)
    .setOrigin(0.5);
  list.push(accent);

  if (selected) {
    const glow = scene.rexUI?.add
      .roundRectangle(x, y + height * 0.5, width + 8, height + 6, 10, 0xfbbf24, 0.08)
      .setStrokeStyle(1, 0xfde68a, 0.2);
    if (glow) list.push(glow);
  }

  const icon = scene.add.text(x - width * 0.5 + 14, y + 1, getMenuIcon(label), {
    fontFamily: FONT.UI,
    fontSize: Math.max(11, fontSize - 2),
    color: selected ? "#fde68a" : "#94a3b8",
  }).setOrigin(0, 0);
  list.push(icon);

  const hasRightLabel = !!rightLabel;
  const labelX = x - width * 0.5 + 32;
  const rightLabelReserve = hasRightLabel ? 126 : 12;
  const labelMaxLength = hasRightLabel ? 22 : 28;
  const displayLabel = truncateText(selected ? `▶ ${label}` : label, labelMaxLength);

  const text = scene.add.text(labelX, y + 2, displayLabel, {
    fontFamily: FONT.UI,
    fontSize,
    color: selected ? selectedTextColor : textColor,
    fontStyle: selected ? "700" : "500",
    fixedWidth: Math.max(40, width - 32 - rightLabelReserve),
  }).setOrigin(0, 0);
  list.push(text);

  if (hasRightLabel) {
    const rightText = scene.add.text(x + width * 0.5 - 12, y + 2, rightLabel, {
      fontFamily: FONT.UI,
      fontSize: rightFontSize,
      color: selected ? selectedTextColor : rightTextColor,
      fontStyle: selected ? "700" : "500",
    }).setOrigin(1, 0);
    list.push(rightText);
  }
}

export function clearMenuTexts(scene) {
  [...scene.menuTextGroup, ...scene.moveTextGroup, ...scene.itemTextGroup].forEach((textObj) => {
    if (textObj && textObj.destroy) textObj.destroy();
  });
  scene.menuTextGroup = [];
  scene.moveTextGroup = [];
  scene.itemTextGroup = [];
}

export function showMainMenu(scene, reset = true) {
  setSceneBattleState(scene, BattleState.PLAYER_TURN);
  clearMenuTexts(scene);

  const layout = resolvePanelLayout(scene);

  scene.mainOptions = ["たたかう", "いれかえ", "アイテム", "にげる"];

  if (reset) {
    const rememberedIndex = scene.mainOptions.indexOf(scene.lastSelectedMainOption);
    scene.selectedMainIndex = rememberedIndex >= 0 ? rememberedIndex : 0;
  }

  if (scene.selectedMainIndex >= scene.mainOptions.length || scene.selectedMainIndex < 0) {
    scene.selectedMainIndex = 0;
  }

  const menuX = layout.rightColumnCenterX;
  scene.mainOptions.forEach((label, index) => {
    const y = layout.panelY + 14 + index * 30;
    const selected = index === scene.selectedMainIndex;
    addMenuRow(scene, scene.menuTextGroup, {
      x: menuX,
      y,
      width: 178,
      height: 28,
      label,
      selected,
      fontSize: 16,
    });
  });

  scene.messageText.setText("どうする？");
}

export function showMoveMenu(scene, reset = true) {
  setSceneBattleState(scene, BattleState.PLAYER_SELECT_MOVE);
  clearMenuTexts(scene);

  const layout = resolvePanelLayout(scene);
  const moves = getMonsterMoves(scene.battle.player);

  if (moves.length === 0) {
    setSceneBattleState(scene, BattleState.PLAYER_TURN);
    scene.enqueueMessage("つかえる わざが ない…");
    showMainMenu(scene, true);
    return;
  }

  if (reset) {
    const rememberedIndex = moves.findIndex(
      (move) => (move.id || move.name) === scene.lastSelectedMoveId,
    );
    scene.selectedMoveIndex = rememberedIndex >= 0 ? rememberedIndex : 0;
  }

  if (scene.selectedMoveIndex >= moves.length) scene.selectedMoveIndex = 0;

  const typeColors = {
    FIRE: "#f97316",
    WATER: "#3b82f6",
    GRASS: "#22c55e",
    NORMAL: "#9ca3af",
    ELECTRIC: "#eab308",
    ICE: "#67e8f9",
  };

  const ppArr = scene.battle.player.pp || [];
  const moveRowWidth = Math.min(360, Math.max(260, layout.leftColumnWidth - 10));
  const moveRowX = layout.leftColumnLeft + moveRowWidth * 0.5;

  moves.forEach((move, index) => {
    const y = layout.panelY + 36 + index * 26;
    const selected = index === scene.selectedMoveIndex;
    const currentPP = ppArr[index] !== undefined ? ppArr[index] : (move.pp || "?");
    const maxPP = move.pp || "?";
    const noPP = typeof currentPP === "number" && currentPP <= 0;

    const typeColor = typeColors[move.type] || "#9ca3af";
    const powerStr = move.power > 0 ? `威力${move.power}` : "変化";
    const ppStr = `PP${currentPP}/${maxPP}`;
    const label = `${move.name} [${move.type}]`;
    const displayColor = noPP ? "#4b5563" : (selected ? typeColor : "#e2e8f0");
    addMenuRow(scene, scene.moveTextGroup, {
      x: moveRowX,
      y,
      width: moveRowWidth,
      height: 24,
      label,
      rightLabel: `${powerStr}  ${ppStr}`,
      selected,
      fontSize: 13,
      selectedTextColor: displayColor,
      textColor: displayColor,
      rightTextColor: noPP ? "#4b5563" : "#93c5fd",
    });
  });

  const currentMove = moves[scene.selectedMoveIndex];
  if (currentMove) {
    const accStr = `命中:${scene.formatMoveAccuracy(currentMove)}`;
    const catStr = currentMove.category === "status" ? "変化わざ" : "攻撃わざ";
    const opponentType = scene.battle.opponent?.species?.primaryType || "NORMAL";
    const opponentSecType = scene.battle.opponent?.species?.secondaryType || null;
    const effectiveness = scene.getEffectiveness(currentMove.type, opponentType, opponentSecType);
    const effectivenessStr = `相性:${scene.getEffectivenessLabel(effectiveness)}`;
    const priority = Number.isFinite(currentMove.priority) ? currentMove.priority : 0;
    const priorityStr = `優先度:${priority >= 0 ? "+" : ""}${priority}`;
    const effectStr = scene.getMoveEffectLabel(currentMove);
    const detailLines = [catStr, accStr, effectivenessStr, priorityStr, effectStr];
    const detailWidth = Math.min(220, Math.max(156, layout.rightColumnWidth - 16));
    const detailSizer = scene.rexUI?.add.sizer({
      x: layout.rightColumnLeft + detailWidth * 0.5,
      y: layout.panelY + 87,
      width: detailWidth,
      height: 106,
      orientation: "y",
      space: {
        left: 10,
        right: 10,
        top: 8,
        bottom: 8,
        item: 3,
      },
    });

    if (detailSizer) {
      detailSizer.addBackground(
        scene.rexUI.add
          .roundRectangle(0, 0, 0, 0, 10, 0x0f172a, 0.76)
          .setStrokeStyle(1, 0x334155, 0.75)
      );

      detailLines.forEach((line, index) => {
        const text = scene.add.text(0, 0, line, {
          fontFamily: FONT.UI,
          fontSize: 11,
          color: index === 0 ? "#cbd5e1" : "#94a3b8",
        });
        detailSizer.add(text, {
          proportion: 0,
          expand: true,
          align: "left",
        });
      });

      detailSizer.layout();
      scene.moveTextGroup.push(detailSizer);
    } else {
      const detailText = scene.add.text(layout.rightColumnCenterX, layout.panelY + 36, detailLines.join("\n"), {
        fontFamily: FONT.UI,
        fontSize: 11,
        color: "#6b7280",
        lineSpacing: 3,
      }).setOrigin(0.5, 0);
      scene.moveTextGroup.push(detailText);
    }
  }

  scene.messageText.setText("どのわざを つかう？");
}

export function showItemMenu(scene, reset = true) {
  setSceneBattleState(scene, BattleState.PLAYER_SELECT_ITEM);
  clearMenuTexts(scene);

  const layout = resolvePanelLayout(scene);
  const inventory = gameState.inventory || [];
  const battleItems = inventory
    .map((entry) => ({ entry, def: getItemById(entry.itemId) }))
    .filter((item) => {
      if (!item.def || item.entry.quantity <= 0) return false;
      const catchBonus = item.def.catchBonus || (item.def.id === "EMO_BALL" ? 1 : 0);
      const isCatchBall = catchBonus > 0;
      return item.def.battleUsable || (scene.isWildBattle && isCatchBall);
    });

  scene.currentBattleItems = battleItems;

  if (battleItems.length === 0) {
    setSceneBattleState(scene, BattleState.PLAYER_TURN);
    scene.enqueueMessage("いま つかえるアイテムは ない…");
    showMainMenu(scene, true);
    return;
  }

  if (reset) {
    const rememberedIndex = battleItems.findIndex(
      (item) => item.def && item.def.id === scene.lastSelectedItemId,
    );
    scene.selectedItemIndex = rememberedIndex >= 0 ? rememberedIndex : 0;
  }

  if (scene.selectedItemIndex >= battleItems.length) scene.selectedItemIndex = 0;

  battleItems.forEach((item, index) => {
    const label = `${item.def.emoji || ""} ${item.def.name} x${item.entry.quantity}`;
    const x = layout.leftColumnCenterX;
    const y = layout.panelY + 36 + index * 24;
    const selected = index === scene.selectedItemIndex;
    addMenuRow(scene, scene.itemTextGroup, {
      x,
      y,
      width: 292,
      height: 22,
      label,
      selected,
      fontSize: 13,
    });
  });

  scene.messageText.setText("どのアイテムを つかう？");
}

export function showSwitchMenu(scene, reset = true) {
  setSceneBattleState(scene, BattleState.PLAYER_SELECT_SWITCH);
  clearMenuTexts(scene);

  const layout = resolvePanelLayout(scene);
  const currentPlayer = scene.getActivePlayer();
  const currentIndex = gameState.party.indexOf(currentPlayer);

  scene.switchableParty = gameState.party
    .map((monster, index) => ({ monster, index }))
    .filter((entry) => entry.index !== currentIndex && entry.monster.currentHp > 0 && entry.monster.species);

  if (scene.switchableParty.length === 0) {
    scene.enqueueMessage("いれかえ できる モンスターが いない！");
    showMainMenu(scene, true);
    return;
  }

  if (reset) scene.selectedSwitchIndex = 0;
  if (scene.selectedSwitchIndex >= scene.switchableParty.length) scene.selectedSwitchIndex = 0;

  scene.switchableParty.forEach((entry, index) => {
    const monster = entry.monster;
    const stats = calcStats(monster.species, monster.level || 1);
    const hpPercent = Math.round((monster.currentHp / stats.maxHp) * 100);
    const label = `${monster.species.emoji || ""} ${monster.species.name} Lv.${monster.level} HP${hpPercent}%`;
    const x = layout.leftColumnCenterX;
    const y = layout.panelY + 14 + index * 24;
    const selected = index === scene.selectedSwitchIndex;
    addMenuRow(scene, scene.menuTextGroup, {
      x,
      y,
      width: 300,
      height: 22,
      label,
      selected,
      fontSize: 13,
    });
  });

  scene.messageText.setText("だれと いれかえる？");
}
