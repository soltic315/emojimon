import { gameState } from "../../state/gameState.ts";
import { getItemById } from "../../data/items.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";

export function getShopInventory() {
  return [
    { itemId: "POTION", price: 50 },
    { itemId: "SUPER_POTION", price: 150 },
    { itemId: "HYPER_POTION", price: 320 },
    { itemId: "MEGA_POTION", price: 650 },
    { itemId: "FULL_RESTORE", price: 800 },
    { itemId: "BURN_HEAL", price: 80 },
    { itemId: "PARALYZE_HEAL", price: 80 },
    { itemId: "ICE_HEAL", price: 80 },
    { itemId: "AWAKENING", price: 80 },
    { itemId: "ANTIDOTE", price: 80 },
    { itemId: "POWER_SEED", price: 80 },
    { itemId: "RAGE_CANDY", price: 220 },
    { itemId: "IRON_SEED", price: 80 },
    { itemId: "GUARD_CHARM", price: 220 },
    { itemId: "X_SPEED", price: 120 },
    { itemId: "EMO_BALL", price: 120 },
    { itemId: "GREAT_BALL", price: 300 },
    { itemId: "ULTRA_BALL", price: 600 },
    { itemId: "DUSK_BALL", price: 900 },
    { itemId: "MASTER_BALL", price: 9999 },
    { itemId: "REVIVE", price: 500 },
    { itemId: "RESCUE_GEL", price: 900 },
    { itemId: "ETHER", price: 200 },
    { itemId: "MEGA_ETHER", price: 420 },
    { itemId: "MAX_ELIXIR", price: 600 },
  ];
}

export function openShopMenu(scene) {
  scene.shopActive = true;
  scene.shopSelectedIndex = 0;
  scene.shopItems = getShopInventory();
  clearShopMenu(scene);
  renderShopMenu(scene);
  scene.setInfoText(`いらっしゃいませ！ 所持金: ${gameState.money}G`);
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

  const totalEntries = scene.shopItems.length + 1;
  const maxVisibleEntries = 9;
  const visibleEntries = Math.min(totalEntries, maxVisibleEntries);
  const halfWindow = Math.floor(visibleEntries / 2);
  const maxStartIndex = Math.max(0, totalEntries - visibleEntries);
  const startIndex = Math.max(0, Math.min(scene.shopSelectedIndex - halfWindow, maxStartIndex));
  const endIndex = startIndex + visibleEntries;

  const panelH = (visibleEntries + 2) * 26 + 20;
  const panelY = height - 54 - panelH;
  const bg = scene.add.graphics();
  drawPanel(bg, width / 2 - 160, panelY, 320, panelH, { radius: 10 });
  scene.shopContainer.add(bg);

  const titleText = scene.add.text(width / 2, panelY + 10, "🏪 ショップ", {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: "#fbbf24",
  }).setOrigin(0.5, 0);
  scene.shopContainer.add(titleText);

  let row = 0;
  for (let i = startIndex; i < endIndex; i++) {
    const y = panelY + 36 + row * 26;
    const selected = i === scene.shopSelectedIndex;

    let label = "やめる";
    if (i < scene.shopItems.length) {
      const entry = scene.shopItems[i];
      const item = getItemById(entry.itemId);
      label = `${item ? item.emoji : ""} ${item ? item.name : entry.itemId} — ${entry.price}G`;
    }

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
}

export function handleShopInput(scene) {
  const upPressed = Phaser.Input.Keyboard.JustDown(scene.cursors.up)
    || Phaser.Input.Keyboard.JustDown(scene.keys.W);
  const downPressed = Phaser.Input.Keyboard.JustDown(scene.cursors.down)
    || Phaser.Input.Keyboard.JustDown(scene.keys.S);

  if (upPressed) {
    scene.shopSelectedIndex = Math.max(0, scene.shopSelectedIndex - 1);
    audioManager.playCursor();
    renderShopMenu(scene);
  } else if (downPressed) {
    scene.shopSelectedIndex = Math.min(scene.shopItems.length, scene.shopSelectedIndex + 1);
    audioManager.playCursor();
    renderShopMenu(scene);
  }

  const confirm = Phaser.Input.Keyboard.JustDown(scene.keys.Z)
    || Phaser.Input.Keyboard.JustDown(scene.keys.SPACE);
  if (confirm) {
    if (scene.shopSelectedIndex === scene.shopItems.length) {
      closeShopMenu(scene);
    } else {
      const entry = scene.shopItems[scene.shopSelectedIndex];
      if (gameState.spendMoney(entry.price)) {
        audioManager.playBuy();
        const exist = gameState.inventory.find((it) => it.itemId === entry.itemId);
        if (exist) exist.quantity += 1;
        else gameState.inventory.push({ itemId: entry.itemId, quantity: 1 });
        const item = getItemById(entry.itemId);
        scene.setInfoText(`${item ? item.name : entry.itemId}を かった！ 残り${gameState.money}G`);
        scene.createUi();
      } else {
        audioManager.playError();
        scene.setInfoText("お金が たりない…");
      }
    }
  }

  if (Phaser.Input.Keyboard.JustDown(scene.keys.X)) {
    closeShopMenu(scene);
  }
}
