import { gameState } from "../../state/gameState.ts";
import { getItemById } from "../../data/items.ts";
import { getAllMonsters, calcStats, getMonsterMoves } from "../../data/monsters.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { MENU_ITEMS, GUIDE_PAGES } from "./menuConstants.ts";

export function renderMainMenu(scene) {
  scene.menuPanel.removeAll(true);
  const { width } = scene.scale;
  const panelW = 200;
  const panelX = width - panelW - 10;
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
    const text = scene.add.text(panelX + 20, y, selected ? `▶ ${label}` : `  ${label}`, {
      fontFamily: FONT.UI,
      fontSize: 16,
      color: selected ? "#fde68a" : "#e5e7eb",
    });
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
    case "guide":
      renderGuideView(scene);
      break;
    case "settings":
      renderSettingsView(scene);
      break;
  }
}

export function renderPartyView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - 230;
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
    const typeText = scene.add.text(panelX + panelW - 90, y, mon.species.primaryType, {
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
  const typeText = scene.add.text(panelX + panelW - 90, y, mon.species.primaryType, {
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
  const panelW = width - 230;
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
  const panelW = width - 230;
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
  const panelW = width - 230;
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
  const panelW = width - 230;
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
  const panelW = width - 230;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const allMons = getAllMonsters();
  const caughtCount = gameState.caughtIds.length;
  const seenCount = gameState.seenIds.length;

  const title = scene.add.text(panelX + 16, panelY + 10,
    `📖 ずかん  みつけた:${seenCount}  つかまえた:${caughtCount}/${allMons.length}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#fbbf24",
    });
  scene.subPanel.add(title);

  const visibleCount = Math.floor((height - 80) / 28);
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
    const typeStr = seen ? mon.primaryType : "???";
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

  const selectedMon = allMons[scene.subMenuIndex];
  if (selectedMon && gameState.seenIds.includes(selectedMon.id)) {
    const descY = height - 60;
    const desc = gameState.caughtIds.includes(selectedMon.id)
      ? selectedMon.description || "情報なし"
      : "つかまえると くわしい情報がみれる";
    const descText = scene.add.text(panelX + 16, descY, desc, {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#9ca3af",
      wordWrap: { width: panelW - 32 },
    });
    scene.subPanel.add(descText);
  }
}

export function renderTrainerView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - 230;
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

  let y = panelY + 44;
  info.forEach((line) => {
    const text = scene.add.text(panelX + 24, y, line, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: line.startsWith("──") ? "#fbbf24" : "#d1d5db",
    });
    scene.subPanel.add(text);
    y += 22;
  });
}

export function renderGuideView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - 230;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const maxPage = GUIDE_PAGES.length - 1;
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, maxPage);
  const page = GUIDE_PAGES[scene.subMenuIndex];

  const title = scene.add.text(panelX + 16, panelY + 10, page.title, {
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

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:ページ切替  Z:次ページ  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}

export function renderSettingsView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - 230;
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
      color: selected ? "#fbbf24" : (row.key === "deleteSave" ? "#ef4444" : "#e5e7eb"),
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
}
