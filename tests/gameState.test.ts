import { beforeEach, describe, expect, it } from "vitest";
import { gameState } from "../js/state/gameState.ts";

describe("gameState map weather", () => {
  beforeEach(() => {
    gameState.reset();
  });

  it("マップ天候は未設定時のみ生成して以後は再利用する", () => {
    let factoryCallCount = 0;

    const first = gameState.ensureMapWeather("FOREST", () => {
      factoryCallCount += 1;
      return "RAINY";
    });
    const second = gameState.ensureMapWeather("FOREST", () => {
      factoryCallCount += 1;
      return "SUNNY";
    });

    expect(first).toBe("RAINY");
    expect(second).toBe("RAINY");
    expect(factoryCallCount).toBe(1);
  });

  it("戦闘データにマップ天候を自動で引き継ぐ", () => {
    gameState.currentMap = "FOREST";
    gameState.setMapWeather("FOREST", "WINDY");

    gameState.setBattle({
      player: { species: { id: "A" }, currentHp: 10 },
      opponent: { species: { id: "B" }, currentHp: 10 },
    });

    expect(gameState.activeBattle?.weather).toBe("WINDY");
  });
});
