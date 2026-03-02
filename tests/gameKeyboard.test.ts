import { describe, expect, it } from "vitest";
import {
  applyKeyboardInput,
  getNextKeyboardIndex,
  sanitizeKeyboardText,
  truncateKeyboardText,
} from "../js/ui/gameKeyboard.ts";

describe("gameKeyboard text sanitize", () => {
  it("制御文字を除去する", () => {
    expect(sanitizeKeyboardText("A\u0000B\nC\tD")).toBe("ABCD");
  });

  it("禁止文字(<, >, \\)を除去する", () => {
    expect(sanitizeKeyboardText("<na>\\me")).toBe("name");
  });

  it("truncateKeyboardTextは最大文字数で切り詰める", () => {
    expect(truncateKeyboardText("あいうえお", 3)).toBe("あいう");
  });

  it("おわる選択時はsubmitted=trueになる", () => {
    const result = applyKeyboardInput("テスト", "おわる", 8);
    expect(result.value).toBe("テスト");
    expect(result.submitted).toBe(true);
  });

  it("けす/ぜんけしを適用できる", () => {
    expect(applyKeyboardInput("あいう", "けす", 8).value).toBe("あい");
    expect(applyKeyboardInput("あいう", "ぜんけし", 8).value).toBe("");
  });

  it("キーボードカーソルは上下左右で循環移動する", () => {
    expect(getNextKeyboardIndex(0, 10, 5, { left: true, right: false, up: false, down: false })).toBe(9);
    expect(getNextKeyboardIndex(9, 10, 5, { left: false, right: true, up: false, down: false })).toBe(0);
    expect(getNextKeyboardIndex(1, 10, 5, { left: false, right: false, up: true, down: false })).toBe(6);
    expect(getNextKeyboardIndex(8, 10, 5, { left: false, right: false, up: false, down: true })).toBe(3);
  });
});
