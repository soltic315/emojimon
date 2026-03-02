import { describe, expect, it } from "vitest";
import { applyCanvasBrightness, drawExpBar, drawHpBar, drawPanel } from "../js/ui/UIHelper.ts";

function createGraphicsMock() {
  const calls: string[] = [];
  const g: Record<string, any> = {
    fillStyle: () => {
      calls.push("fillStyle");
      return g;
    },
    fillRoundedRect: () => {
      calls.push("fillRoundedRect");
      return g;
    },
    lineStyle: () => {
      calls.push("lineStyle");
      return g;
    },
    lineBetween: () => {
      calls.push("lineBetween");
      return g;
    },
    strokeRoundedRect: () => {
      calls.push("strokeRoundedRect");
      return g;
    },
    fillRect: () => {
      calls.push("fillRect");
      return g;
    },
  };
  return { g: g as any, calls };
}

describe("UIHelper", () => {
  it("applyCanvasBrightnessは範囲外入力をクランプする", () => {
    const canvas = { style: { filter: "" } };
    applyCanvasBrightness({ game: { canvas } } as any, 200);
    expect(canvas.style.filter).toBe("brightness(140%)");

    applyCanvasBrightness({ game: { canvas } } as any, 10);
    expect(canvas.style.filter).toBe("brightness(60%)");
  });

  it("drawPanelは必要な描画メソッドを呼び出す", () => {
    const { g, calls } = createGraphicsMock();
    drawPanel(g, 0, 0, 100, 80, { headerHeight: 20, glow: true });

    expect(calls.includes("fillRoundedRect")).toBe(true);
    expect(calls.includes("strokeRoundedRect")).toBe(true);
  });

  it("drawHpBarとdrawExpBarは例外なく描画できる", () => {
    const hp = createGraphicsMock();
    const exp = createGraphicsMock();

    drawHpBar(hp.g, 0, 0, 120, 12, 0.5);
    drawExpBar(exp.g, 0, 0, 120, 8, 0.6);

    expect(hp.calls.length).toBeGreaterThan(0);
    expect(exp.calls.length).toBeGreaterThan(0);
  });
});
