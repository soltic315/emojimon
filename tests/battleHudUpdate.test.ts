import { describe, expect, it } from "vitest";
import { truncateLabel } from "../js/scenes/battle/battleHudUpdate.ts";

describe("truncateLabel", () => {
  it("数値0を空文字にせず保持する", () => {
    expect(truncateLabel(0, 4)).toBe("0");
  });

  it("最大文字数を超える場合は省略記号を付ける", () => {
    expect(truncateLabel("ABCDEFGHIJ", 5)).toBe("ABCD…");
  });
});
