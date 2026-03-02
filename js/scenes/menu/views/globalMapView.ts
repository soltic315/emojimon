// グローバルマップ画面ビュー
import { gameState } from "../../../state/gameState.ts";
import { FONT, drawPanel, drawSelection } from "../../../ui/UIHelper.ts";
import { MAPS, DOOR_TRANSITIONS } from "../../world/worldMapData.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

/** マップ一覧から非表示にするキー */
const GLOBAL_MAP_HIDDEN_KEYS = new Set([
  "HOUSE1",
  "LAB",
  "TOWN_SHOP",
  "FOREST_GYM",
  "VOLCANO_SHOP",
  "FROZEN_GYM",
  "FROZEN_SHOP",
  "GARDEN_SHOP",
  "SWAMP_SHOP",
  "SAND_VALLEY_SHOP",
  "BASIN_SHOP",
]);

const GLOBAL_MAP_KEYS = Object.keys(MAPS).filter((mapKey) => !GLOBAL_MAP_HIDDEN_KEYS.has(mapKey));

function buildGlobalMapConnections() {
  const edges = [];
  const targetsBySource = {};
  const edgeKeys = new Set();
  GLOBAL_MAP_KEYS.forEach((source) => {
    const transitions = DOOR_TRANSITIONS[source] || [];
    const uniqueTargets = [];
    const uniqueTargetSet = new Set();

    transitions.forEach((transition) => {
      const target = transition.target;
      if (!GLOBAL_MAP_KEYS.includes(target)) return;

      if (!uniqueTargetSet.has(target)) {
        uniqueTargetSet.add(target);
        uniqueTargets.push(target);
      }

      const edgeKey = [source, target].sort().join("__");
      if (edgeKeys.has(edgeKey)) return;
      edgeKeys.add(edgeKey);
      edges.push({ source, target });
    });

    targetsBySource[source] = uniqueTargets;
  });
  return { edges, targetsBySource };
}

const GLOBAL_MAP_CONNECTIONS = buildGlobalMapConnections();

export function renderGlobalMapView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;
  const listAreaW = Math.min(250, Math.max(200, Math.floor(panelW * 0.35)));
  const mapAreaX = panelX + listAreaW + 18;
  const mapAreaY = panelY + 44;
  const mapAreaW = Math.max(220, panelW - listAreaW - 30);
  const mapAreaH = 240;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const title = scene.add.text(panelX + 16, panelY + 10, "🗺️ グローバルマップ", {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const mapKeys = GLOBAL_MAP_KEYS;
  const currentMapKey = gameState.currentMap || "EMOJI_TOWN";
  const fallbackOutdoorKey = (DOOR_TRANSITIONS[currentMapKey] || []).find((transition) => mapKeys.includes(transition.target))?.target;
  const effectiveCurrentMapKey = mapKeys.includes(currentMapKey)
    ? currentMapKey
    : (fallbackOutdoorKey || "EMOJI_TOWN");
  const visitedSet = new Set(Array.isArray(gameState.visitedMapIds) ? gameState.visitedMapIds : []);
  visitedSet.add(effectiveCurrentMapKey);
  const currentMapName = MAPS[effectiveCurrentMapKey]?.name || "???";
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, Math.max(0, mapKeys.length - 1));
  const selectedMapKey = mapKeys[scene.subMenuIndex] || effectiveCurrentMapKey;

  const nodeLayout = {
    EMOJI_TOWN: { x: 0.08, y: 0.56 },
    FOREST: { x: 0.2, y: 0.56 },
    MISTY_SWAMP: { x: 0.33, y: 0.44 },
    CORAL_REEF: { x: 0.47, y: 0.44 },
    CRYSTAL_CAVE: { x: 0.33, y: 0.64 },
    DARK_TOWER: { x: 0.46, y: 0.76 },
    SHADOW_GROVE: { x: 0.58, y: 0.76 },
    VOLCANIC_PASS: { x: 0.47, y: 0.64 },
    SAND_VALLEY: { x: 0.62, y: 0.64 },
    FROZEN_PEAK: { x: 0.76, y: 0.64 },
    ANCIENT_LIBRARY: { x: 0.86, y: 0.52 },
    SKY_RUINS: { x: 0.94, y: 0.4 },
    CELESTIAL_GARDEN: { x: 0.94, y: 0.68 },
    STARFALL_BASIN: { x: 0.98, y: 0.82 },
  };

  const nodeCenters = {};
  mapKeys.forEach((mapKey, index) => {
    const fixed = nodeLayout[mapKey];
    const fallbackCol = index % 4;
    const fallbackRow = Math.floor(index / 4);
    const fx = 0.08 + fallbackCol * 0.24;
    const fy = 0.2 + fallbackRow * 0.2;
    const nx = fixed ? fixed.x : fx;
    const ny = fixed ? fixed.y : Math.min(0.92, fy);
    nodeCenters[mapKey] = {
      x: mapAreaX + Math.round(mapAreaW * nx),
      y: mapAreaY + Math.round(mapAreaH * ny),
    };
  });

  const currentLine = scene.add.text(panelX + listAreaW + 24, panelY + 12, `現在地: ${currentMapName}`, {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#cbd5e1",
  });
  scene.subPanel.add(currentLine);

  const listTop = panelY + 44;
  const rowH = 30;
  const listHeight = mapAreaH;
  const visibleCount = Math.max(1, Math.floor(listHeight / rowH));
  const scrollStart = Math.max(0, Math.min(scene.subMenuIndex - Math.floor(visibleCount / 2), mapKeys.length - visibleCount));

  const mapBg = scene.add.graphics();
  mapBg.fillStyle(0x0f172a, 0.52);
  mapBg.fillRoundedRect(mapAreaX, mapAreaY, mapAreaW, mapAreaH, 10);
  mapBg.lineStyle(1, 0x334155, 0.85);
  mapBg.strokeRoundedRect(mapAreaX, mapAreaY, mapAreaW, mapAreaH, 10);
  scene.subPanel.add(mapBg);

  const mapLegend = scene.add.text(mapAreaX + 10, mapAreaY + 8, "ワールド接続図", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#93c5fd",
  });
  scene.subPanel.add(mapLegend);

  GLOBAL_MAP_CONNECTIONS.edges.forEach(({ source, target }) => {
      if (!nodeCenters[source] || !nodeCenters[target]) return;
      const from = nodeCenters[source];
      const to = nodeCenters[target];
      const isFocused = source === selectedMapKey || target === selectedMapKey;

      const edge = scene.add.graphics();
      edge.lineStyle(isFocused ? 2 : 1, isFocused ? 0x93c5fd : 0x475569, isFocused ? 0.95 : 0.7);
      edge.beginPath();
      edge.moveTo(from.x, from.y);
      edge.lineTo(to.x, to.y);
      edge.strokePath();
      scene.subPanel.add(edge);
  });

  mapKeys.forEach((mapKey) => {
    const center = nodeCenters[mapKey];
    const isCurrent = mapKey === effectiveCurrentMapKey;
    const isSelected = mapKey === selectedMapKey;
    const isVisited = visitedSet.has(mapKey);

    const nodeColor = isCurrent ? 0xfacc15 : (isVisited ? 0x94a3b8 : 0x475569);
    const node = scene.add.circle(center.x, center.y, isSelected ? 7 : 5, nodeColor, 0.95);
    scene.subPanel.add(node);

    if (isSelected) {
      const ring = scene.add.circle(center.x, center.y, 11, 0x000000, 0).setStrokeStyle(2, 0xfbbf24, 0.95);
      scene.subPanel.add(ring);
    }

    const mapLabel = isVisited ? (MAPS[mapKey]?.name || mapKey) : "？？？";
    const label = scene.add.text(center.x + 8, center.y - 8, mapLabel, {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: isCurrent ? "#fde68a" : (isSelected ? "#fbbf24" : (isVisited ? "#cbd5e1" : "#64748b")),
    });
    scene.subPanel.add(label);

    if (isCurrent) {
      const pin = scene.add.text(center.x - 4, center.y - 20, "📍", {
        fontFamily: FONT.UI,
        fontSize: 11,
      });
      scene.subPanel.add(pin);
    }
  });

  for (let vi = 0; vi < visibleCount; vi++) {
    const index = scrollStart + vi;
    if (index >= mapKeys.length) break;
    const mapKey = mapKeys[index];
    const selected = index === scene.subMenuIndex;
    const isCurrent = mapKey === effectiveCurrentMapKey;
    const isVisited = visitedSet.has(mapKey);
    const y = listTop + vi * rowH;

    if (selected) {
      const selBg = scene.add.graphics();
      drawSelection(selBg, panelX + 12, y - 4, listAreaW - 18, 26, { radius: 6 });
      scene.subPanel.add(selBg);
    }

    const prefix = isCurrent ? "📍" : "  ";
    const mapName = isVisited ? (MAPS[mapKey]?.name || mapKey) : "？？？";
    const rowText = scene.add.text(panelX + 24, y, `${selected ? "▶" : " "} ${prefix} ${mapName}`, {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: selected ? "#fbbf24" : (isCurrent ? "#93c5fd" : (isVisited ? "#e5e7eb" : "#64748b")),
    });
    scene.subPanel.add(rowText);
  }

  const divider = scene.add.graphics();
  divider.fillStyle(0x334155, 0.65);
  divider.fillRoundedRect(panelX + 12, panelY + 286, panelW - 24, 2, 1);
  scene.subPanel.add(divider);

  const selectedVisited = visitedSet.has(selectedMapKey);
  const selectedName = selectedVisited ? (MAPS[selectedMapKey]?.name || selectedMapKey) : "？？？";
  const connectionTitle = scene.add.text(panelX + 20, panelY + 300, `接続先: ${selectedName}`, {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#93c5fd",
  });
  scene.subPanel.add(connectionTitle);

  const targets = (GLOBAL_MAP_CONNECTIONS.targetsBySource[selectedMapKey] || [])
    .map((targetKey) => {
      const targetVisited = visitedSet.has(targetKey);
      return targetVisited ? (MAPS[targetKey]?.name || targetKey) : "？？？";
    });

  const connectionLines = targets.length > 0
    ? targets.map((name) => `・${name}`)
    : ["・接続先なし"];
  const connectionBody = scene.add.text(panelX + 24, panelY + 326, connectionLines.join("\n"), {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#cbd5e1",
    lineSpacing: 6,
  });
  scene.subPanel.add(connectionBody);

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:エリア選択  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}
