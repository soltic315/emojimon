import { gameState } from "../../state/gameState.ts";
import { getItemById } from "../../data/items.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";

const SHOP_MODE = {
  ROOT: "ROOT",
  BUY: "BUY",
  SELL: "SELL",
};

const SELL_PRICE_RATE = 0.5;

function entry(itemId, price) {
  return { itemId, price };
}

const SHOP_INVENTORY_BY_MAP = {
  TOWN_SHOP: [
    entry("POTION", 50),
    entry("SUPER_POTION", 150),
    entry("BURN_HEAL", 80),
    entry("PARALYZE_HEAL", 80),
    entry("ICE_HEAL", 80),
    entry("AWAKENING", 80),
    entry("ANTIDOTE", 80),
    entry("EMO_BALL", 120),
    entry("GREAT_BALL", 300),
    entry("POWER_SEED", 80),
  ],
  VOLCANO_SHOP: [
    entry("SUPER_POTION", 150),
    entry("HYPER_POTION", 320),
    entry("FULL_RESTORE", 800),
    entry("BURN_HEAL", 80),
    entry("REVIVE", 500),
    entry("GREAT_BALL", 300),
    entry("ULTRA_BALL", 600),
    entry("POWER_SEED", 80),
    entry("RAGE_CANDY", 220),
    entry("X_SPEED", 120),
  ],
  FROZEN_SHOP: [
    entry("SUPER_POTION", 150),
    entry("HYPER_POTION", 320),
    entry("FULL_RESTORE", 800),
    entry("ICE_HEAL", 80),
    entry("REVIVE", 500),
    entry("GREAT_BALL", 300),
    entry("ULTRA_BALL", 600),
    entry("IRON_SEED", 80),
    entry("GUARD_CHARM", 220),
    entry("X_SPEED", 120),
  ],
  GARDEN_SHOP: [
    entry("HYPER_POTION", 320),
    entry("MEGA_POTION", 650),
    entry("FULL_RESTORE", 800),
    entry("REVIVE", 500),
    entry("RESCUE_GEL", 900),
    entry("ULTRA_BALL", 600),
    entry("DUSK_BALL", 900),
    entry("ETHER", 200),
    entry("MEGA_ETHER", 420),
    entry("MAX_ELIXIR", 600),
  ],
  SWAMP_SHOP: [
    entry("POTION", 50),
    entry("SUPER_POTION", 150),
    entry("ANTIDOTE", 80),
    entry("BURN_HEAL", 80),
    entry("PARALYZE_HEAL", 80),
    entry("ICE_HEAL", 80),
    entry("AWAKENING", 80),
    entry("EMO_BALL", 120),
    entry("GREAT_BALL", 300),
    entry("X_SPEED", 120),
  ],
  SAND_VALLEY_SHOP: [
    entry("SUPER_POTION", 150),
    entry("HYPER_POTION", 320),
    entry("FULL_RESTORE", 800),
    entry("ANTIDOTE", 80),
    entry("AWAKENING", 80),
    entry("REVIVE", 500),
    entry("GREAT_BALL", 300),
    entry("ULTRA_BALL", 600),
    entry("RAGE_CANDY", 220),
    entry("ETHER", 200),
  ],
  BASIN_SHOP: [
    entry("HYPER_POTION", 320),
    entry("MEGA_POTION", 650),
    entry("FULL_RESTORE", 800),
    entry("REVIVE", 500),
    entry("RESCUE_GEL", 900),
    entry("ULTRA_BALL", 600),
    entry("DUSK_BALL", 900),
    entry("MASTER_BALL", 9999),
    entry("MEGA_ETHER", 420),
    entry("MAX_ELIXIR", 600),
  ],
};

const DEFAULT_SHOP_INVENTORY = SHOP_INVENTORY_BY_MAP.TOWN_SHOP;

export function getShopInventory(mapKey = "TOWN_SHOP") {
  return [...(SHOP_INVENTORY_BY_MAP[mapKey] || DEFAULT_SHOP_INVENTORY)];
}

function getMoneyText() {
  return `所持金: ${gameState.money}G`;
}

function getSellPrice(itemId) {
  const item = getItemById(itemId);
  const basePrice = Math.max(0, item?.price || 0);
  return Math.max(1, Math.floor(basePrice * SELL_PRICE_RATE));
}

function getRootEntries() {
  return [
    { kind: "ROOT_BUY", label: "かう" },
    { kind: "ROOT_SELL", label: "うる" },
    { kind: "CLOSE", label: "やめる" },
  ];
}

function getBuyEntries(scene) {
  const buyItems = scene.shopItems || [];
  const rows = buyItems.map((shopItem) => {
    const item = getItemById(shopItem.itemId);
    return {
      kind: "BUY_ITEM",
      itemId: shopItem.itemId,
      price: shopItem.price,
      label: `${item ? item.emoji : ""} ${item ? item.name : shopItem.itemId} — ${shopItem.price}G`,
    };
  });
  rows.push({ kind: "BACK", label: "もどる" });
  return rows;
}

function getSellEntries() {
  const sellable = (gameState.inventory || [])
    .filter((inv) => inv.quantity > 0)
    .map((inv) => {
      const item = getItemById(inv.itemId);
      const sellPrice = getSellPrice(inv.itemId);
      return {
        kind: "SELL_ITEM",
        itemId: inv.itemId,
        quantity: inv.quantity,
        price: sellPrice,
        label: `${item ? item.emoji : ""} ${item ? item.name : inv.itemId} ×${inv.quantity} — ${sellPrice}G`,
      };
    });

  if (sellable.length === 0) {
    sellable.push({ kind: "EMPTY", label: "うれるアイテムが ない" });
  }
  sellable.push({ kind: "BACK", label: "もどる" });
  return sellable;
}

function getShopEntries(scene) {
  if (scene.shopMode === SHOP_MODE.BUY) return getBuyEntries(scene);
  if (scene.shopMode === SHOP_MODE.SELL) return getSellEntries();
  return getRootEntries();
}

function getShopTitle(scene) {
  if (scene.shopMode === SHOP_MODE.BUY) return "🏪 かう";
  if (scene.shopMode === SHOP_MODE.SELL) return "🏪 うる";
  return "🏪 ショップ";
}

function setShopInfoText(scene, message) {
  scene.setInfoText(`${message}  ${getMoneyText()}`);
}

function returnToRootMenu(scene) {
  scene.shopMode = SHOP_MODE.ROOT;
  scene.shopSelectedIndex = 0;
  renderShopMenu(scene);
  setShopInfoText(scene, "ごようけんを えらんでね。");
}

export function openShopMenu(scene) {
  scene.shopActive = true;
  scene.shopMode = SHOP_MODE.ROOT;
  scene.shopSelectedIndex = 0;
  scene.shopInputGuardUntil = (scene.time?.now || 0) + 180;
  scene.shopItems = getShopInventory(scene.mapKey);
  clearShopMenu(scene);
  renderShopMenu(scene);
  setShopInfoText(scene, "いらっしゃいませ！");
}

export function closeShopMenu(scene) {
  audioManager.playCancel();
  scene.shopActive = false;
  clearShopMenu(scene);
  scene.updateDefaultInfoMessage();
}

export function clearShopMenu(scene) {
  if (scene.shopContainer) {
    scene.shopContainer.destroy(true);
    scene.shopContainer = null;
  }
}

export function renderShopMenu(scene) {
  clearShopMenu(scene);
  scene.shopContainer = scene.add.container(0, 0).setScrollFactor(0);
  const { width, height } = scene.scale;
  const entries = getShopEntries(scene);
  scene.shopEntries = entries;

  if (scene.shopSelectedIndex > entries.length - 1) {
    scene.shopSelectedIndex = Math.max(0, entries.length - 1);
  }

  const totalEntries = entries.length;
  const maxVisibleEntries = 9;
  const visibleEntries = Math.min(totalEntries, maxVisibleEntries);
  const halfWindow = Math.floor(visibleEntries / 2);
  const maxStartIndex = Math.max(0, totalEntries - visibleEntries);
  const startIndex = Math.max(0, Math.min(scene.shopSelectedIndex - halfWindow, maxStartIndex));
  const endIndex = startIndex + visibleEntries;

  const panelH = (visibleEntries + 3) * 26 + 20;
  const panelY = height - 54 - panelH;
  const bg = scene.add.graphics();
  drawPanel(bg, width / 2 - 160, panelY, 320, panelH, { radius: 10 });
  scene.shopContainer.add(bg);

  const titleText = scene.add.text(width / 2, panelY + 10, getShopTitle(scene), {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: "#fbbf24",
  }).setOrigin(0.5, 0);
  scene.shopContainer.add(titleText);

  const moneyText = scene.add.text(width - 56, panelY + 12, getMoneyText(), {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#f8fafc",
  }).setOrigin(1, 0);
  scene.shopContainer.add(moneyText);

  let row = 0;
  for (let i = startIndex; i < endIndex; i++) {
    const y = panelY + 60 + row * 26;
    const selected = i === scene.shopSelectedIndex;
    const rowEntry = entries[i];
    const label = rowEntry?.label || "";

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, width / 2 - 145, y - 2, 290, 24, { radius: 4 });
      scene.shopContainer.add(selBg);
    }

    const text = scene.add.text(width / 2, y, selected ? `▶ ${label}` : `  ${label}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : "#d1d5db",
    }).setOrigin(0.5, 0);
    scene.shopContainer.add(text);
    row += 1;
  }

  if (totalEntries > visibleEntries) {
    const topHint = scene.add.text(width / 2 + 140, panelY + 38, startIndex > 0 ? "▲" : " ", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#94a3b8",
    }).setOrigin(1, 0);
    scene.shopContainer.add(topHint);

    const bottomHint = scene.add.text(width / 2 + 140, panelY + panelH - 18, endIndex < totalEntries ? "▼" : " ", {
      fontFamily: FONT.UI,
      fontSize: 12,
      color: "#94a3b8",
    }).setOrigin(1, 0);
    scene.shopContainer.add(bottomHint);

    const scrollHint = scene.add.text(width / 2, panelY + panelH - 16, "↑↓でスクロール", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#94a3b8",
    }).setOrigin(0.5, 0);
    scene.shopContainer.add(scrollHint);
  }
}

export function handleShopInput(scene) {
  const inputGuardActive = Number.isFinite(scene.shopInputGuardUntil)
    && scene.time?.now < scene.shopInputGuardUntil;
  if (inputGuardActive) return;

  const entries = scene.shopEntries || getShopEntries(scene);
  const upPressed = Phaser.Input.Keyboard.JustDown(scene.cursors.up)
    || Phaser.Input.Keyboard.JustDown(scene.keys.W);
  const downPressed = Phaser.Input.Keyboard.JustDown(scene.cursors.down)
    || Phaser.Input.Keyboard.JustDown(scene.keys.S);

  if (upPressed) {
    scene.shopSelectedIndex = Math.max(0, scene.shopSelectedIndex - 1);
    audioManager.playCursor();
    renderShopMenu(scene);
  } else if (downPressed) {
    scene.shopSelectedIndex = Math.min(entries.length - 1, scene.shopSelectedIndex + 1);
    audioManager.playCursor();
    renderShopMenu(scene);
  }

  const confirm = Phaser.Input.Keyboard.JustDown(scene.keys.Z)
    || Phaser.Input.Keyboard.JustDown(scene.keys.ENTER)
    || Phaser.Input.Keyboard.JustDown(scene.keys.SPACE);
  if (confirm) {
    const selected = entries[scene.shopSelectedIndex];
    if (!selected) {
      audioManager.playError();
      return;
    }

    if (selected.kind === "ROOT_BUY") {
      audioManager.playConfirm();
      scene.shopMode = SHOP_MODE.BUY;
      scene.shopSelectedIndex = 0;
      renderShopMenu(scene);
      setShopInfoText(scene, "なにを かう？");
      return;
    }

    if (selected.kind === "ROOT_SELL") {
      audioManager.playConfirm();
      scene.shopMode = SHOP_MODE.SELL;
      scene.shopSelectedIndex = 0;
      renderShopMenu(scene);
      setShopInfoText(scene, "なにを うる？");
      return;
    }

    if (selected.kind === "CLOSE") {
      closeShopMenu(scene);
      return;
    }

    if (selected.kind === "BACK") {
      audioManager.playCancel();
      returnToRootMenu(scene);
      return;
    }

    if (selected.kind === "EMPTY") {
      audioManager.playError();
      setShopInfoText(scene, "うれるものが ないよ。");
      return;
    }

    if (selected.kind === "BUY_ITEM") {
      if (gameState.spendMoney(selected.price)) {
        audioManager.playBuy();
        gameState.addItem(selected.itemId, 1);
        const item = getItemById(selected.itemId);
        setShopInfoText(scene, `${item ? item.name : selected.itemId}を かった！`);
        renderShopMenu(scene);
        scene.createUi();
      } else {
        audioManager.playError();
        setShopInfoText(scene, "お金が たりない…");
      }
      return;
    }

    if (selected.kind === "SELL_ITEM") {
      const inv = gameState.inventory.find((it) => it.itemId === selected.itemId);
      if (!inv || inv.quantity <= 0) {
        audioManager.playError();
        setShopInfoText(scene, "そのアイテムは もうないよ。");
        renderShopMenu(scene);
        return;
      }

      inv.quantity -= 1;
      if (inv.quantity <= 0) {
        gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
      }
      gameState.addMoney(selected.price);
      audioManager.playBuy();
      const item = getItemById(selected.itemId);
      setShopInfoText(scene, `${item ? item.name : selected.itemId}を うった！ +${selected.price}G`);
      renderShopMenu(scene);
      scene.createUi();
      return;
    }
  }

  if (Phaser.Input.Keyboard.JustDown(scene.keys.X)) {
    if (scene.shopMode === SHOP_MODE.ROOT) {
      closeShopMenu(scene);
    } else {
      audioManager.playCancel();
      returnToRootMenu(scene);
    }
  }
}
