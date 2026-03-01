import { describe, expect, it } from "vitest";
import {
  MAP_KEYS,
  WEATHER,
  getBattleBackgroundTheme,
  normalizeMapKey,
  rollWeatherForMapByHour,
  rollWeatherForMap,
} from "../js/data/mapRules.ts";

describe("mapRules helpers", () => {
  it("mapKey未指定時はEMOJI_TOWNに正規化される", () => {
    expect(normalizeMapKey(undefined)).toBe(MAP_KEYS.EMOJI_TOWN);
    expect(normalizeMapKey("")).toBe(MAP_KEYS.EMOJI_TOWN);
  });

  it("マップごとのバトル背景テーマを返す", () => {
    expect(getBattleBackgroundTheme(MAP_KEYS.CRYSTAL_CAVE)).toBe("CAVE");
    expect(getBattleBackgroundTheme(MAP_KEYS.FOREST)).toBe("FOREST");
    expect(getBattleBackgroundTheme("UNKNOWN")).toBe("TOWN");
  });

  it("天候ロールが閾値テーブルに従う", () => {
    expect(rollWeatherForMap(MAP_KEYS.SKY_RUINS, 0.2)).toBe(WEATHER.WINDY);
    expect(rollWeatherForMap(MAP_KEYS.SKY_RUINS, 0.6)).toBe(WEATHER.SUNNY);
    expect(rollWeatherForMap(MAP_KEYS.SKY_RUINS, 0.8)).toBe(WEATHER.RAINY);
    expect(rollWeatherForMap(MAP_KEYS.SKY_RUINS, 0.95)).toBe(WEATHER.NONE);
  });

  it("未知マップはDEFAULTテーブルで天候を決定する", () => {
    expect(rollWeatherForMap("UNKNOWN", 0.1)).toBe(WEATHER.SUNNY);
    expect(rollWeatherForMap("UNKNOWN", 0.3)).toBe(WEATHER.RAINY);
    expect(rollWeatherForMap("UNKNOWN", 0.45)).toBe(WEATHER.WINDY);
    expect(rollWeatherForMap("UNKNOWN", 0.8)).toBe(WEATHER.NONE);
  });

  it("時間帯によって同じ乱数でも天候が変化する", () => {
    expect(rollWeatherForMapByHour("UNKNOWN", 8, 0.3)).toBe(WEATHER.SUNNY);
    expect(rollWeatherForMapByHour("UNKNOWN", 22, 0.3)).toBe(WEATHER.RAINY);
  });

  it("氷峰では夜間の方がSNOWYになりやすい", () => {
    expect(rollWeatherForMapByHour(MAP_KEYS.FROZEN_PEAK, 12, 0.46)).toBe(WEATHER.WINDY);
    expect(rollWeatherForMapByHour(MAP_KEYS.FROZEN_PEAK, 23, 0.46)).toBe(WEATHER.SNOWY);
  });
});
