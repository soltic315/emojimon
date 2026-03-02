import { describe, expect, it } from "vitest";

import {
  GLOBAL_MAP_KEYS,
  buildGlobalMapConnections,
  buildGlobalMapLayout,
} from "../js/scenes/menu/views/globalMapView.ts";

describe("globalMapView layout", () => {
  it("表示対象マップが2次元配置に全て含まれる", () => {
    const layout = buildGlobalMapLayout(GLOBAL_MAP_KEYS);
    const positionedKeys = Object.keys(layout.positions);

    expect(positionedKeys.length).toBe(GLOBAL_MAP_KEYS.length);
    GLOBAL_MAP_KEYS.forEach((mapKey) => {
      expect(layout.positions[mapKey]).toBeTruthy();
    });
  });

  it("接続線は隣接セルで結べる組み合わせを含む", () => {
    const layout = buildGlobalMapLayout(GLOBAL_MAP_KEYS);
    const connections = buildGlobalMapConnections(GLOBAL_MAP_KEYS);

    connections.undirectedEdges.forEach(([source, target]) => {
      const sourcePos = layout.positions[source];
      const targetPos = layout.positions[target];
      expect(sourcePos).toBeTruthy();
      expect(targetPos).toBeTruthy();

      const manhattan = Math.abs(sourcePos.row - targetPos.row) + Math.abs(sourcePos.col - targetPos.col);
      expect(manhattan).toBe(1);
    });
  });

  it("主要ルートが隣接セルとして配置される", () => {
    const layout = buildGlobalMapLayout(GLOBAL_MAP_KEYS);

    const assertNeighbor = (fromMapKey, toMapKey) => {
      const fromPosition = layout.positions[fromMapKey];
      const toPosition = layout.positions[toMapKey];
      expect(fromPosition).toBeTruthy();
      expect(toPosition).toBeTruthy();
      const manhattan = Math.abs(fromPosition.row - toPosition.row) + Math.abs(fromPosition.col - toPosition.col);
      expect(manhattan).toBe(1);
    };

    assertNeighbor("EMOJI_TOWN", "FOREST");
    assertNeighbor("FOREST", "MISTY_SWAMP");
    assertNeighbor("MISTY_SWAMP", "CRYSTAL_CAVE");
    assertNeighbor("CRYSTAL_CAVE", "VOLCANIC_PASS");
    assertNeighbor("VOLCANIC_PASS", "SAND_VALLEY");
    assertNeighbor("SAND_VALLEY", "FROZEN_PEAK");
    assertNeighbor("FROZEN_PEAK", "ANCIENT_LIBRARY");
    assertNeighbor("ANCIENT_LIBRARY", "SKY_RUINS");
    assertNeighbor("SKY_RUINS", "CELESTIAL_GARDEN");
    assertNeighbor("CELESTIAL_GARDEN", "STARFALL_BASIN");
  });
});
