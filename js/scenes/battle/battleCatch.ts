// バトル捕獲ロジック
import { gameState } from "../../state/gameState.ts";
import { calcStats, syncMonsterMoves } from "../../data/monsters.ts";
import { getItemById } from "../../data/items.ts";
import { MOVES } from "../../data/moves.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { BattleState, PARTY_MAX } from "./battleConstants.ts";
import { gsap } from "gsap";

/** インベントリにボールがあるかチェック */
export function hasBallsInInventory(): boolean {
  return gameState.inventory.some((it) => {
    if (it.quantity <= 0) return false;
    const def = getItemById(it.itemId);
    if (!def) return false;
    return (def.catchBonus && def.catchBonus > 0) || def.id === "EMO_BALL";
  });
}

/** 最良のボールを取得 */
export function getBestBall() {
  let best = null;
  let bestBonus = -1;
  for (const it of gameState.inventory) {
    if (it.quantity <= 0) continue;
    const def = getItemById(it.itemId);
    if (!def) continue;
    const bonus = def.catchBonus || (def.id === "EMO_BALL" ? 1 : 0);
    if (bonus > 0 && bonus > bestBonus) {
      best = { entry: it, bonus, name: def.name, emoji: def.emoji };
      bestBonus = bonus;
    }
  }
  return best;
}

/** ボールを消費 */
export function consumeBall(ball) {
  if (!ball || !ball.entry) return;
  ball.entry.quantity = Math.max(0, ball.entry.quantity - 1);
  if (ball.entry.quantity <= 0) {
    gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
  }
}

/** 捕獲試行 */
export function attemptCatch(scene, selectedBall = null) {
  const ball = selectedBall || getBestBall();
  if (!ball) {
    scene.enqueueMessage("ボールがない！");
    return;
  }
  consumeBall(ball);

  const opponent = scene.battle.opponent;
  const baseRate = opponent.species.catchRate || 0.4;
  const hpRatio = opponent.currentHp / (calcStats(opponent.species, opponent.level).maxHp || 1);
  let modifier = 0.8;
  if (hpRatio < 0.25) modifier = 1.6;
  else if (hpRatio < 0.5) modifier = 1.2;
  const encounterBonus = opponent.catchRateMultiplier || 1;
  // インフィニティボール（catchBonus >= 100）は確定捕獲
  const isMasterBall = ball.bonus >= 100;
  const finalRate = isMasterBall ? 1.0 : Math.min(0.96, baseRate * modifier * ball.bonus * encounterBonus);
  const success = Math.random() < finalRate;

  scene.clearMenuTexts();
  scene.setBattleState(BattleState.ANIMATING);

  // ボール投げアニメーション
  playCatchAnimation(scene, ball, success, opponent);
}

/** 捕獲ボール演出アニメーション */
function playCatchAnimation(scene, ball, success, opponent) {
  const { width } = scene.scale;

  const ballEmoji = ball.emoji || "⚪";
  const startX = width * 0.25;
  const startY = scene.playerEmojiText.y;
  const targetX = scene.opponentEmojiText.x;
  const targetY = scene.opponentEmojiText.y;

  const ballText = scene.add.text(startX, startY, ballEmoji, {
    fontFamily: "system-ui, emoji",
    fontSize: 28,
  }).setOrigin(0.5).setDepth(20);

  gsap.to(ballText, {
    x: targetX,
    y: targetY - 20,
    duration: 0.5,
    ease: "power1.out",
    onUpdate: () => {
      const progress = (ballText.x - startX) / (targetX - startX);
      const arc = -Math.sin(progress * Math.PI) * 80;
      ballText.y = startY + (targetY - 20 - startY) * progress + arc;
    },
    onComplete: () => {
      scene.cameras.main.flash(150, 255, 255, 255);
      audioManager.playHit();

      gsap.to(scene.opponentEmojiText, {
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          const shakeCount = success ? 3 : Math.floor(Math.random() * 2) + 1;
          shakeAndResolveCatch(scene, ballText, shakeCount, success, opponent);
        },
      });
    },
  });

  scene.enqueueMessage(`${ball.name}を なげた！`);
}

/** ボールの揺れ & 捕獲結果 */
function shakeAndResolveCatch(scene, ballText, shakes, success, opponent) {
  let shakesDone = 0;

  const doShake = () => {
    if (shakesDone >= shakes) {
      if (success) {
        completeCatchSuccess(scene, ballText, opponent);
      } else {
        completeCatchFailure(scene, ballText, opponent);
      }
      return;
    }

    shakesDone++;

    gsap.to(ballText, {
      rotation: 0.3,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
      onComplete: () => {
        ballText.rotation = 0;
        scene.time.delayedCall(400, () => {
          scene.enqueueMessage("…カチ");
          doShake();
        });
      },
    });
  };

  scene.time.delayedCall(300, doShake);
}

/** 捕獲成功処理 */
function completeCatchSuccess(scene, ballText, opponent) {
  audioManager.playCatchSuccess();
  scene.resultType = "catch";
  scene.setBattleState(BattleState.RESULT);

  const sparkles = ["✨", "⭐", "🌟"];
  for (let i = 0; i < 5; i++) {
    const spark = scene.add.text(
      ballText.x + (Math.random() - 0.5) * 60,
      ballText.y + (Math.random() - 0.5) * 40,
      sparkles[Math.floor(Math.random() * sparkles.length)],
      { fontFamily: "system-ui, emoji", fontSize: 16 + Math.random() * 12 }
    ).setOrigin(0.5).setDepth(21);

    gsap.to(spark, {
      y: spark.y - 30 - Math.random() * 20,
      alpha: 0,
      duration: 0.8 + Math.random() * 0.4,
      ease: "power2.out",
      onComplete: () => spark.destroy(),
    });
  }

  scene.time.delayedCall(500, () => {
    ballText.destroy();
  });

  scene.enqueueMessage(`カチッ…！ ${opponent.species.name} を つかまえた！ 🎊`);

  const newMon = {
    species: opponent.species,
    abilityId: opponent.abilityId || opponent.species.abilityId,
    level: opponent.level,
    exp: 0,
    nextLevelExp: 10 + 8 * opponent.level,
    currentHp: calcStats(opponent.species, opponent.level).maxHp,
    attackStage: 0,
    defenseStage: 0,
    moveIds: [],
    pp: (opponent.species.learnset || []).map(m => MOVES[m]?.pp || 10),
  };
  syncMonsterMoves(newMon);

  if (gameState.party.length >= PARTY_MAX) {
    if (!gameState.box) gameState.box = [];
    gameState.box.push(newMon);
    scene.enqueueMessage(`パーティが いっぱいなので ボックスに おくった！`);
  } else {
    gameState.party.push(newMon);
  }
  gameState.markCaught(opponent.species.id);
  gameState.totalCatches++;

  const dailyCatchProgress = gameState.updateDailyChallengeProgress("CATCH", 1);
  if (dailyCatchProgress.completedNow) {
    const rewardResult = gameState.claimDailyChallengeReward();
    if (rewardResult.success) {
      scene.enqueueMessage("🎯 本日のチャレンジ達成！");
      scene.enqueueMessage(`ボーナスで ${rewardResult.rewardMoney}G を てにいれた！`);
    }
  }

  if (scene.isWildBattle) {
    scene.registerWildStreakWin();
  }

  scene._grantHeldItemDrops(opponent);

  // 初回捕獲チュートリアル
  if (!gameState.storyFlags.tutorialCatchDone && gameState.totalCatches === 1) {
    scene.enqueueMessage("📖 【はじめての捕獲！】おめでとう！ 仲間が増えたね！");
    scene.enqueueMessage("📖 Xキーでメニューを開いて パーティの確認ができるよ。");
    scene.enqueueMessage("📖 いろんなタイプの仲間を集めると 冒険が楽になるよ！");
  }
}

/** 捕獲失敗処理 */
function completeCatchFailure(scene, ballText, opponent) {
  audioManager.playCatchFail();

  gsap.to(ballText, {
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0,
    duration: 0.3,
    ease: "power2.out",
    onComplete: () => ballText.destroy(),
  });

  gsap.killTweensOf(scene.opponentEmojiText);
  const opponentSizeScale = Number.isFinite(opponent?.species?.sizeScale)
    ? Math.max(0.4, opponent.species.sizeScale)
    : 1;
  scene.opponentEmojiText.setScale(opponentSizeScale).setAlpha(1);
  gsap.fromTo(scene.opponentEmojiText, {
    scaleX: opponentSizeScale * 0.85,
    scaleY: opponentSizeScale * 0.85,
    alpha: 1,
  }, {
    scaleX: opponentSizeScale,
    scaleY: opponentSizeScale,
    alpha: 1,
    duration: 0.4,
    ease: "back.out",
  });

  scene.enqueueMessage("ボールから でてきてしまった…");
  scene.startOpponentTurn();
}
