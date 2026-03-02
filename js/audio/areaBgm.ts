import { AREA_THEME, getAreaTheme } from "../data/mapRules.ts";

export type AreaBgmKey = "title" | "field" | "battle" | "forest" | "cave" | "dark" | "volcano" | "ice" | "ruins";

/**
 * マップキーからエリアBGMキーを解決する。
 * 旧キー体系との互換も維持する。
 */
export function resolveAreaBgmKey(mapKey: string): AreaBgmKey {
  const key = typeof mapKey === "string" ? mapKey : "";

  switch (key) {
    case "EMOJI_FOREST":
      return "forest";
    case "CAVE":
      return "cave";
    case "MAGMA_PASS":
      return "volcano";
    case "RUINS":
    case "GARDEN":
      return "ruins";
    case "DARK_TOWER_INNER":
      return "dark";
  }

  const areaTheme = getAreaTheme(key);
  if (areaTheme === AREA_THEME.FOREST) return "forest";
  if (areaTheme === AREA_THEME.CAVE) return "cave";
  if (areaTheme === AREA_THEME.VOLCANO) return "volcano";
  if (areaTheme === AREA_THEME.ICE) return "ice";
  if (areaTheme === AREA_THEME.RUINS) return "ruins";
  return "field";
}
