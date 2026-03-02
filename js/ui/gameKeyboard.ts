export const GAME_KEYBOARD_COLS = 7;

export const GAME_KEYBOARD_KEYS = [
  "あ", "い", "う", "え", "お", "か", "き",
  "く", "け", "こ", "さ", "し", "す", "せ",
  "そ", "た", "ち", "つ", "て", "と", "な",
  "に", "ぬ", "ね", "の", "は", "ひ", "ふ",
  "へ", "ほ", "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ", "ら", "り", "る", "れ",
  "ろ", "わ", "を", "ん", "けす", "ぜんけし", "おわる",
];

export type KeyboardMoveInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type KeyboardInputResult = {
  value: string;
  submitted: boolean;
};

export function truncateKeyboardText(value: string, maxLength: number): string {
  return Array.from(value || "").slice(0, maxLength).join("");
}

export function formatKeyboardText(value: string, chunkSize: number): string {
  const chars = Array.from(value || "");
  if (chars.length <= chunkSize) return chars.join("");

  const lines = [];
  for (let i = 0; i < chars.length; i += chunkSize) {
    lines.push(chars.slice(i, i + chunkSize).join(""));
  }
  return lines.join("\n");
}

export function getNextKeyboardIndex(currentIndex: number, keyCount: number, cols: number, move: KeyboardMoveInput): number {
  if (keyCount <= 0) return 0;
  if (move.left) return (currentIndex - 1 + keyCount) % keyCount;
  if (move.right) return (currentIndex + 1) % keyCount;
  if (move.up) return (currentIndex - cols + keyCount) % keyCount;
  if (move.down) return (currentIndex + cols) % keyCount;
  return currentIndex;
}

export function applyKeyboardInput(currentValue: string, keyLabel: string, maxLength: number): KeyboardInputResult {
  if (keyLabel === "おわる") {
    return { value: currentValue || "", submitted: true };
  }

  if (keyLabel === "けす") {
    const chars = Array.from(currentValue || "");
    chars.pop();
    return { value: chars.join(""), submitted: false };
  }

  if (keyLabel === "ぜんけし") {
    return { value: "", submitted: false };
  }

  return {
    value: truncateKeyboardText(`${currentValue || ""}${keyLabel || ""}`, maxLength),
    submitted: false,
  };
}
