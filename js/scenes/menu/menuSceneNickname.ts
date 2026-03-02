import { gameState } from "../../state/gameState.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, TEXT_COLORS, drawSelection } from "../../ui/UIHelper.ts";
import { truncateKeyboardText } from "../../ui/gameKeyboard.ts";

type MenuSceneLike = Phaser.Scene & Record<string, any>;

export function handleNicknameShortcut(scene: MenuSceneLike) {
  if (scene.nicknameInputActive) return;
  if (!scene.subMenuActive || scene.subMenuType !== "party") return;
  if (scene.partySwapMode || scene.partyFusionMode) return;
  const mon = gameState.party[scene.subMenuIndex];
  if (!mon || !mon.species) return;

  openNicknameKeyboard(scene, mon);
}

export function openNicknameKeyboard(scene: MenuSceneLike, monster: any) {
  if (!monster) return;

  if (scene.nicknameInputCleanup) {
    scene.nicknameInputCleanup();
    scene.nicknameInputCleanup = null;
  }

  scene.nicknameInputActive = true;
  scene.nicknameTargetMonster = monster;
  scene.nicknameInput = truncateKeyboardText(monster.nickname || "", 12);

  if (scene.nicknameInputOverlay) {
    scene.nicknameInputOverlay.destroy(true);
    scene.nicknameInputOverlay = null;
  }

  const { width, height } = scene.scale;
  const titleY = Math.max(96, height - 208);
  scene.nicknameInputOverlay = scene.add.container(0, 0).setDepth(2100);

  const title = scene.add.text(width / 2, titleY, `${monster.species.emoji} ニックネーム入力`, {
    fontFamily: FONT.UI,
    fontSize: 16,
    color: TEXT_COLORS.ACCENT,
  }).setOrigin(0.5, 0);
  scene.nicknameInputOverlay.add(title);

  const inputBg = scene.add.graphics();
  drawSelection(inputBg, width / 2 - 150, titleY + 40, 300, 42, { radius: 8 });
  scene.nicknameInputOverlay.add(inputBg);

  scene.nicknameInputText = scene.add.text(width / 2, titleY + 50, "", {
    fontFamily: FONT.UI,
    fontSize: 22,
    color: "#e5e7eb",
    align: "center",
  }).setOrigin(0.5, 0);
  scene.nicknameInputOverlay.add(scene.nicknameInputText);

  const guide = scene.add.text(width / 2, titleY + 92, "直接入力: 最大12文字", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.nicknameInputOverlay.add(guide);

  const controls = scene.add.text(width / 2, titleY + 112, "Enter: 決定  Backspace: 1文字削除  Esc: キャンセル", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.nicknameInputOverlay.add(controls);

  updateNicknameInputDisplay(scene);
  bindNicknameInputElement(scene);
}

export function handleNicknameKeyboardNavigation(scene: MenuSceneLike) {
  void scene;
}

export function confirmNicknameInput(scene: MenuSceneLike) {
  if (!scene.nicknameInputActive) return;
  closeNicknameKeyboard(scene, true);
}

export function deleteNicknameChar(scene: MenuSceneLike) {
  const chars = Array.from(scene.nicknameInput || "");
  if (chars.length === 0) return;
  chars.pop();
  scene.nicknameInput = chars.join("");
  audioManager.playCursor();
  updateNicknameInputDisplay(scene);
}

export function handleNicknameDirectInput(scene: MenuSceneLike, event: KeyboardEvent) {
  if (!scene.nicknameInputActive) return;

  if (event.key === "Enter") {
    confirmNicknameInput(scene);
    return;
  }

  if (event.key === "Escape") {
    audioManager.playCancel();
    closeNicknameKeyboard(scene, false);
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    deleteNicknameChar(scene);
    return;
  }

  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Process") return;
  if (event.key.length !== 1) return;

  const nextValue = truncateKeyboardText(`${scene.nicknameInput || ""}${event.key}`, 12);
  if (nextValue === (scene.nicknameInput || "")) return;
  scene.nicknameInput = nextValue;
  audioManager.playCursor();
  updateNicknameInputDisplay(scene);
}

function bindNicknameInputElement(scene: MenuSceneLike): void {
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 12;
  input.value = scene.nicknameInput || "";
  input.setAttribute("aria-label", "ニックネーム入力");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "0";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";

  const syncValue = () => {
    const trimmed = truncateKeyboardText(input.value || "", 12);
    if (trimmed !== input.value) {
      input.value = trimmed;
    }
    if (scene.nicknameInput !== trimmed) {
      scene.nicknameInput = trimmed;
      updateNicknameInputDisplay(scene);
    }
  };

  const onInput = () => {
    syncValue();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmNicknameInput(scene);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      audioManager.playCancel();
      closeNicknameKeyboard(scene, false);
      return;
    }
  };

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  document.body.appendChild(input);
  input.focus();

  scene.nicknameInputCleanup = () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKeyDown);
    input.blur();
    input.remove();
  };
}

export function updateNicknameInputDisplay(scene: MenuSceneLike) {
  if (!scene.nicknameInputText) return;
  const chars = Array.from(scene.nicknameInput || "");
  const hasText = chars.length > 0;
  const display = hasText ? chars.join("") : "（元の名前）";
  scene.nicknameInputText.setText(display);
  scene.nicknameInputText.setColor(hasText ? "#e5e7eb" : "#94a3b8");
}

export function updateNicknameKeyboardDisplay(scene: MenuSceneLike) {
  void scene;
}

export function closeNicknameKeyboard(scene: MenuSceneLike, applyChanges: boolean) {
  const mon = scene.nicknameTargetMonster;
  const normalized = (scene.nicknameInput || "").trim().slice(0, 12);

  if (applyChanges && mon && mon.species) {
    mon.nickname = normalized.length > 0 ? normalized : null;
    audioManager.playConfirm();
    if (mon.nickname) {
      scene._showPartyMessage(`${mon.species.name}に「${mon.nickname}」というニックネームをつけた！`);
    } else {
      scene._showPartyMessage(`${mon.species.name}のニックネームを元に戻した！`);
    }
    scene._renderSubMenu();
  }

  if (scene.nicknameInputOverlay) {
    scene.nicknameInputOverlay.destroy(true);
    scene.nicknameInputOverlay = null;
  }
  if (scene.nicknameInputCleanup) {
    scene.nicknameInputCleanup();
    scene.nicknameInputCleanup = null;
  }
  scene.nicknameInputActive = false;
  scene.nicknameTargetMonster = null;
  scene.nicknameInput = "";
  scene.nicknameInputText = null;
}
