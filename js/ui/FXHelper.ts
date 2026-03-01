/**
 * FXHelper - Phaser 3.60+ の PostFX パイプラインを活用したビジュアルエフェクトユーティリティ
 * Bloom、Glow、ビネット、カラーマトリクスなどのポストプロセスを簡単に適用する
 */

/**
 * カメラにシネマティックなビネット効果を追加する（画面端を暗くする）
 */
export function addCameraVignette(camera: Phaser.Cameras.Scene2D.Camera, opts: {
  radius?: number;
  strength?: number;
} = {}) {
  const { radius = 0.5, strength = 0.24 } = opts;
  try {
    camera.postFX.addVignette(0.5, 0.5, radius, strength);
  } catch { /* WebGL未対応環境では無視 */ }
}

/**
 * カメラに Bloom エフェクトを追加する（光の拡散効果）
 */
export function addCameraBloom(camera: Phaser.Cameras.Scene2D.Camera, opts: {
  color?: number;
  offsetX?: number;
  offsetY?: number;
  blurStrength?: number;
  strength?: number;
  steps?: number;
} = {}) {
  const {
    color = 0xffffff,
    offsetX = 1,
    offsetY = 1,
    blurStrength = 1,
    strength = 1.5,
    steps = 4,
  } = opts;
  try {
    return camera.postFX.addBloom(color, offsetX, offsetY, blurStrength, strength, steps);
  } catch { /* WebGL未対応環境では無視 */ }
  return null;
}

/**
 * ゲームオブジェクトに Glow エフェクトを追加する
 */
export function addGlow(
  gameObject: Phaser.GameObjects.GameObject & { postFX?: Phaser.GameObjects.Components.FX },
  opts: {
    color?: number;
    outerStrength?: number;
    innerStrength?: number;
    knockout?: boolean;
  } = {},
) {
  const { color = 0xfbbf24, outerStrength = 4, innerStrength = 0, knockout = false } = opts;
  try {
    if (gameObject.postFX) {
      return gameObject.postFX.addGlow(color, outerStrength, innerStrength, knockout);
    }
  } catch { /* 無視 */ }
  return null;
}

/**
 * ゲームオブジェクトに Shine エフェクト（光の走査効果）を追加する
 */
export function addShine(
  gameObject: Phaser.GameObjects.GameObject & { postFX?: Phaser.GameObjects.Components.FX },
  opts: {
    speed?: number;
    lineWidth?: number;
    gradient?: number;
  } = {},
) {
  const { speed = 0.5, lineWidth = 0.5, gradient = 3 } = opts;
  try {
    if (gameObject.postFX) {
      return gameObject.postFX.addShine(speed, lineWidth, gradient);
    }
  } catch { /* 無視 */ }
  return null;
}

/**
 * ダメージ時のカメラフラッシュ演出（赤みがかったフラッシュ）
 */
export function flashDamage(camera: Phaser.Cameras.Scene2D.Camera, opts: {
  duration?: number;
  intensity?: number;
} = {}) {
  const { duration = 150, intensity = 0.3 } = opts;
  try {
    // 赤いフラッシュ
    camera.flash(duration, 255, 50, 50, false, (_cam: unknown, progress: number) => {
      if (progress >= 1) return;
    });
    // カメラシェイク
    camera.shake(duration * 1.5, intensity * 0.01);
  } catch { /* 無視 */ }
}

/**
 * 強化された攻撃HITカメラ演出
 * スーパーエフェクティブ時などに使う
 */
export function flashSuperHit(camera: Phaser.Cameras.Scene2D.Camera) {
  try {
    camera.flash(200, 255, 200, 50, false);
    camera.shake(300, 0.02);
  } catch { /* 無視 */ }
}

/**
 * レベルアップ時の画面演出
 */
export function flashLevelUp(camera: Phaser.Cameras.Scene2D.Camera) {
  try {
    camera.flash(300, 255, 255, 200, false);
  } catch { /* 無視 */ }
}

/**
 * 勝利時の画面演出（ゴールドフラッシュ）
 */
export function flashVictory(camera: Phaser.Cameras.Scene2D.Camera) {
  try {
    camera.flash(500, 255, 220, 100, false);
  } catch { /* 無視 */ }
}

/**
 * パーティクルバースト - 指定位置からパーティクルを放射状に放出する
 * Phaser ParticleEmitter を使った高品質エフェクト
 */
export function createParticleBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: {
    textureKey?: string;
    count?: number;
    speed?: number;
    lifespan?: number;
    scale?: { start: number; end: number };
    tint?: number | number[];
    gravityY?: number;
    blendMode?: number;
  } = {},
) {
  const {
    textureKey = "particle-white",
    count = 12,
    speed = 200,
    lifespan = 600,
    scale = { start: 1.5, end: 0 },
    tint,
    gravityY = 100,
    blendMode = Phaser.BlendModes.ADD,
  } = opts;

  try {
    const emitter = scene.add.particles(x, y, textureKey, {
      speed: { min: speed * 0.5, max: speed },
      angle: { min: 0, max: 360 },
      scale: { start: scale.start, end: scale.end },
      lifespan,
      gravityY,
      blendMode,
      tint: tint,
      emitting: false,
    });

    emitter.explode(count);

    // 自動破棄
    scene.time.delayedCall(lifespan + 200, () => {
      emitter.destroy();
    });

    return emitter;
  } catch {
    return null;
  }
}

/**
 * タイプ別ヒットエフェクト: タイプに応じた色とパーティクルでヒット演出
 */
export function createTypeHitEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  moveType: string,
  isSuper = false,
) {
  const typeConfig: Record<string, { texture: string; tint: number }> = {
    FIRE: { texture: "particle-fire", tint: 0xf97316 },
    WATER: { texture: "particle-water", tint: 0x3b82f6 },
    GRASS: { texture: "particle-grass", tint: 0x22c55e },
    ELECTRIC: { texture: "particle-electric", tint: 0xeab308 },
    ICE: { texture: "particle-ice", tint: 0x06b6d4 },
    NORMAL: { texture: "particle-hit", tint: 0xffffff },
  };

  const config = typeConfig[moveType] || typeConfig.NORMAL;
  const count = isSuper ? 20 : 10;
  const speed = isSuper ? 300 : 180;

  createParticleBurst(scene, x, y, {
    textureKey: config.texture,
    count,
    speed,
    lifespan: isSuper ? 800 : 500,
    scale: { start: isSuper ? 2.0 : 1.2, end: 0 },
    tint: config.tint,
    gravityY: 80,
  });

  // スーパーエフェクティブ時は追加スターパーティクル
  if (isSuper) {
    createParticleBurst(scene, x, y, {
      textureKey: "particle-star",
      count: 8,
      speed: 150,
      lifespan: 900,
      scale: { start: 1.8, end: 0 },
      tint: 0xfde68a,
      gravityY: -30,
    });
  }
}

/**
 * 継続的な環境パーティクル（天候など）
 */
export function createWeatherParticles(
  scene: Phaser.Scene,
  weather: string,
): Phaser.GameObjects.Particles.ParticleEmitter | null {
  const { width, height } = scene.scale;

  try {
    if (weather === "RAINY") {
      return scene.add.particles(0, -20, "particle-water", {
        x: { min: 0, max: width },
        y: -10,
        speedY: { min: 300, max: 500 },
        speedX: { min: -50, max: -30 },
        scale: { start: 0.5, end: 0.1 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 800, max: 1200 },
        frequency: 30,
        quantity: 3,
        blendMode: Phaser.BlendModes.ADD,
      });
    }

    if (weather === "SUNNY") {
      return scene.add.particles(width / 2, height / 4, "particle-star", {
        x: { min: -width / 2, max: width / 2 },
        y: { min: -height / 4, max: height / 4 },
        speedY: { min: 5, max: 15 },
        speedX: { min: -5, max: 5 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.25, end: 0 },
        lifespan: { min: 2000, max: 4000 },
        frequency: 200,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xfbbf24,
      });
    }

    if (weather === "WINDY") {
      return scene.add.particles(0, height / 2, "particle-grass", {
        x: -20,
        y: { min: -height / 2, max: height / 2 },
        speedX: { min: 100, max: 250 },
        speedY: { min: -30, max: 30 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.45, end: 0 },
        lifespan: { min: 1500, max: 3000 },
        frequency: 120,
        quantity: 2,
        blendMode: Phaser.BlendModes.ADD,
        rotate: { min: 0, max: 360 },
        tint: 0x4ade80,
      });
    }
  } catch { /* 無視 */ }

  return null;
}
