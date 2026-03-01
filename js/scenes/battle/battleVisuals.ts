import { gameState } from "../../state/gameState.ts";
import { WEATHER, getBattleBackgroundTheme, rollWeatherForMap } from "../../data/mapRules.ts";
import { FONT } from "../../ui/UIHelper.ts";
import { WEATHER_INFO } from "./battleConstants.ts";

/** 背景の環境演出を生成 */
export function createBattleAtmosphere(scene: any, width: number, height: number) {
  const theme = getBattleBackgroundTheme(gameState.currentMap);

  const tintMap: Record<string, number> = {
    FOREST: 0x4ade80,
    CAVE: 0xa78bfa,
    VOLCANO: 0xfb923c,
    RUINS: 0x93c5fd,
    TOWN: 0x60a5fa,
  };
  const tint = tintMap[theme] || 0x93c5fd;

  const edgeGlow = scene.add.graphics();
  edgeGlow.fillStyle(tint, 0.05);
  edgeGlow.fillEllipse(width * 0.2, height * 0.16, 240, 160);
  edgeGlow.fillEllipse(width * 0.82, height * 0.22, 220, 140);
  edgeGlow.setBlendMode(Phaser.BlendModes.ADD);

  for (let i = 0; i < 10; i++) {
    const orb = scene.add.circle(
      60 + i * (width / 10),
      50 + (i % 4) * 22,
      8 + (i % 3) * 4,
      tint,
      0.06,
    ).setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: orb,
      alpha: 0.14,
      y: orb.y + 16,
      duration: 1800 + (i % 5) * 260,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }
}

/** 天候初期化：マップ単位の天候を取得（未設定時のみ決定して保持） */
export function rollInitialWeather(scene: any) {
  if (scene.battle?.weather) {
    return scene.battle.weather;
  }

  const existingMapWeather = gameState.getMapWeather(gameState.currentMap);
  if (existingMapWeather) {
    return existingMapWeather;
  }

  const rolledWeather = rollWeatherForMap(gameState.currentMap);
  gameState.setMapWeather(gameState.currentMap, rolledWeather);
  return rolledWeather;
}

/** 天候表示UIを生成 */
export function createWeatherDisplay(scene: any) {
  const { width, height } = scene.scale;
  const wInfo = WEATHER_INFO[scene.weather] || WEATHER_INFO.NONE;
  if (scene.weather === WEATHER.NONE) {
    scene.weatherText = null;
    destroyWeatherParticles(scene);
    return;
  }
  scene.weatherText = scene.add.text(width / 2, 102, `${wInfo.emoji} ${wInfo.label}`, {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: "#f8fafc",
    backgroundColor: "#0b1222",
    padding: { x: 10, y: 4 },
  }).setOrigin(0.5);
  scene.weatherText.setStroke("#000000", 2);
  scene.weatherText.setShadow(0, 1, wInfo.color, 6, true, true);

  scene.tweens.add({
    targets: scene.weatherText,
    alpha: 0.5,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  createWeatherParticles(scene, width, height);
}

/** 天候パーティクルを生成 */
export function createWeatherParticles(scene: any, width: number, height: number) {
  destroyWeatherParticles(scene);
  scene._weatherParticles = [];

  const battleFieldHeight = scene.panelY || (height - 156);

  if (scene.weather === WEATHER.RAINY) {
    const rainGfx = scene.add.graphics();
    const drops = [];
    const dropCount = 40;
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * battleFieldHeight,
        speed: 3 + Math.random() * 4,
        length: 6 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
    rainGfx.setDepth(5);
    const rainTimer = scene.time.addEvent({
      delay: 33,
      loop: true,
      callback: () => {
        rainGfx.clear();
        for (const drop of drops) {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.3;
          if (drop.y > battleFieldHeight) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 100);
          }
          if (drop.x < -20) {
            drop.x = width + 10;
          }
          rainGfx.lineStyle(1.5, 0x88bbff, drop.alpha);
          rainGfx.lineBetween(drop.x, drop.y, drop.x - drop.speed * 0.3, drop.y + drop.length);
        }
      },
    });

    const rainOverlay = scene.add.rectangle(width / 2, battleFieldHeight / 2, width, battleFieldHeight, 0x2244aa, 0.06);
    rainOverlay.setDepth(4);
    scene._weatherParticles.push(rainGfx, rainOverlay, { destroy: () => rainTimer.destroy() });

  } else if (scene.weather === WEATHER.SUNNY) {
    const sunGfx = scene.add.graphics();
    sunGfx.setDepth(4);
    sunGfx.setAlpha(0.08);
    for (let i = 0; i < 5; i++) {
      const sx = width * 0.15 + i * width * 0.18;
      sunGfx.lineStyle(20 + i * 8, 0xfbbf24, 0.12);
      sunGfx.lineBetween(sx, 0, sx - 60, battleFieldHeight);
    }
    const sunOverlay = scene.add.rectangle(width / 2, battleFieldHeight / 2, width, battleFieldHeight, 0xffa500, 0.04);
    sunOverlay.setDepth(4);
    scene.tweens.add({
      targets: sunGfx,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    scene._weatherParticles.push(sunGfx, sunOverlay);

  } else if (scene.weather === WEATHER.WINDY) {
    const windGfx = scene.add.graphics();
    windGfx.setDepth(5);
    const leaves = [];
    const leafCount = 12;
    for (let i = 0; i < leafCount; i++) {
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * battleFieldHeight,
        speedX: 4 + Math.random() * 3,
        speedY: -0.5 + Math.random() * 1,
        size: 2 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.3,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    const windTimer = scene.time.addEvent({
      delay: 33,
      loop: true,
      callback: () => {
        windGfx.clear();
        for (const leaf of leaves) {
          leaf.x += leaf.speedX;
          leaf.y += leaf.speedY + Math.sin(leaf.wobble) * 0.8;
          leaf.wobble += 0.1;
          if (leaf.x > width + 20) {
            leaf.x = -10;
            leaf.y = Math.random() * battleFieldHeight;
          }
          windGfx.fillStyle(0x6dbd6d, leaf.alpha);
          windGfx.fillEllipse(leaf.x, leaf.y, leaf.size * 2, leaf.size);
        }
        windGfx.lineStyle(1, 0xcccccc, 0.08);
        for (let i = 0; i < 3; i++) {
          const wy = 30 + i * 60;
          const phase = (Date.now() * 0.002 + i) % (width + 200) - 100;
          windGfx.lineBetween(phase, wy, phase + 80, wy - 2);
        }
      },
    });
    scene._weatherParticles.push(windGfx, { destroy: () => windTimer.destroy() });

  } else if (scene.weather === WEATHER.SNOWY) {
    const snowGfx = scene.add.graphics();
    snowGfx.setDepth(5);
    const flakes = [];
    const flakeCount = 30;
    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * battleFieldHeight,
        speed: 1 + Math.random() * 2,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.4,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    const snowTimer = scene.time.addEvent({
      delay: 33,
      loop: true,
      callback: () => {
        snowGfx.clear();
        for (const flake of flakes) {
          flake.y += flake.speed;
          flake.x += Math.sin(flake.wobble) * 0.6;
          flake.wobble += 0.04;
          if (flake.y > battleFieldHeight) {
            flake.y = -flake.size;
            flake.x = Math.random() * width;
          }
          snowGfx.fillStyle(0xffffff, flake.alpha);
          snowGfx.fillCircle(flake.x, flake.y, flake.size);
        }
      },
    });

    const snowOverlay = scene.add.rectangle(width / 2, battleFieldHeight / 2, width, battleFieldHeight, 0x93c5fd, 0.05);
    snowOverlay.setDepth(4);
    scene._weatherParticles.push(snowGfx, snowOverlay, { destroy: () => snowTimer.destroy() });
  }
}

/** 天候パーティクルを破棄 */
export function destroyWeatherParticles(scene: any) {
  if (scene._weatherParticles) {
    for (const obj of scene._weatherParticles) {
      if (obj && obj.destroy) obj.destroy();
    }
  }
  scene._weatherParticles = [];
}

/** 天候UIを更新 */
export function updateWeatherDisplay(scene: any) {
  if (scene.weatherText) scene.weatherText.destroy();
  createWeatherDisplay(scene);
}

/** ターン経過で天候が変化するか判定 */
export function tickWeather(scene: any) {
  scene.weatherTurnCounter++;
  if (scene.weather !== WEATHER.NONE && scene.weatherTurnCounter >= scene.weatherDuration) {
    const oldWeather = WEATHER_INFO[scene.weather];
    scene.weather = WEATHER.NONE;
    scene.weatherTurnCounter = 0;
    gameState.setMapWeather(gameState.currentMap, scene.weather);
    updateWeatherDisplay(scene);
    scene.enqueueMessage(`${oldWeather.emoji} ${oldWeather.label}が おさまった！`);
  } else if (scene.weather === WEATHER.NONE && Math.random() < 0.08) {
    const candidates = [WEATHER.SUNNY, WEATHER.RAINY, WEATHER.WINDY, WEATHER.SNOWY];
    scene.weather = candidates[Math.floor(Math.random() * candidates.length)];
    scene.weatherTurnCounter = 0;
    scene.weatherDuration = 3 + Math.floor(Math.random() * 3);
    gameState.setMapWeather(gameState.currentMap, scene.weather);
    const newWeather = WEATHER_INFO[scene.weather];
    updateWeatherDisplay(scene);
    scene.enqueueMessage(`${newWeather.emoji} てんきが ${newWeather.label}に かわった！`);
  }
}

/** 呼吸アニメーション開始（入場演出完了後に呼ぶ） */
export function startBreathingAnimations(scene: any) {
  scene.tweens.add({
    targets: scene.playerEmojiText,
    y: scene.playerEmojiText.y - 4,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
  scene.tweens.add({
    targets: scene.opponentEmojiText,
    y: scene.opponentEmojiText.y + 4,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
}

/** 環境に応じたバトル背景を描画 */
export function drawBattleBackground(scene: any, width: number, height: number) {
  const theme = getBattleBackgroundTheme(gameState.currentMap);
  const g = scene.add.graphics();

  if (theme === "CAVE") {
    g.fillGradientStyle(0x060711, 0x0d1022, 0x191133, 0x0d1022, 1);
    g.fillRect(0, 0, width, height);

    for (let i = 0; i < 42; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.65;
      const alpha = 0.08 + Math.random() * 0.24;
      const size = 1 + Math.random() * 2.6;
      g.fillStyle(i % 2 === 0 ? 0xc4b5fd : 0x93c5fd, alpha);
      g.fillCircle(x, y, size);
    }

    g.fillStyle(0x191a2d, 0.68);
    for (let i = 0; i < 10; i++) {
      const x = i * (width / 8) + Math.random() * 40;
      const w = 10 + Math.random() * 20;
      const h = 20 + Math.random() * 50;
      g.fillTriangle(x, 0, x - w / 2, h, x + w / 2, h);
    }

    g.fillStyle(0x7c3aed, 0.06);
    g.fillEllipse(width * 0.72, height * 0.24, 220, 120);
  } else if (theme === "VOLCANO") {
    g.fillGradientStyle(0x260e0d, 0x3a130f, 0x150807, 0x210906, 1);
    g.fillRect(0, 0, width, height);

    for (let i = 0; i < 46; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.75;
      const alpha = 0.08 + Math.random() * 0.3;
      const size = 1 + Math.random() * 2.6;
      g.fillStyle(i % 3 === 0 ? 0xf97316 : 0xfb923c, alpha);
      g.fillCircle(x, y, size);
    }

    g.fillStyle(0x111827, 0.55);
    for (let i = 0; i < 6; i++) {
      const baseX = i * (width / 6);
      const peak = 30 + Math.random() * 50;
      g.fillTriangle(baseX, height * 0.72, baseX + 45, height * 0.72, baseX + 22, height * 0.72 - peak);
    }

    g.fillStyle(0xfb923c, 0.08);
    g.fillEllipse(width * 0.3, height * 0.2, 260, 120);
  } else if (theme === "RUINS") {
    g.fillGradientStyle(0x0f172a, 0x1e40af, 0x312e81, 0x0f172a, 1);
    g.fillRect(0, 0, width, height);

    g.fillStyle(0xe2e8f0, 0.11);
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * 140 + (Math.random() - 0.5) * 30;
      const h = 60 + Math.random() * 40;
      g.fillRect(x, height * 0.72 - h, 14, h);
    }

    for (let i = 0; i < 34; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.5;
      const alpha = 0.06 + Math.random() * 0.2;
      g.fillStyle(0xe0f2fe, alpha);
      g.fillCircle(x, y, 1.2);
    }

    g.fillStyle(0x93c5fd, 0.07);
    g.fillEllipse(width * 0.55, height * 0.18, 280, 110);
  } else if (theme === "FOREST") {
    g.fillGradientStyle(0x052916, 0x0a3d1f, 0x0b2d18, 0x062412, 1);
    g.fillRect(0, 0, width, height);

    g.fillStyle(0x14532d, 0.55);
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 180 + (Math.random() - 0.5) * 60;
      const y = height * 0.15 + Math.random() * 30;
      g.fillTriangle(x, y, x - 40, y + 80, x + 40, y + 80);
      g.fillTriangle(x, y - 30, x - 30, y + 50, x + 30, y + 50);
    }

    g.fillStyle(0x4ade80, 0.06);
    g.fillCircle(width * 0.7, 30, 200);

    for (let i = 0; i < 20; i++) {
      g.fillStyle(0x86efac, 0.05 + Math.random() * 0.06);
      g.fillCircle(Math.random() * width, Math.random() * (height * 0.6), 1 + Math.random() * 1.5);
    }
  } else {
    g.fillGradientStyle(0x0f172a, 0x1e293b, 0x030712, 0x0f172a, 1);
    g.fillRect(0, 0, width, height);

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.5;
      const alpha = 0.08 + Math.random() * 0.35;
      g.fillStyle(i % 3 === 0 ? 0xf8fafc : 0xbfdbfe, alpha);
      g.fillCircle(x, y, 1);
    }

    g.fillStyle(0x93c5fd, 0.05);
    g.fillEllipse(width * 0.78, 44, 260, 120);
  }

  g.lineStyle(1, 0x64748b, 0.45);
  g.lineBetween(0, height * 0.72, width, height * 0.72);

  const horizonGlow = scene.add.graphics();
  horizonGlow.fillStyle(0xf8fafc, 0.06);
  horizonGlow.fillEllipse(width / 2, height * 0.66, width * 0.85, 120);
  horizonGlow.setBlendMode(Phaser.BlendModes.ADD);
}
