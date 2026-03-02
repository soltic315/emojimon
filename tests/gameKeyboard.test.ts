import { describe, expect, it } from "vitest";
import { sanitizeKeyboardText, truncateKeyboardText } from "../js/ui/gameKeyboard.ts";

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
});
