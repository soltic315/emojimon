export type AreaBgmKey = "title" | "field" | "battle" | "forest" | "cave" | "dark" | "volcano" | "ice" | "ruins";

/**
 * マップキーからエリアBGMキーを解決する。
 * 旧キー体系との互換も維持する。
 */
export function resolveAreaBgmKey(mapKey: string): AreaBgmKey {
  const key = typeof mapKey === "string" ? mapKey : "";

  switch (key) {
    case "FOREST":
    case "MISTY_SWAMP":
    case "CORAL_REEF":
    case "EMOJI_FOREST":
      return "forest";
    case "CRYSTAL_CAVE":
    case "DARK_TOWER":
    case "SHADOW_GROVE":
    case "CAVE":
      return "cave";
    case "VOLCANIC_PASS":
    case "VOLCANO_SHOP":
    case "MAGMA_PASS":
      return "volcano";
    case "FROZEN_PEAK":
    case "FROZEN_GYM":
    case "FROZEN_SHOP":
      return "ice";
    case "SKY_RUINS":
    case "CELESTIAL_GARDEN":
    case "ANCIENT_LIBRARY":
    case "STARFALL_BASIN":
    case "RUINS":
    case "GARDEN":
      return "ruins";
    case "DARK_TOWER_INNER":
      return "dark";
    default:
      return "field";
  }
}
