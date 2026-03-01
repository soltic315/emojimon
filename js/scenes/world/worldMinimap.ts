import { gameState } from "../../state/gameState.ts";
import { FONT, drawPanel } from "../../ui/UIHelper.ts";
import { MAP_FACILITY_MARKERS } from "./worldMapData.ts";

/** ミニマップを描画 */
export function renderMinimap(scene: any) {
  const { width } = scene.scale;
  const mapW = scene.mapWidth;
  const mapH = scene.mapHeight;
  const scale = 3;
  const miniW = mapW * scale;
  const miniH = mapH * scale;
  const mx = width - miniW - 16;
  const my = 72;

  const g = scene.add.graphics().setScrollFactor(0);
  drawPanel(g, mx - 10, my - 24, miniW + 20, miniH + 36, {
    radius: 10,
    headerHeight: 16,
    bgAlpha: 0.9,
  });

  const label = scene.add.text(mx - 3, my - 21, "MINIMAP", {
    fontFamily: FONT.UI,
    fontSize: 10,
    color: "#bfdcff",
    fontStyle: "700",
  }).setScrollFactor(0);
  scene.uiContainer.add(label);

  const tileColors: Record<number, number> = {
    0: 0x243244,
    1: 0x5b6472,
    2: 0x1f7a46,
    3: 0xb45309,
    4: 0x166534,
    5: 0x2563eb,
    6: 0x7c3aed,
    7: 0x8b7f72,
  };

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const tile = scene.mapLayout[y][x];
      const color = tileColors[tile] ?? 0x1f2933;
      const adjustedColor = (tile === 0 && scene.mapKey === "HOUSE1") ? 0xd1d5db : color;
      g.fillStyle(adjustedColor, 0.94);
      g.fillRect(mx + x * scale, my + y * scale, scale - 0.5, scale - 0.5);
    }
  }

  const facilityMarkers = MAP_FACILITY_MARKERS[scene.mapKey] || [];
  facilityMarkers.forEach((facility: any) => {
    if (facility.x < 0 || facility.y < 0 || facility.x >= mapW || facility.y >= mapH) return;
    g.fillStyle(0xfacc15, 0.95);
    g.fillRect(mx + facility.x * scale, my + facility.y * scale, scale, scale);
  });

  scene.uiContainer.add(g);

  scene.minimapPlayerDot = scene.add.circle(
    mx + gameState.playerPosition.x * scale + scale / 2,
    my + gameState.playerPosition.y * scale + scale / 2,
    2.4,
    0xfacc15,
    1,
  ).setScrollFactor(0);
  scene.uiContainer.add(scene.minimapPlayerDot);

  scene.minimapPlayerRing = scene.add.circle(scene.minimapPlayerDot.x, scene.minimapPlayerDot.y, 4.5, 0xfacc15, 0)
    .setStrokeStyle(1, 0xfef08a, 0.9)
    .setScrollFactor(0);
  scene.uiContainer.add(scene.minimapPlayerRing);

  scene.tweens.add({
    targets: scene.minimapPlayerDot,
    alpha: 0.3,
    duration: 500,
    yoyo: true,
    repeat: -1,
  });
  scene.tweens.add({
    targets: scene.minimapPlayerRing,
    alpha: 0,
    scale: 1.55,
    duration: 900,
    repeat: -1,
    ease: "sine.out",
  });

  scene._minimapMx = mx;
  scene._minimapMy = my;
  scene._minimapScale = scale;
}

/** ミニマップのプレイヤー位置を更新 */
export function updateMinimapDot(scene: any) {
  if (!scene.minimapPlayerDot) return;
  const scale = scene._minimapScale || 3;
  scene.minimapPlayerDot.x = scene._minimapMx + gameState.playerPosition.x * scale + scale / 2;
  scene.minimapPlayerDot.y = scene._minimapMy + gameState.playerPosition.y * scale + scale / 2;
  if (scene.minimapPlayerRing) {
    scene.minimapPlayerRing.x = scene.minimapPlayerDot.x;
    scene.minimapPlayerRing.y = scene.minimapPlayerDot.y;
  }
}
