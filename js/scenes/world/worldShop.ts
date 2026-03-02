import { gameState } from "../../state/gameState.ts";
import { getItemById } from "../../data/items.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, UI_LAYOUT, UI_FONT_SIZE, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { NAV_REPEAT_INITIAL_DELAY_MS, NAV_REPEAT_INTERVAL_MS } from "../../ui/inputConstants.ts";

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

function getInventoryQuantity(itemId) {
  const inv = (gameState.inventory || []).find((it) => it.itemId === itemId);
  return inv?.quantity || 0;
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
  scene.shopNavHoldDirection = 0;
  scene.shopNavNextRepeatAt = 0;
  scene.shopItems = getShopInventory(scene.mapKey);
  clearShopMenu(scene);
  renderShopMenu(scene);
  setShopInfoText(scene, "いらっしゃいませ！");
}

export function closeShopMenu(scene) {
  audioManager.playCancel();
  scene.shopActive = false;
  scene.shopNavHoldDirection = 0;
  scene.shopNavNextRepeatAt = 0;
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

  const panelW = Math.min(380, width - UI_LAYOUT.SAFE_MARGIN * 2);
  const panelX = Math.floor((width - panelW) / 2);
  const rowH = 30;
  const listTopOffset = 48;
  const showSellDetail = scene.shopMode === SHOP_MODE.SELL;
  const detailH = showSellDetail ? 56 : 0;
  const footerH = (totalEntries > visibleEntries ? 26 : 12) + detailH;
  const panelH = listTopOffset + visibleEntries * rowH + footerH;
  const messageTop = height - UI_LAYOUT.SAFE_MARGIN - UI_LAYOUT.MESSAGE_PANEL_HEIGHT;
  const panelY = Math.max(UI_LAYOUT.SAFE_MARGIN, messageTop - UI_LAYOUT.PANEL_GAP - panelH);

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, panelH, { radius: 12, headerHeight: 30 });
  scene.shopContainer.add(bg);

  const titleText = scene.add.text(panelX + 16, panelY + 8, getShopTitle(scene), {
    fontFamily: FONT.UI,
    fontSize: UI_FONT_SIZE.TITLE,
    color: "#fbbf24",
    fontStyle: "700",
  }).setOrigin(0, 0);
  scene.shopContainer.add(titleText);

  const moneyText = scene.add.text(panelX + panelW - 16, panelY + 12, getMoneyText(), {
    fontFamily: FONT.UI,
    fontSize: UI_FONT_SIZE.CAPTION,
    color: "#f8fafc",
  }).setOrigin(1, 0);
  scene.shopContainer.add(moneyText);

  let row = 0;
  for (let i = startIndex; i < endIndex; i++) {
    const y = panelY + listTopOffset + row * rowH;
    const selected = i === scene.shopSelectedIndex;
    const rowEntry = entries[i];
    const label = rowEntry?.label || "";

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 10, y - 2, panelW - 20, rowH - 3, { radius: 6 });
      scene.shopContainer.add(selBg);
    }

    const text = scene.add.text(panelX + 18, y + 2, selected ? `▶ ${label}` : `   ${label}`, {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.BODY,
      color: selected ? "#fbbf24" : "#d1d5db",
      fontStyle: selected ? "700" : "400",
    }).setOrigin(0, 0);
    scene.shopContainer.add(text);
    row += 1;
  }

  if (totalEntries > visibleEntries) {
    const topHint = scene.add.text(panelX + panelW - 16, panelY + 34, startIndex > 0 ? "▲" : " ", {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.MICRO,
      color: "#94a3b8",
    }).setOrigin(1, 0);
    scene.shopContainer.add(topHint);

    const bottomHint = scene.add.text(panelX + panelW - 16, panelY + panelH - 18, endIndex < totalEntries ? "▼" : " ", {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.MICRO,
      color: "#94a3b8",
    }).setOrigin(1, 0);
    scene.shopContainer.add(bottomHint);

    const scrollHint = scene.add.text(panelX + panelW / 2, panelY + panelH - 18, "↑↓でスクロール", {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.MICRO,
      color: "#94a3b8",
    }).setOrigin(0.5, 0);
    scene.shopContainer.add(scrollHint);
  }

  if (showSellDetail) {
    const selected = entries[scene.shopSelectedIndex];
    const isSellItem = selected?.kind === "SELL_ITEM";
    const item = isSellItem ? getItemById(selected.itemId) : null;
    const currentQuantity = isSellItem ? getInventoryQuantity(selected.itemId) : 0;
    const afterSellQuantity = Math.max(0, currentQuantity - 1);
    const detailTop = panelY + panelH - detailH + 6;
    const detailText = isSellItem
      ? `説明: ${item?.description || "説明なし"}`
      : "説明: 売却するアイテムを選んでください。";
    const quantityText = isSellItem
      ? `売却後所持数: ${afterSellQuantity}個`
      : "売却後所持数: -";

    const detail = scene.add.text(panelX + 18, detailTop, detailText, {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.MICRO,
      color: "#d1d5db",
      wordWrap: { width: panelW - 36 },
    }).setOrigin(0, 0);
    scene.shopContainer.add(detail);

    const quantity = scene.add.text(panelX + 18, detailTop + 26, quantityText, {
      fontFamily: FONT.UI,
      fontSize: UI_FONT_SIZE.MICRO,
      color: "#fbbf24",
      fontStyle: "700",
    }).setOrigin(0, 0);
    scene.shopContainer.add(quantity);
  }
}

function moveShopCursor(scene, entries, direction) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const nextIndex = Phaser.Math.Clamp(scene.shopSelectedIndex + direction, 0, entries.length - 1);
  if (nextIndex === scene.shopSelectedIndex) return;
  scene.shopSelectedIndex = nextIndex;
  audioManager.playCursor();
  renderShopMenu(scene);
}

function handleShopVerticalRepeatInput(scene, entries, upPressed, downPressed, upHeld, downHeld) {
  const now = scene.time?.now || 0;

  if (upPressed) {
    scene.shopNavHoldDirection = -1;
    scene.shopNavNextRepeatAt = now + NAV_REPEAT_INITIAL_DELAY_MS;
    moveShopCursor(scene, entries, -1);
    return;
  }

  if (downPressed) {
    scene.shopNavHoldDirection = 1;
    scene.shopNavNextRepeatAt = now + NAV_REPEAT_INITIAL_DELAY_MS;
    moveShopCursor(scene, entries, 1);
    return;
  }

  const holdDirection = upHeld ? -1 : downHeld ? 1 : 0;
  if (holdDirection === 0) {
    scene.shopNavHoldDirection = 0;
    return;
  }

  if (scene.shopNavHoldDirection !== holdDirection) {
    scene.shopNavHoldDirection = holdDirection;
    scene.shopNavNextRepeatAt = now + NAV_REPEAT_INITIAL_DELAY_MS;
    return;
  }

  if (now >= (scene.shopNavNextRepeatAt || 0)) {
    scene.shopNavNextRepeatAt = now + NAV_REPEAT_INTERVAL_MS;
    moveShopCursor(scene, entries, holdDirection);
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
  const upHeld = !!(scene.cursors.up.isDown || scene.keys.W.isDown);
  const downHeld = !!(scene.cursors.down.isDown || scene.keys.S.isDown);

  handleShopVerticalRepeatInput(scene, entries, upPressed, downPressed, upHeld, downHeld);

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
      const remainQuantity = getInventoryQuantity(selected.itemId);
      setShopInfoText(scene, `${item ? item.name : selected.itemId}を うった！ +${selected.price}G（のこり${remainQuantity}個）`);
      renderShopMenu(scene);
      scene.createUi();
      return;
    }
  }

  if (Phaser.Input.Keyboard.JustDown(scene.keys.X) || Phaser.Input.Keyboard.JustDown(scene.keys.ESC)) {
    if (scene.shopMode === SHOP_MODE.ROOT) {
      closeShopMenu(scene);
    } else {
      audioManager.playCancel();
      returnToRootMenu(scene);
    }
  }
}
