// バトル演出・アニメーションエフェクト
import { audioManager } from "../../audio/AudioManager.ts";
import { FONT } from "../../ui/UIHelper.ts";
import {
  createParticleBurst,
  createTypeHitEffect,
  flashLevelUp,
} from "../../ui/FXHelper.ts";
import { setMonsterEmoji } from "../../ui/UIHelper.ts";
import { BattleState } from "./battleConstants.ts";
import { gsap } from "gsap";

/** 攻撃アニメーション（突進 → ヒット → 戻り） */
export function playAttackAnimation(scene, attacker, target, move, onComplete) {
  scene.setBattleState(BattleState.ANIMATING);

  const isPlayer = attacker === scene.battle.player;
  const emojiText = isPlayer ? scene.playerEmojiText : scene.opponentEmojiText;
  const targetEmoji = isPlayer ? scene.opponentEmojiText : scene.playerEmojiText;

  const origX = emojiText.x;
  const origY = emojiText.y;
  const dx = isPlayer ? 60 : -60;

  gsap.killTweensOf(emojiText);
  gsap.killTweensOf(targetEmoji);

  gsap.timeline({
    onComplete: () => {
      scene.time.delayedCall(220, onComplete);
    },
  })
    .to(emojiText, {
      x: origX + dx,
      duration: 0.12,
      ease: "power2.out",
    })
    .add(() => {
      audioManager.playHit();
      scene.cameras.main.shake(200, 0.012);
      spawnHitParticles(scene, targetEmoji.x, targetEmoji.y, move.type);
      gsap.fromTo(
        targetEmoji,
        { alpha: 1, scale: 1 },
        {
          alpha: 0.2,
          scale: 0.86,
          duration: 0.08,
          yoyo: true,
          repeat: 2,
          ease: "power1.inOut",
          onComplete: () => {
            targetEmoji.alpha = 1;
            targetEmoji.scale = 1;
          },
        }
      );
    })
    .to(emojiText, {
      x: origX,
      y: origY,
      duration: 0.14,
      ease: "power2.in",
    });
}

/** ヒットパーティクル生成 */
export function spawnHitParticles(scene, x, y, moveType) {
  createTypeHitEffect(scene, x, y, moveType, false);
}

/** ダメージ数値のフローティング表示 */
export function showFloatingDamage(scene, x, y, damage, isSuper = false, isCritical = false) {
  const color = isSuper ? "#f97316" : isCritical ? "#fbbf24" : "#ffffff";
  const fontSize = isSuper ? 28 : isCritical ? 26 : 22;
  const prefix = isCritical && !isSuper ? "💥" : "";
  const text = scene.add.text(x, y, `${prefix}-${damage}`, {
    fontFamily: FONT.UI,
    fontSize,
    color,
    stroke: "#000000",
    strokeThickness: 4,
    shadow: { offsetX: 1, offsetY: 1, color: "#00000080", blur: 4, fill: true },
  }).setOrigin(0.5).setScale(0.6).setAlpha(0).setDepth(50);

  const offsetX = (Math.random() - 0.5) * 30;

  gsap.timeline({ onComplete: () => text.destroy() })
    .to(text, {
      alpha: 1,
      scale: isSuper ? 1.2 : 1,
      duration: 0.12,
      ease: "back.out(2)",
    })
    .to(text, {
      x: x + offsetX,
      y: y - 60,
      alpha: 0,
      scale: isSuper ? 1.3 : 1.08,
      duration: 0.85,
      ease: "power2.out",
    });
}

/** 回復数値のフローティング表示 */
export function showFloatingHeal(scene, x, y, amount) {
  const text = scene.add.text(x, y, `+${amount}`, {
    fontFamily: FONT.UI,
    fontSize: 22,
    color: "#4ade80",
    stroke: "#000000",
    strokeThickness: 3,
    shadow: { offsetX: 1, offsetY: 1, color: "#00000080", blur: 4, fill: true },
  }).setOrigin(0.5).setScale(0.6).setAlpha(0).setDepth(50);

  gsap.timeline({ onComplete: () => text.destroy() })
    .to(text, {
      alpha: 1,
      scale: 1,
      duration: 0.15,
      ease: "back.out(1.5)",
    })
    .to(text, {
      y: y - 50,
      alpha: 0,
      duration: 0.8,
      ease: "power2.out",
    });
}

/** 倒れたモンスターの消滅エフェクト */
export function playDefeatEffect(scene, emojiText) {
  if (!emojiText) return;
  createParticleBurst(scene, emojiText.x, emojiText.y, {
    textureKey: "particle-white",
    count: 16,
    speed: 150,
    lifespan: 700,
    scale: { start: 1.5, end: 0 },
    gravityY: 60,
  });
  scene.tweens.add({
    targets: emojiText,
    y: emojiText.y + 40,
    alpha: 0,
    scaleX: 0.3,
    scaleY: 0.3,
    duration: 800,
    ease: "power2.in",
  });
}

/** レベルアップのキラキラエフェクト */
export function playLevelUpEffect(scene, emojiText) {
  if (!emojiText) return;
  const x = emojiText.x;
  const y = emojiText.y;

  createParticleBurst(scene, x, y, {
    textureKey: "particle-star",
    count: 20,
    speed: 200,
    lifespan: 1000,
    scale: { start: 1.5, end: 0 },
    tint: 0xfde68a,
    gravityY: -40,
  });

  createParticleBurst(scene, x, y, {
    textureKey: "particle-white",
    count: 10,
    speed: 120,
    lifespan: 600,
    scale: { start: 2.0, end: 0 },
    gravityY: 0,
  });

  flashLevelUp(scene.cameras.main);
}

/** 進化の演出 — 光のバーストと絵文字チェンジ */
export function playEvolutionEffect(scene, emojiText, newEmoji, newSubEmojis = null, targetScale = 1) {
  if (!emojiText) return;
  const x = emojiText.x;
  const y = emojiText.y;

  const colors = [0xf97316, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xec4899];
  colors.forEach((tint, i) => {
    scene.time.delayedCall(i * 80, () => {
      createParticleBurst(scene, x, y, {
        textureKey: "particle-star",
        count: 6,
        speed: 160 + i * 20,
        lifespan: 800,
        scale: { start: 1.2, end: 0 },
        tint,
        gravityY: -20,
      });
    });
  });

  scene.cameras.main.flash(600, 255, 255, 255, true);
  scene.tweens.add({
    targets: emojiText,
    scaleX: 1.6,
    scaleY: 1.6,
    duration: 400,
    yoyo: true,
    ease: "sine.inOut",
    onYoyo: () => {
      setMonsterEmoji(emojiText, newEmoji, newSubEmojis);
    },
    onComplete: () => {
      emojiText.setScale(Number.isFinite(targetScale) ? Math.max(0.4, targetScale) : 1);
      scene.updateHud(false);
    },
  });
}
