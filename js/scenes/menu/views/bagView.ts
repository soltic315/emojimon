// バッグ画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { getItemById } from "../../../data/items.ts";
import { calcStats } from "../../../data/monsters.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

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
