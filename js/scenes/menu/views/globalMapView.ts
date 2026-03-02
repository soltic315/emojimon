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

export const GLOBAL_MAP_KEYS = Object.keys(MAPS).filter((mapKey) => !GLOBAL_MAP_HIDDEN_KEYS.has(mapKey));

const GLOBAL_MAP_GRID_TEMPLATE = [
  [null, null, "CELESTIAL_GARDEN", "STARFALL_BASIN", null],
  [null, null, "SKY_RUINS", "ANCIENT_LIBRARY", "FROZEN_PEAK"],
  ["SHADOW_GROVE", "DARK_TOWER", "CRYSTAL_CAVE", "VOLCANIC_PASS", "SAND_VALLEY"],
  ["EMOJI_TOWN", "FOREST", "MISTY_SWAMP", "CORAL_REEF", null],
];

function toPositionMap(grid) {
  const positions = {};
  grid.forEach((row, rowIndex) => {
    row.forEach((mapKey, colIndex) => {
      if (!mapKey) return;
      positions[mapKey] = { row: rowIndex, col: colIndex };
    });
  });
  return positions;
}

export function buildGlobalMapLayout(mapKeys = GLOBAL_MAP_KEYS) {
  const visibleKeySet = new Set(mapKeys);
  const grid = GLOBAL_MAP_GRID_TEMPLATE.map((row) =>
    row.map((mapKey) => ((mapKey && visibleKeySet.has(mapKey)) ? mapKey : null)),
  );

  const placedKeySet = new Set(Object.keys(toPositionMap(grid)));
  const unplacedKeys = mapKeys.filter((mapKey) => !placedKeySet.has(mapKey));

  if (unplacedKeys.length > 0) {
    const columnCount = Math.max(1, grid[0]?.length || 0);
    for (let offset = 0; offset < unplacedKeys.length; offset += columnCount) {
      const row = Array(columnCount).fill(null);
      const chunk = unplacedKeys.slice(offset, offset + columnCount);
      chunk.forEach((mapKey, index) => {
        row[index] = mapKey;
      });
      grid.push(row);
    }
  }

  const positions = toPositionMap(grid);
  return {
    grid,
    positions,
    rows: grid.length,
    cols: Math.max(1, ...grid.map((row) => row.length)),
  };
}

export function buildGlobalMapConnections(mapKeys = GLOBAL_MAP_KEYS) {
  const keySet = new Set(mapKeys);
  const targetsBySource = {};
  const undirectedEdges = [];
  const edgeSet = new Set();

  mapKeys.forEach((source) => {
    const transitions = DOOR_TRANSITIONS[source] || [];
    const uniqueTargets = [];
    const uniqueTargetSet = new Set();

    transitions.forEach((transition) => {
      const target = transition.target;
      if (!keySet.has(target)) return;

      if (!uniqueTargetSet.has(target)) {
        uniqueTargetSet.add(target);
        uniqueTargets.push(target);

        const edgeId = source < target ? `${source}::${target}` : `${target}::${source}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          undirectedEdges.push([source, target]);
        }
      }
    });

    targetsBySource[source] = uniqueTargets;
  });
  return { targetsBySource, undirectedEdges };
}

const GLOBAL_MAP_CONNECTIONS = buildGlobalMapConnections();
const GLOBAL_MAP_LAYOUT = buildGlobalMapLayout();

export function renderGlobalMapView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;
  const listAreaW = Math.min(320, Math.max(230, Math.floor(panelW * 0.32)));
  const mapAreaX = panelX + listAreaW + 18;
  const mapAreaY = panelY + 44;
  const mapAreaW = Math.max(260, panelW - listAreaW - 30);
  const mapAreaH = Math.max(220, height - 210);

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

  const mapLegend = scene.add.text(mapAreaX + 10, mapAreaY + 8, "ワールド格子マップ", {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#93c5fd",
  });
  scene.subPanel.add(mapLegend);

  const { grid, positions, rows, cols } = GLOBAL_MAP_LAYOUT;
  const gridGap = 8;
  const innerPaddingX = 14;
  const innerPaddingTop = 28;
  const innerPaddingBottom = 14;
  const cellW = Math.max(
    72,
    Math.floor((mapAreaW - innerPaddingX * 2 - (cols - 1) * gridGap) / cols),
  );
  const cellH = Math.max(
    44,
    Math.floor((mapAreaH - innerPaddingTop - innerPaddingBottom - (rows - 1) * gridGap) / rows),
  );

  const lineLayer = scene.add.graphics();
  lineLayer.lineStyle(2, 0x38bdf8, 0.45);
  GLOBAL_MAP_CONNECTIONS.undirectedEdges.forEach(([source, target]) => {
    const sourcePos = positions[source];
    const targetPos = positions[target];
    if (!sourcePos || !targetPos) return;

    const manhattan = Math.abs(sourcePos.row - targetPos.row) + Math.abs(sourcePos.col - targetPos.col);
    if (manhattan !== 1) return;

    const sourceCenterX = mapAreaX + innerPaddingX + sourcePos.col * (cellW + gridGap) + cellW / 2;
    const sourceCenterY = mapAreaY + innerPaddingTop + sourcePos.row * (cellH + gridGap) + cellH / 2;
    const targetCenterX = mapAreaX + innerPaddingX + targetPos.col * (cellW + gridGap) + cellW / 2;
    const targetCenterY = mapAreaY + innerPaddingTop + targetPos.row * (cellH + gridGap) + cellH / 2;
    lineLayer.lineBetween(sourceCenterX, sourceCenterY, targetCenterX, targetCenterY);
  });
  scene.subPanel.add(lineLayer);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const mapKey = grid[row]?.[col] || null;
      const x = mapAreaX + innerPaddingX + col * (cellW + gridGap);
      const y = mapAreaY + innerPaddingTop + row * (cellH + gridGap);

      if (!mapKey) {
        const emptyCell = scene.add.graphics();
        emptyCell.fillStyle(0x0b1220, 0.12);
        emptyCell.fillRoundedRect(x, y, cellW, cellH, 6);
        emptyCell.lineStyle(1, 0x334155, 0.25);
        emptyCell.strokeRoundedRect(x, y, cellW, cellH, 6);
        scene.subPanel.add(emptyCell);
        continue;
      }

      const isCurrent = mapKey === effectiveCurrentMapKey;
      const isSelected = mapKey === selectedMapKey;
      const isVisited = visitedSet.has(mapKey);

      const cell = scene.add.graphics();
      const fillColor = isCurrent ? 0x422006 : isVisited ? 0x0f172a : 0x111827;
      const fillAlpha = isSelected ? 0.85 : 0.65;
      const strokeColor = isSelected ? 0xfbbf24 : isCurrent ? 0xf59e0b : isVisited ? 0x475569 : 0x374151;
      const strokeWidth = isSelected ? 2 : 1;
      cell.fillStyle(fillColor, fillAlpha);
      cell.fillRoundedRect(x, y, cellW, cellH, 8);
      cell.lineStyle(strokeWidth, strokeColor, 0.95);
      cell.strokeRoundedRect(x, y, cellW, cellH, 8);
      scene.subPanel.add(cell);

      const mapName = isVisited ? (MAPS[mapKey]?.name || mapKey) : "？？？";
      const label = scene.add.text(
        x + 6,
        y + (cellH > 52 ? 10 : 7),
        `${isCurrent ? "📍 " : ""}${mapName}`,
        {
          fontFamily: FONT.UI,
          fontSize: cellH > 52 ? 10 : 9,
          color: isCurrent ? "#fde68a" : (isSelected ? "#fbbf24" : (isVisited ? "#e2e8f0" : "#6b7280")),
          wordWrap: { width: cellW - 12 },
        },
      );
      scene.subPanel.add(label);
    }
  }

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

  if (scrollStart > 0) {
    const upHint = scene.add.text(panelX + listAreaW - 12, listTop - 6, "▲", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#93c5fd",
    }).setOrigin(1, 0);
    scene.subPanel.add(upHint);
  }
  if (scrollStart + visibleCount < mapKeys.length) {
    const downHint = scene.add.text(panelX + listAreaW - 12, listTop + listHeight - 12, "▼", {
      fontFamily: FONT.UI,
      fontSize: 10,
      color: "#93c5fd",
    }).setOrigin(1, 0);
    scene.subPanel.add(downHint);
  }

  const divider = scene.add.graphics();
  divider.fillStyle(0x334155, 0.65);
  const connectionTop = mapAreaY + mapAreaH + 12;
  divider.fillRoundedRect(panelX + 12, connectionTop, panelW - 24, 2, 1);
  scene.subPanel.add(divider);

  const selectedVisited = visitedSet.has(selectedMapKey);
  const selectedName = selectedVisited ? (MAPS[selectedMapKey]?.name || selectedMapKey) : "？？？";
  const connectionTitle = scene.add.text(panelX + 20, connectionTop + 12, `接続先: ${selectedName}`, {
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
  const connectionBody = scene.add.text(panelX + 24, connectionTop + 38, connectionLines.join("\n"), {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#cbd5e1",
    lineSpacing: 6,
    wordWrap: { width: panelW - 48 },
  });
  scene.subPanel.add(connectionBody);

  const hint = scene.add.text(panelX + 16, height - 30, "↑↓:エリア選択  X:もどる", {
    fontFamily: FONT.UI,
    fontSize: 11,
    color: "#6b7280",
  });
  scene.subPanel.add(hint);
}
