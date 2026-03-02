import { describe, expect, it } from "vitest";
import { resolveAreaBgmKey } from "../js/audio/areaBgm.ts";

describe("resolveAreaBgmKey", () => {
  it("現行マップキーを正しいBGM種別へ解決する", () => {
    expect(resolveAreaBgmKey("FOREST")).toBe("forest");
    expect(resolveAreaBgmKey("CRYSTAL_CAVE")).toBe("cave");
    expect(resolveAreaBgmKey("VOLCANIC_PASS")).toBe("volcano");
    expect(resolveAreaBgmKey("FROZEN_PEAK")).toBe("ice");
    expect(resolveAreaBgmKey("CELESTIAL_GARDEN")).toBe("ruins");
    expect(resolveAreaBgmKey("EMOJI_TOWN")).toBe("field");
  });

  it("旧キー体系も後方互換で解決する", () => {
    expect(resolveAreaBgmKey("EMOJI_FOREST")).toBe("forest");
    expect(resolveAreaBgmKey("MAGMA_PASS")).toBe("volcano");
    expect(resolveAreaBgmKey("RUINS")).toBe("ruins");
    expect(resolveAreaBgmKey("GARDEN")).toBe("ruins");
  });
});
