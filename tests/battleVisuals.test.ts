import { describe, expect, it } from "vitest";
import { WEATHER } from "../js/data/mapRules.ts";
import { resolveWeatherTickTransition } from "../js/scenes/battle/battleVisuals.ts";

describe("resolveWeatherTickTransition", () => {
  it("継続ターン満了時は天候終了へ遷移する", () => {
    const result = resolveWeatherTickTransition({
      weather: WEATHER.RAINY,
      weatherTurnCounter: 2,
      weatherDuration: 3,
      randomValue: 0.99,
    });

    expect(result.changed).toBe(true);
    expect(result.weather).toBe(WEATHER.NONE);
    expect(result.messageKey).toBe("END");
    expect(result.endedWeather).toBe(WEATHER.RAINY);
  });

  it("無天候中の抽選成功で新天候を開始する", () => {
    const result = resolveWeatherTickTransition({
      weather: WEATHER.NONE,
      weatherTurnCounter: 0,
      weatherDuration: 3,
      randomValue: 0.01,
      firstRolledWeather: WEATHER.NONE,
      secondRolledWeather: WEATHER.SUNNY,
      rolledDuration: 5,
    });

    expect(result.changed).toBe(true);
    expect(result.weather).toBe(WEATHER.SUNNY);
    expect(result.weatherDuration).toBe(5);
    expect(result.messageKey).toBe("START");
  });

  it("抽選失敗時は天候を維持してターンのみ進む", () => {
    const result = resolveWeatherTickTransition({
      weather: WEATHER.NONE,
      weatherTurnCounter: 1,
      weatherDuration: 4,
      randomValue: 0.5,
    });

    expect(result.changed).toBe(false);
    expect(result.weather).toBe(WEATHER.NONE);
    expect(result.weatherTurnCounter).toBe(2);
  });
});
