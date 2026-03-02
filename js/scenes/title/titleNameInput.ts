import { audioManager } from "../../audio/AudioManager.ts";
import { FONT, drawPanel, drawSelection } from "../../ui/UIHelper.ts";
import { formatKeyboardText, truncateKeyboardText } from "../../ui/gameKeyboard.ts";

type TitleSceneLike = Phaser.Scene & Record<string, any>;

export function showNameSelect(scene: TitleSceneLike): void {
  const { width, height } = scene.scale;

  if (scene._nameInputCleanup) {
    scene._nameInputCleanup();
    scene._nameInputCleanup = null;
  }

  if (scene.namePanel) scene.namePanel.destroy(true);
  scene.namePanel = scene.add.container(0, 0).setDepth(2100);

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72);
  scene.namePanel.add(overlay);

  const panelW = 452;
  const panelH = 220;
  const panelX = width / 2 - panelW / 2;
  const panelY = Math.max(20, height / 2 - panelH / 2);

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, panelH, { headerHeight: 32, glow: true });
  scene.namePanel.add(bg);

  const titleY = panelY + 14;
  scene.namePanel.add(scene.add.text(width / 2, titleY, "なまえを キーボードで にゅうりょくしてね！", {
    fontFamily: FONT.UI,
    fontSize: 15,
    color: "#fde68a",
  }).setOrigin(0.5, 0));

  const inputBg = scene.add.graphics();
  drawSelection(inputBg, width / 2 - 145, titleY + 42, 290, 44, { radius: 8 });
  scene.namePanel.add(inputBg);

  scene._nameInput = "";
  scene._nameInputText = scene.add.text(width / 2, titleY + 52, "", {
    fontFamily: FONT.UI,
    fontSize: 24,
    color: "#e5e7eb",
    align: "center",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(scene._nameInputText);

  const guide = scene.add.text(width / 2, titleY + 100, "直接入力: 最大8文字", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(guide);

  const controls = scene.add.text(width / 2, titleY + 122, "Enter: けってい  Backspace: 1文字削除", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(controls);

  const confirmHint = scene.add.text(width / 2, titleY + 144, "Esc: もどる", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5, 0);
  scene.namePanel.add(confirmHint);

  updateNameDisplay(scene);
  scene._nameActive = true;
  scene._bindNameSelectKeyboardHandlers();
  bindNameInputElement(scene);
}

export function updateNameDisplay(scene: TitleSceneLike): void {
  if (!scene._nameInputText) return;
  const hasText = Array.from(scene._nameInput || "").length > 0;
  const display = hasText ? formatNameForDisplay(scene._nameInput, 5) : "なまえ";
  scene._nameInputText.setText(display);
  scene._nameInputText.setFontSize(display.includes("\n") ? 18 : 24);
  scene._nameInputText.setColor(hasText ? "#e5e7eb" : "#94a3b8");
}

export function formatNameForDisplay(value: string, chunkSize: number): string {
  return formatKeyboardText(value, chunkSize);
}

export function confirmName(scene: TitleSceneLike): void {
  if (!scene._nameActive) return;
  const normalized = (scene._nameInput || "").trim();
  const name = normalized.length > 0 ? normalized : "ユウ";
  audioManager.playConfirm();
  scene._doStartNewGame(name);
}

export function handleNameKeyboardNavigation(scene: TitleSceneLike): void {
  void scene;
}

export function updateNameKeyboardDisplay(scene: TitleSceneLike): void {
  void scene;
}

export function deleteNameChar(scene: TitleSceneLike): void {
  if (!scene._nameActive) return;
  const chars = Array.from(scene._nameInput || "");
  if (chars.length === 0) return;
  chars.pop();
  scene._nameInput = chars.join("");
  audioManager.playCursor();
  updateNameDisplay(scene);
}

export function handleNameDirectInput(scene: TitleSceneLike, event: KeyboardEvent): void {
  if (!scene._nameActive) return;

  if (event.key === "Enter") {
    confirmName(scene);
    return;
  }

  if (event.key === "Escape") {
    audioManager.playCancel();
    closeNameSelect(scene);
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    deleteNameChar(scene);
    return;
  }

  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Process") return;
  if (event.key.length !== 1) return;

  const nextValue = truncateKeyboardText(`${scene._nameInput || ""}${event.key}`, 8);
  if (nextValue === (scene._nameInput || "")) return;
  scene._nameInput = nextValue;
  audioManager.playCursor();
  updateNameDisplay(scene);
}

function bindNameInputElement(scene: TitleSceneLike): void {
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 8;
  input.value = scene._nameInput || "";
  input.setAttribute("aria-label", "プレイヤー名入力");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "0";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";

  const syncValue = () => {
    const trimmed = truncateKeyboardText(input.value || "", 8);
    if (trimmed !== input.value) {
      input.value = trimmed;
    }
    if (scene._nameInput !== trimmed) {
      scene._nameInput = trimmed;
      updateNameDisplay(scene);
    }
  };

  const onInput = () => {
    syncValue();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmName(scene);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      audioManager.playCancel();
      closeNameSelect(scene);
      return;
    }
  };

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  document.body.appendChild(input);
  input.focus();

  scene._nameInputCleanup = () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKeyDown);
    input.blur();
    input.remove();
  };
}

export function truncateName(value: string, maxLength: number): string {
  return truncateKeyboardText(value, maxLength);
}

export function closeNameSelect(scene: TitleSceneLike): void {
  scene._nameActive = false;
  if (scene._nameInputCleanup) {
    scene._nameInputCleanup();
    scene._nameInputCleanup = null;
  }
  if (scene.namePanel) {
    scene.namePanel.destroy(true);
    scene.namePanel = null;
  }
  scene._bindDefaultKeyboardHandlers();
}
