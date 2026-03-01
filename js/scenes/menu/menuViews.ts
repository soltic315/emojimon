import { gameState } from "../../state/gameState.ts";
import { getItemById } from "../../data/items.ts";
import { getAllMonsters, calcStats, getMonsterMoves } from "../../data/monsters.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { MENU_ITEMS, GUIDE_PAGES } from "./menuConstants.ts";
import { MAPS, DOOR_TRANSITIONS } from "../world/worldMapData.ts";

const MAIN_MENU_PANEL_WIDTH = 220;
const MAIN_MENU_RIGHT_MARGIN = 10;
const SUB_PANEL_LEFT_MARGIN = 10;
const MAIN_SUB_PANEL_GAP = 10;
const SUB_PANEL_WIDTH_OFFSET = MAIN_MENU_PANEL_WIDTH + MAIN_MENU_RIGHT_MARGIN + SUB_PANEL_LEFT_MARGIN + MAIN_SUB_PANEL_GAP;

const GLOBAL_MAP_HIDDEN_KEYS = new Set([
  "HOUSE1",
  "LAB",
  "TOWN_SHOP",
  "FOREST_GYM",
  "VOLCANO_SHOP",
  "FROZEN_GYM",
  "FROZEN_SHOP",
  "GARDEN_SHOP",
  "SWAMP_SHOP",
  "SAND_VALLEY_SHOP",
  "BASIN_SHOP",
]);

function fitLabelToWidth(textObj, original, maxWidth) {
  if (!textObj || typeof original !== "string") return;
  if (textObj.width <= maxWidth) return;

  const chars = [...original];
  let cut = chars.length;
  while (cut > 1) {
    const candidate = `${chars.slice(0, cut - 1).join("")}…`;
    textObj.setText(candidate);
    if (textObj.width <= maxWidth) return;
    cut -= 1;
  }
}

export function renderMainMenu(scene) {
  scene.menuPanel.removeAll(true);
  const { width } = scene.scale;
  const panelW = MAIN_MENU_PANEL_WIDTH;
  const panelX = width - panelW - MAIN_MENU_RIGHT_MARGIN;
  const panelY = 10;
  const panelH = MENU_ITEMS.length * 36 + 20;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, panelH, { radius: 12, headerHeight: 22 });
  scene.menuPanel.add(bg);

  MENU_ITEMS.forEach((item, index) => {
    const y = panelY + 14 + index * 36;
    const selected = index === scene.menuIndex;

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 2, panelW - 16, 32, { radius: 6 });
      scene.menuPanel.add(selBg);
    }

    const label = `${item.icon} ${item.label}`;
    const rawText = selected ? `▶ ${label}` : `  ${label}`;
    const text = scene.add.text(panelX + 20, y, rawText, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: selected ? "#fde68a" : "#e5e7eb",
    });
    fitLabelToWidth(text, rawText, panelW - 30);
    scene.menuPanel.add(text);
  });
}

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
    const nameStr = `${cursor} ${mon.species.emoji} ${mon.species.name}${bondMarker}  Lv.${mon.level}`;
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

  const hint = scene.add.text(panelX + 16, height - 30, "Z:いれかえ  C:ごうせい  X:もどる", {
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
  } else {
    const fallback = scene.add.text(panelX + panelW - 300, height - 56, "いろいろな組み合わせを試そう", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#6b7280",
    });
    scene.subPanel.add(fallback);
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
    `\u{1F4E6} ボックス (${box.length}体)  パーティ: ${partyCount}/6`, {
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

  const actionHint = partyCount < 6
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

export function renderBagView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "🎒 バッグ", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const money = scene.add.text(panelX + panelW - 100, panelY + 12, `💰 ${gameState.money}G`, {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: "#fbbf24",
  });
  scene.subPanel.add(money);

  const inventory = gameState.inventory.filter((it) => it.quantity > 0);
  if (inventory.length === 0) {
    const empty = scene.add.text(panelX + 20, panelY + 50, "アイテムを持っていない", {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#6b7280",
    });
    scene.subPanel.add(empty);
    return;
  }

  scene.subMenuIndex = Math.min(scene.subMenuIndex, inventory.length - 1);

  inventory.forEach((entry, index) => {
    const item = getItemById(entry.itemId);
    if (!item) return;
    const y = panelY + 44 + index * 32;
    const selected = index === scene.subMenuIndex;

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 2, panelW - 16, 28, { radius: 6 });
      scene.subPanel.add(selBg);
    }

    const cursor = selected ? "▶" : " ";
    const label = `${cursor} ${item.emoji} ${item.name}  x${entry.quantity}`;
    const text = scene.add.text(panelX + 16, y, label, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : "#e5e7eb",
    });
    scene.subPanel.add(text);
  });

  const selectedEntry = inventory[scene.subMenuIndex];
  if (selectedEntry) {
    const item = getItemById(selectedEntry.itemId);
    if (item && item.description) {
      const desc = scene.add.text(panelX + 16, height - 60, item.description, {
        fontFamily: FONT.UI,
        fontSize: 12,
        color: "#9ca3af",
        wordWrap: { width: panelW - 32 },
      });
      scene.subPanel.add(desc);
    }
  }

  const hint = scene.add.text(panelX + 16, height - 30, "Z:つかう  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}

export function renderBagTargetView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const item = scene._pendingItemDef;
  const title = scene.add.text(panelX + 16, panelY + 10, `${item.emoji} ${item.name} を だれに つかう？`, {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const party = gameState.party;
  scene.subMenuIndex = Math.min(scene.subMenuIndex, party.length - 1);
  if (scene.subMenuIndex < 0) scene.subMenuIndex = 0;

  party.forEach((mon, index) => {
    if (!mon.species) return;
    const y = panelY + 44 + index * 48;
    const selected = index === scene.subMenuIndex;
    const stats = calcStats(mon.species, mon.level);
    const hpPct = Math.round((mon.currentHp / stats.maxHp) * 100);

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 8, y - 4, panelW - 16, 42);
      scene.subPanel.add(selBg);
    }

    const cursor = selected ? "▶" : " ";
    const alive = mon.currentHp > 0;
    const bondMarker = (mon.bond || 0) >= 80 ? "❤️" : "";
    const statusStr = alive ? `HP ${mon.currentHp}/${stats.maxHp} (${hpPct}%)` : "ひんし";
    const nameStr = `${cursor} ${mon.species.emoji} ${mon.species.name}${bondMarker} Lv.${mon.level}`;
    const nameText = scene.add.text(panelX + 16, y, nameStr, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : (alive ? "#e5e7eb" : "#ef4444"),
    });
    scene.subPanel.add(nameText);

    const hpText = scene.add.text(panelX + 38, y + 20, statusStr, {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: alive ? "#9ca3af" : "#ef4444",
    });
    scene.subPanel.add(hpText);
  });

  const hint = scene.add.text(panelX + 16, height - 30, "Z:けってい  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}

export function showBagMessage(scene, text) {
  const { width, height } = scene.scale;
  const msg = scene.add.text(width / 2 - 110, height / 2, text, {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: "#fde68a",
    backgroundColor: "#0f172a",
    padding: { x: 12, y: 8 },
  }).setDepth(100);
  msg.setStroke("#000000", 2);
  scene.time.delayedCall(1200, () => msg.destroy());
}

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
  const dailyLines = gameState.getDailyChallengeSummaryLines();

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
    "",
    `── 闘技場 ──`,
    `最高記録　 : ${gameState.arenaHighScore || 0}連勝`,
    "",
    `── 日替わりチャレンジ ──`,
    ...dailyLines,
    "",
    `── クエスト ──`,
    `スターライト : ${gameState.starQuestDone ? "✅ 完了" : "📋 進行中"}`,
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

export function renderGlobalMapView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;
  const listAreaW = Math.min(250, Math.max(200, Math.floor(panelW * 0.35)));
  const mapAreaX = panelX + listAreaW + 18;
  const mapAreaY = panelY + 44;
  const mapAreaW = Math.max(220, panelW - listAreaW - 30);
  const mapAreaH = 240;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "🗺️ グローバルマップ", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const mapKeys = Object.keys(MAPS).filter((mapKey) => !GLOBAL_MAP_HIDDEN_KEYS.has(mapKey));
  const currentMapKey = gameState.currentMap || "EMOJI_TOWN";
  const fallbackOutdoorKey = (DOOR_TRANSITIONS[currentMapKey] || []).find((transition) => mapKeys.includes(transition.target))?.target;
  const effectiveCurrentMapKey = mapKeys.includes(currentMapKey)
    ? currentMapKey
    : (fallbackOutdoorKey || "EMOJI_TOWN");
  const visitedSet = new Set(Array.isArray(gameState.visitedMapIds) ? gameState.visitedMapIds : []);
  visitedSet.add(effectiveCurrentMapKey);
  const currentMapName = MAPS[effectiveCurrentMapKey]?.name || "???";
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, Math.max(0, mapKeys.length - 1));
  const selectedMapKey = mapKeys[scene.subMenuIndex] || effectiveCurrentMapKey;

  const nodeLayout = {
    EMOJI_TOWN: { x: 0.08, y: 0.56 },
    HOUSE1: { x: 0.06, y: 0.34 },
    LAB: { x: 0.14, y: 0.34 },
    TOWN_SHOP: { x: 0.08, y: 0.78 },
    FOREST: { x: 0.26, y: 0.56 },
    FOREST_GYM: { x: 0.26, y: 0.33 },
    CRYSTAL_CAVE: { x: 0.44, y: 0.56 },
    DARK_TOWER: { x: 0.44, y: 0.82 },
    VOLCANIC_PASS: { x: 0.62, y: 0.56 },
    VOLCANO_SHOP: { x: 0.62, y: 0.82 },
    FROZEN_PEAK: { x: 0.78, y: 0.56 },
    FROZEN_GYM: { x: 0.78, y: 0.33 },
    FROZEN_SHOP: { x: 0.78, y: 0.82 },
    SKY_RUINS: { x: 0.9, y: 0.42 },
    CELESTIAL_GARDEN: { x: 0.9, y: 0.7 },
    GARDEN_SHOP: { x: 0.98, y: 0.82 },
  };

  const nodeCenters = {};
  mapKeys.forEach((mapKey, index) => {
    const fixed = nodeLayout[mapKey];
    const fallbackCol = index % 4;
    const fallbackRow = Math.floor(index / 4);
    const fx = 0.08 + fallbackCol * 0.24;
    const fy = 0.2 + fallbackRow * 0.2;
    const nx = fixed ? fixed.x : fx;
    const ny = fixed ? fixed.y : Math.min(0.92, fy);
    nodeCenters[mapKey] = {
      x: mapAreaX + Math.round(mapAreaW * nx),
      y: mapAreaY + Math.round(mapAreaH * ny),
    };
  });

  const currentLine = scene.add.text(panelX + listAreaW + 24, panelY + 12, `現在地: ${currentMapName}`, {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#cbd5e1",
  });
  scene.subPanel.add(currentLine);

  const listTop = panelY + 44;
  const rowH = 30;
  const listHeight = mapAreaH;
  const visibleCount = Math.max(1, Math.floor(listHeight / rowH));
  const scrollStart = Math.max(0, Math.min(scene.subMenuIndex - Math.floor(visibleCount / 2), mapKeys.length - visibleCount));

  const mapBg = scene.add.graphics();
  mapBg.fillStyle(0x0f172a, 0.52);
  mapBg.fillRoundedRect(mapAreaX, mapAreaY, mapAreaW, mapAreaH, 10);
  mapBg.lineStyle(1, 0x334155, 0.85);
  mapBg.strokeRoundedRect(mapAreaX, mapAreaY, mapAreaW, mapAreaH, 10);
  scene.subPanel.add(mapBg);

  const mapLegend = scene.add.text(mapAreaX + 10, mapAreaY + 8, "ワールド接続図", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#93c5fd",
  });
  scene.subPanel.add(mapLegend);

  const edgeKeys = new Set();
  mapKeys.forEach((source) => {
    const transitions = DOOR_TRANSITIONS[source] || [];
    transitions.forEach((transition) => {
      const target = transition.target;
      if (!mapKeys.includes(target)) return;
      if (!nodeCenters[target]) return;
      const edgeKey = [source, target].sort().join("__");
      if (edgeKeys.has(edgeKey)) return;
      edgeKeys.add(edgeKey);

      const from = nodeCenters[source];
      const to = nodeCenters[target];
      const isFocused = source === selectedMapKey || target === selectedMapKey;

      const edge = scene.add.graphics();
      edge.lineStyle(isFocused ? 2 : 1, isFocused ? 0x93c5fd : 0x475569, isFocused ? 0.95 : 0.7);
      edge.beginPath();
      edge.moveTo(from.x, from.y);
      edge.lineTo(to.x, to.y);
      edge.strokePath();
      scene.subPanel.add(edge);
    });
  });

  mapKeys.forEach((mapKey) => {
    const center = nodeCenters[mapKey];
    const isCurrent = mapKey === effectiveCurrentMapKey;
    const isSelected = mapKey === selectedMapKey;
    const isVisited = visitedSet.has(mapKey);

    const nodeColor = isCurrent ? 0xfacc15 : (isVisited ? 0x94a3b8 : 0x475569);
    const node = scene.add.circle(center.x, center.y, isSelected ? 7 : 5, nodeColor, 0.95);
    scene.subPanel.add(node);

    if (isSelected) {
      const ring = scene.add.circle(center.x, center.y, 11, 0x000000, 0).setStrokeStyle(2, 0xfbbf24, 0.95);
      scene.subPanel.add(ring);
    }

    const mapLabel = isVisited ? (MAPS[mapKey]?.name || mapKey) : "？？？";
    const label = scene.add.text(center.x + 8, center.y - 8, mapLabel, {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: isCurrent ? "#fde68a" : (isSelected ? "#fbbf24" : (isVisited ? "#cbd5e1" : "#64748b")),
    });
    scene.subPanel.add(label);

    if (isCurrent) {
      const pin = scene.add.text(center.x - 4, center.y - 20, "📍", {
        fontFamily: FONT.UI,
        fontSize: 11,
      });
      scene.subPanel.add(pin);
    }
  });

  for (let vi = 0; vi < visibleCount; vi++) {
    const index = scrollStart + vi;
    if (index >= mapKeys.length) break;
    const mapKey = mapKeys[index];
    const selected = index === scene.subMenuIndex;
    const isCurrent = mapKey === effectiveCurrentMapKey;
    const isVisited = visitedSet.has(mapKey);
    const y = listTop + vi * rowH;

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 12, y - 4, listAreaW - 18, 26, { radius: 6 });
      scene.subPanel.add(selBg);
    }

    const prefix = isCurrent ? "📍" : "  ";
    const mapName = isVisited ? (MAPS[mapKey]?.name || mapKey) : "？？？";
    const rowText = scene.add.text(panelX + 24, y, `${selected ? "▶" : " "} ${prefix} ${mapName}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : (isCurrent ? "#93c5fd" : (isVisited ? "#e5e7eb" : "#64748b")),
    });
    scene.subPanel.add(rowText);
  }

  const divider = scene.add.graphics();
  divider.fillStyle(0x334155, 0.65);
  divider.fillRoundedRect(panelX + 12, panelY + 286, panelW - 24, 2, 1);
  scene.subPanel.add(divider);

  const selectedVisited = visitedSet.has(selectedMapKey);
  const selectedName = selectedVisited ? (MAPS[selectedMapKey]?.name || selectedMapKey) : "？？？";
  const connectionTitle = scene.add.text(panelX + 20, panelY + 300, `接続先: ${selectedName}`, {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#93c5fd",
  });
  scene.subPanel.add(connectionTitle);

  const targets = Array.from(new Set((DOOR_TRANSITIONS[selectedMapKey] || [])
    .filter((transition) => mapKeys.includes(transition.target))
    .map((transition) => {
      const targetVisited = visitedSet.has(transition.target);
      return targetVisited ? (MAPS[transition.target]?.name || transition.target) : "？？？";
    })));

  const connectionLines = targets.length > 0
    ? targets.map((name) => `・${name}`)
    : ["・接続先なし"];
  const connectionBody = scene.add.text(panelX + 24, panelY + 326, connectionLines.join("\n"), {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#cbd5e1",
    lineSpacing: 6,
  });
  scene.subPanel.add(connectionBody);

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:エリア選択  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}

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

  const settings = gameState.audioSettings;
  const gameplay = gameState.gameplaySettings || {};
  const speedLabelMap = {
    NORMAL: "ノーマル",
    FAST: "はやい",
    TURBO: "さいこうそく",
  };
  const battleSpeedLabel = speedLabelMap[gameplay.battleSpeed] || speedLabelMap.NORMAL;
  const rows = [
    { key: "mute", label: `ミュート: ${settings.muted ? "ON" : "OFF"}` },
    { key: "bgm", label: `BGM音量 : ${"█".repeat(Math.round(settings.bgmVolume * 10))}${"░".repeat(10 - Math.round(settings.bgmVolume * 10))} ${Math.round(settings.bgmVolume * 100)}%` },
    { key: "se", label: `SE音量  : ${"█".repeat(Math.round(settings.seVolume * 10))}${"░".repeat(10 - Math.round(settings.seVolume * 10))} ${Math.round(settings.seVolume * 100)}%` },
    { key: "battleSpeed", label: `バトル速度: ${battleSpeedLabel}` },
    { key: "autoAdvanceMessages", label: `メッセージ自動送り: ${gameplay.autoAdvanceMessages ? "ON" : "OFF"}` },
    { key: "shortEncounterEffect", label: `エンカウント演出短縮: ${gameplay.shortEncounterEffect ? "ON" : "OFF"}` },
    { key: "save", label: "セーブ" },
    { key: "deleteSave", label: "セーブデータ削除" },
  ];

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
      color: selected
        ? "#fbbf24"
        : (row.key === "deleteSave" ? "#ef4444" : row.key === "save" ? "#86efac" : "#e5e7eb"),
    });
    scene.subPanel.add(text);
  });

  const hint = scene.add.text(panelX + 16, height - 30, "←→/Z:値変更・切替  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);

  scene.cursors.left.removeAllListeners("down");
  scene.cursors.right.removeAllListeners("down");
  scene.input.keyboard.off("keydown-LEFT");
  scene.input.keyboard.off("keydown-RIGHT");
  scene.input.keyboard.on("keydown-LEFT", () => scene._adjustVolume(-0.05));
  scene.input.keyboard.on("keydown-RIGHT", () => scene._adjustVolume(0.05));

  if (scene.settingsConfirmActive) {
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.62);
    overlay.fillRect(panelX, panelY, panelW, height - 20);
    scene.subPanel.add(overlay);

    const dialogW = Math.min(380, panelW - 40);
    const dialogH = 144;
    const dialogX = panelX + (panelW - dialogW) / 2;
    const dialogY = panelY + (height - 20 - dialogH) / 2;
    const dialogBg = scene.add.graphics();
    drawPanel(dialogBg, dialogX, dialogY, dialogW, dialogH, { radius: 10, headerHeight: 24 });
    scene.subPanel.add(dialogBg);

    const titleText = scene.add.text(dialogX + 14, dialogY + 10, "⚠ セーブデータを削除しますか？", {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#fca5a5",
    });
    scene.subPanel.add(titleText);

    const noteText = scene.add.text(dialogX + 14, dialogY + 42, "削除するとメイン/バックアップの両方が消えます。", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#cbd5e1",
      wordWrap: { width: dialogW - 28 },
    });
    scene.subPanel.add(noteText);

    const yesSelected = scene.settingsConfirmIndex === 0;
    const noSelected = !yesSelected;
    const yesText = scene.add.text(dialogX + 34, dialogY + 98, `${yesSelected ? "▶" : " "} はい（削除する）`, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: yesSelected ? "#fbbf24" : "#e5e7eb",
    });
    const noText = scene.add.text(dialogX + dialogW - 150, dialogY + 98, `${noSelected ? "▶" : " "} いいえ`, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: noSelected ? "#fbbf24" : "#e5e7eb",
    });
    scene.subPanel.add(yesText);
    scene.subPanel.add(noText);
  }
}
