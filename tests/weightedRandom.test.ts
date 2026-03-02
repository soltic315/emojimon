import { describe, expect, it } from "vitest";
import { pickByWeight } from "../js/data/weightedRandom.ts";

describe("pickByWeight", () => {
  it("重み比率に従って要素を返す", () => {
    const entries = [
      { id: "A", weight: 1 },
      { id: "B", weight: 3 },
      { id: "C", weight: 6 },
    ];

    expect(pickByWeight(entries, (entry) => entry.weight, 0)?.id).toBe("A");
    expect(pickByWeight(entries, (entry) => entry.weight, 0.15)?.id).toBe("B");
    expect(pickByWeight(entries, (entry) => entry.weight, 0.5)?.id).toBe("C");
  });

  it("重み合計が0以下なら先頭要素を返す", () => {
    const entries = [
      { id: "A", weight: 0 },
      { id: "B", weight: -5 },
    ];

    expect(pickByWeight(entries, (entry) => entry.weight)?.id).toBe("A");
  });

  it("空配列や不正乱数に対して安全に動作する", () => {
    const entries = [
      { id: "A", weight: 1 },
      { id: "B", weight: 1 },
    ];

    expect(pickByWeight([], () => 1)).toBeNull();
    expect(pickByWeight(entries, (entry) => entry.weight, Number.NaN)?.id).toBe("A");
    expect(pickByWeight(entries, (entry) => entry.weight, 1.5)?.id).toBe("B");
  });
});
