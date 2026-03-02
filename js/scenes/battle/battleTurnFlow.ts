// バトルターン進行ロジック
import { gameState } from "../../state/gameState.ts";
import {
  calcStats,
  getMonsterMoves,
  getMonsterMaxStamina,
  recoverMonsterStamina,
} from "../../data/monsters.ts";
import { getMoveStaminaCost } from "../../data/moves.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { setMonsterEmoji } from "../../ui/UIHelper.ts";
import {
  BattleState,
  StatusCondition,
  RUN_SUCCESS_RATE,
  RUN_RATE_MIN,
  RUN_RATE_MAX,
  STAMINA_RECOVERY_PER_TURN,
} from "./battleConstants.ts";
import {
  flashSuperHit,
  flashDamage,
  createTypeHitEffect,
} from "../../ui/FXHelper.ts";

/** 逃走試行 */
export function tryRun(scene) {
  if (!scene.isWildBattle) {
    scene.enqueueMessage("トレーナーせんでは にげられない！");
    return;
  }
  const player = scene.battle.player;
  const opponent = scene.battle.opponent;
  const playerSpeed = calcStats(player.species, player.level).speed;
  const opponentSpeed = calcStats(opponent.species, opponent.level).speed;
  const speedDiff = playerSpeed - opponentSpeed;
  const speedBonus = (speedDiff / 10) * 0.1;
  const runRate = Math.min(RUN_RATE_MAX, Math.max(RUN_RATE_MIN, RUN_SUCCESS_RATE + speedBonus));
  const success = Math.random() < runRate;
  if (success) {
    audioManager.playRunAway();
    scene.resultType = "run";
    scene.setBattleState(BattleState.RESULT);
    scene.enqueueMessage("うまく にげきれた！");
  } else {
    scene.enqueueMessage("にげられなかった！");
    scene.startOpponentTurn();
  }
}

/** 素早さに基づく行動順を決定する */
export function determineSpeedOrder(scene, playerMove) {
  const player = scene.getActivePlayer();
  const opponent = scene.battle.opponent;
  if (!player || !opponent) return "player";

  const playerPriority = (playerMove && playerMove.priority) || 0;
  const opponentMove = scene.chooseOpponentMove(opponent, player);
  scene._pendingOpponentMove = opponentMove;
  const opponentPriority = (opponentMove && opponentMove.priority) || 0;

  if (playerPriority !== opponentPriority) {
    return playerPriority > opponentPriority ? "player" : "opponent";
  }

  const playerStats = calcStats(player.species, player.level || 1);
  const opponentStats = calcStats(opponent.species, opponent.level || 1);
  let playerSpeed = playerStats.speed;
  let opponentSpeed = opponentStats.speed;

  if (player.statusCondition === StatusCondition.PARALYSIS) playerSpeed = Math.floor(playerSpeed * 0.5);
  if (opponent.statusCondition === StatusCondition.PARALYSIS) opponentSpeed = Math.floor(opponentSpeed * 0.5);

  const playerSpeedStage = player.speedStage || 0;
  const opponentSpeedStage = opponent.speedStage || 0;
  playerSpeed = Math.max(1, Math.floor(playerSpeed * Math.max(0.25, 1 + playerSpeedStage * 0.25)));
  opponentSpeed = Math.max(1, Math.floor(opponentSpeed * Math.max(0.25, 1 + opponentSpeedStage * 0.25)));

  if (playerSpeed === opponentSpeed) return Math.random() < 0.5 ? "player" : "opponent";
  return playerSpeed >= opponentSpeed ? "player" : "opponent";
}

/** プレイヤーの技発動 */
export function performPlayerMove(scene) {
  const player = scene.getActivePlayer();
  const opponent = scene.battle.opponent;
  if (!player || player.currentHp <= 0) {
    if (!scene.switchToNextAlive()) {
      scene.handleDefeat();
    } else {
      scene.showMainMenu(true);
    }
    return;
  }
  const move = getMonsterMoves(player)[scene.selectedMoveIndex];
  if (!move) return;

  scene.clearMenuTexts();

  const staminaCost = getMoveStaminaCost(move);
  const currentStamina = Number.isFinite(player.stamina)
    ? Math.floor(player.stamina)
    : getMonsterMaxStamina(player);
  if (currentStamina < staminaCost) {
    scene.enqueueMessage("スタミナが たりない…");
    return;
  }
  player.stamina = Math.max(0, currentStamina - staminaCost);

  const order = scene._determineSpeedOrder(move);

  if (order === "player") {
    scene._executePlayerAttack(player, opponent, move, () => {
      if (opponent.currentHp <= 0) {
        scene.handleVictory();
      } else {
        scene._executeOpponentTurnAfterPlayer();
      }
    });
  } else {
    scene._executeOpponentAttackDirect(opponent, player, scene._pendingOpponentMove, () => {
      if (player.currentHp <= 0) {
        if (!scene.switchToNextAlive()) {
          scene.handleDefeat();
        } else {
          scene.startPlayerTurn();
        }
      } else {
        scene._executePlayerAttack(player, opponent, move, () => {
          if (opponent.currentHp <= 0) {
            scene.handleVictory();
          } else {
            scene.startPlayerTurn();
          }
        });
      }
    });
  }
}

/** プレイヤーの攻撃を実行する */
export function executePlayerAttack(scene, player, opponent, move, onComplete) {
  player.lastMoveType = move?.type || null;

  if (!scene.isMoveHit(move, player)) {
    scene.enqueueMessage(`${player.species.name}の ${move.name}！ しかし はずれた！`);
    if (onComplete) scene.time.delayedCall(100, onComplete);
    return;
  }

  if (move.category === "status") {
    scene.handleStatusMove(player, opponent, move, true);
    if (onComplete) scene.time.delayedCall(100, onComplete);
    return;
  }

  scene.playAttackAnimation(player, opponent, move, () => {
    const result = scene.calculateDamage(player, opponent, move);
    const damage = result.damage;
    opponent.currentHp = Math.max(0, opponent.currentHp - damage);

    const reaction = scene._applyElementReaction(player, opponent, move, damage);
    if (reaction.extraDamage > 0) {
      opponent.currentHp = Math.max(0, opponent.currentHp - reaction.extraDamage);
    }

    const effectiveness = result.effectiveness;
    const isSuper = effectiveness >= 1.5;

    if (isSuper) {
      audioManager.playSuperEffective();
      flashSuperHit(scene.cameras.main);
      createTypeHitEffect(scene, scene.opponentEmojiText.x, scene.opponentEmojiText.y, move.type, true);
    } else if (effectiveness < 1.0 && effectiveness > 0) {
      audioManager.playNotEffective();
    }

    if (result.critical || isSuper) {
      const intensity = isSuper && result.critical ? 0.5 : 0.3;
      flashDamage(scene.cameras.main, { intensity });
    }

    scene.showFloatingDamage(scene.opponentEmojiText.x, scene.opponentEmojiText.y - 30, damage, isSuper, result.critical);
    scene.updateHud(true);

    scene.enqueueMessage(`${player.species.name}の ${move.name}！ ${damage}ダメージ！`);
    reaction.messages.forEach((msg) => scene.enqueueMessage(msg));
    if (result.critical) scene.enqueueMessage("きゅうしょに あたった！");

    if (opponent.currentHp > 0 && scene.tryApplyMoveStatus(opponent, move)) {
      const statusLabel = scene.getStatusLabel(opponent.statusCondition) || "じょうたいいじょう";
      scene.enqueueMessage(`${opponent.species.name}は ${statusLabel}に なった！`);
    }

    if (isSuper) scene.enqueueMessage("こうかは ばつぐんだ！");
    else if (effectiveness > 0 && effectiveness < 1.0) scene.enqueueMessage("あまり きいていない みたいだ…");
    else if (effectiveness === 0) scene.enqueueMessage("こうかが ない みたいだ…");
    if (result.weatherBoosted) scene.enqueueMessage("てんきの えいきょうで いりょくが あがった！");
    else if (result.weatherWeakened) scene.enqueueMessage("てんきの えいきょうで いりょくが さがった…");

    scene._updateElementStateAfterHit(player, opponent, move);
    scene.updateHud(true);

    if (onComplete) scene.time.delayedCall(100, onComplete);
  });
}

/** 相手の攻撃をプレイヤー先攻後に実行する */
export function executeOpponentTurnAfterPlayer(scene) {
  const opponent = scene.battle.opponent;
  const player = scene.getActivePlayer();
  if (!player || player.currentHp <= 0 || opponent.currentHp <= 0) {
    if (player && player.currentHp <= 0) {
      if (!scene.switchToNextAlive()) {
        scene.handleDefeat();
      } else {
        scene.startPlayerTurn();
      }
    }
    return;
  }

  recoverMonsterStamina(opponent, STAMINA_RECOVERY_PER_TURN);

  const statusResult = scene.processTurnStartStatus(opponent);
  if (statusResult === "fainted") {
    scene.handleVictory();
    return;
  }
  if (statusResult === "skip") {
    scene.startPlayerTurn();
    return;
  }

  const move = scene._pendingOpponentMove || scene.chooseOpponentMove(opponent, player);
  executeOpponentAttackDirect(scene, opponent, player, move, () => {
    if (player.currentHp <= 0) {
      if (!scene.switchToNextAlive()) {
        scene.handleDefeat();
      } else {
        scene.startPlayerTurn();
      }
    } else {
      scene.startPlayerTurn();
    }
  });
}

/** 相手の攻撃を直接実行 */
export function executeOpponentAttackDirect(scene, opponent, player, move, onComplete) {
  if (!move) {
    scene.enqueueMessage(`${opponent.species.name}は なにも できない…`);
    if (onComplete) scene.time.delayedCall(100, onComplete);
    return;
  }
  opponent.lastMoveType = move?.type || null;
  const staminaCost = getMoveStaminaCost(move);
  const currentStamina = Number.isFinite(opponent.stamina)
    ? Math.floor(opponent.stamina)
    : getMonsterMaxStamina(opponent);
  opponent.stamina = Math.max(0, currentStamina - staminaCost);

  if (!scene.isMoveHit(move, opponent)) {
    const label = scene._getOpponentLabel();
    scene.enqueueMessage(`${label} ${opponent.species.name}の ${move.name}！ しかし はずれた！`);
    if (onComplete) scene.time.delayedCall(100, onComplete);
    return;
  }

  if (move.category === "status") {
    scene.handleStatusMove(opponent, player, move, false);
    if (onComplete) scene.time.delayedCall(100, onComplete);
    return;
  }

  scene.playAttackAnimation(opponent, player, move, () => {
    const result = scene.calculateDamage(opponent, player, move);
    let damage = result.damage;
    let bondSurvived = false;

    if ((player.bond || 0) >= 70 && player.currentHp <= damage && Math.random() < 0.2) {
      damage = player.currentHp - 1;
      bondSurvived = true;
    }
    player.currentHp = Math.max(0, player.currentHp - damage);

    const reaction = scene._applyElementReaction(opponent, player, move, result.damage);
    if (reaction.extraDamage > 0) {
      let extraDam = reaction.extraDamage;
      if (!bondSurvived && (player.bond || 0) >= 70 && player.currentHp <= extraDam && Math.random() < 0.2) {
        extraDam = player.currentHp - 1;
        bondSurvived = true;
      }
      player.currentHp = Math.max(0, player.currentHp - extraDam);
    }

    const effectiveness = result.effectiveness;
    const isSuper = effectiveness >= 1.5;

    if (isSuper) audioManager.playSuperEffective();

    if (result.critical || isSuper) {
      const intensity = isSuper && result.critical ? 0.012 : 0.007;
      scene.cameras.main.shake(300, intensity);
    }

    scene.showFloatingDamage(scene.playerEmojiText.x, scene.playerEmojiText.y - 30, damage, isSuper, result.critical);
    scene.updateHud(true);

    const label = scene._getOpponentLabel();
    scene.enqueueMessage(`${label} ${opponent.species.name}の ${move.name}！ ${result.damage}ダメージ！`);
    if (bondSurvived) {
      scene.enqueueMessage(`❤️ ${player.species.name}は キズナのちからで もちこたえた！`);
    }
    reaction.messages.forEach((msg) => scene.enqueueMessage(msg));
    if (result.critical) scene.enqueueMessage("きゅうしょに あたった！");

    if (player.currentHp > 0 && scene.tryApplyMoveStatus(player, move)) {
      const statusLabel = scene.getStatusLabel(player.statusCondition) || "じょうたいいじょう";
      scene.enqueueMessage(`${player.species.name}は ${statusLabel}に なった！`);
    }

    if (isSuper) scene.enqueueMessage("こうかは ばつぐんだ！");
    else if (effectiveness > 0 && effectiveness < 1.0) scene.enqueueMessage("あまり きいていない みたいだ…");
    if (result.weatherBoosted) scene.enqueueMessage("てんきの えいきょうで いりょくが あがった！");
    else if (result.weatherWeakened) scene.enqueueMessage("てんきの えいきょうで いりょくが さがった…");

    scene._updateElementStateAfterHit(opponent, player, move);
    scene.updateHud(true);
    if (onComplete) scene.time.delayedCall(100, onComplete);
  });
}

/** 相手のラベルを取得 */
export function getOpponentLabel(scene) {
  if (scene.isBoss) return "ジムリーダーの";
  if (scene.isTrainer) return `${scene.trainerName}の`;
  if (scene.isArena) return "闘技場の";
  return "野生の";
}

/** 相手ターン開始 */
export function startOpponentTurn(scene) {
  const opponent = scene.battle.opponent;
  const player = scene.getActivePlayer();

  if (!player || player.currentHp <= 0 || opponent.currentHp <= 0) {
    if ((!player || player.currentHp <= 0) && !scene.switchToNextAlive()) {
      scene.handleDefeat();
    } else if (player && player.currentHp > 0) {
      scene.handleVictory();
    } else {
      scene.startPlayerTurn();
    }
    return;
  }

  recoverMonsterStamina(opponent, STAMINA_RECOVERY_PER_TURN);

  scene.setBattleState(BattleState.OPPONENT_TURN);

  const statusResult = scene.processTurnStartStatus(opponent);
  if (statusResult === "fainted") {
    scene.handleVictory();
    return;
  }
  if (statusResult === "skip") {
    scene.startPlayerTurn();
    return;
  }

  const move = scene.chooseOpponentMove(opponent, player);
  executeOpponentAttackDirect(scene, opponent, player, move, () => {
    if (player.currentHp <= 0) {
      if (!scene.switchToNextAlive()) {
        scene.handleDefeat();
      } else {
        scene.startPlayerTurn();
      }
    } else {
      scene.startPlayerTurn();
    }
  });
}

/** 相手の技選択AI */
export function chooseOpponentMove(scene, opponent, player) {
  const moves = getMonsterMoves(opponent);
  if (moves.length === 0) return null;

  const oppStats = calcStats(opponent.species, opponent.level || 1);
  const playerStats = calcStats(player.species, player.level || 1);
  const oppHpRatio = Math.max(0, opponent.currentHp / (oppStats.maxHp || 1));
  const playerHpRatio = Math.max(0, player.currentHp / (playerStats.maxHp || 1));
  const isBossLevel = scene.isBoss || scene.isArena || scene.isTrainer || scene.isFinalBoss;

  const weighted = moves
    .map((move) => {
      const rawAccuracy = move.accuracy;
      const accuracyPercent = rawAccuracy === undefined || rawAccuracy === null
        ? 100
        : (rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy);
      const accuracy = Phaser.Math.Clamp(accuracyPercent / 100, 0.35, 1);
      const effectiveness = scene.getEffectiveness(move.type, player.species.primaryType, player.species.secondaryType);
      const isStatus = move.category === "status";
      const basePower = move.power || 0;

      const currentStamina = Number.isFinite(opponent.stamina)
        ? Math.floor(opponent.stamina)
        : getMonsterMaxStamina(opponent);
      const staminaCost = getMoveStaminaCost(move);
      if (currentStamina < staminaCost) return { move, score: -1 };

      let score = 0;
      if (isStatus) {
        score = 10;

        if (move.selfHealPercent) {
          if (oppHpRatio <= 0.25) score += 60;
          else if (oppHpRatio <= 0.45) score += 35;
          else if (oppHpRatio <= 0.7) score += 15;
          else score -= 5;
        }

        if (move.selfAttackStage) {
          const currentStage = opponent.attackStage || 0;
          if (currentStage < 2) score += 18 + (2 - currentStage) * 5;
          else score -= 5;
        }
        if (move.selfDefenseStage) {
          const currentStage = opponent.defenseStage || 0;
          if (currentStage < 2) score += 15 + (2 - currentStage) * 4;
          else score -= 5;
        }

        if (move.targetAttackStage) {
          const targetStage = player.attackStage || 0;
          score += targetStage > 0 ? 22 : 10;
          if (playerHpRatio > 0.6) score += 8;
        }
        if (move.targetDefenseStage) {
          const targetStage = player.defenseStage || 0;
          score += targetStage > 0 ? 18 : 8;
        }

        if (move.inflictStatus && !player.statusCondition) {
          score += 22;
          if (move.inflictStatus === "PARALYSIS" && playerStats.speed > oppStats.speed) score += 10;
          if (move.inflictStatus === "FREEZE") score += 8;
          if (move.inflictStatus === "SLEEP") score += 8;
        } else if (move.inflictStatus && player.statusCondition) {
          score -= 15;
        }
      } else {
        const estimatedDamage = scene.calculateDamage(opponent, player, move).damage;
        const canFinish = estimatedDamage >= player.currentHp;
        const priorityBonus = (move.priority || 0) > 0 ? move.priority * 10 : 0;
        const statusBonus = move.inflictStatus && !player.statusCondition ? 10 : 0;
        const finishBonus = canFinish ? 60 : 0;
        const effectivenessBonus = effectiveness >= 2 ? 25 : (effectiveness >= 1.5 ? 15 : (effectiveness < 1 ? -10 : 0));
        const stabBonus = (move.type === opponent.species.primaryType || move.type === opponent.species.secondaryType) ? 8 : 0;

        score = estimatedDamage + 10 + basePower * 0.1 + effectivenessBonus + priorityBonus + statusBonus + finishBonus + stabBonus;

        if (playerHpRatio < 0.2 && (move.priority || 0) > 0) {
          score += 20;
        }
      }

      score *= accuracy;
      if (isBossLevel) score *= 1.15;
      score -= staminaCost * 1.5;

      return { move, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (weighted.length === 0) return moves[0] || null;

  if (isBossLevel) {
    const topCount = Math.min(2, weighted.length);
    if (topCount === 1 || Math.random() < 0.6) return weighted[0].move;
    return weighted[1].move;
  }

  const top = weighted.slice(0, Math.min(3, weighted.length));
  return Phaser.Utils.Array.GetRandom(top).move;
}

/** プレイヤーターン開始 */
export function startPlayerTurn(scene) {
  const player = scene.getActivePlayer();
  if (!player) {
    scene.handleDefeat();
    return;
  }

  recoverMonsterStamina(player, STAMINA_RECOVERY_PER_TURN);

  scene._tickWeather();

  const statusResult = scene.processTurnStartStatus(player);
  if (statusResult === "fainted") {
    if (!scene.switchToNextAlive()) {
      scene.handleDefeat();
    } else {
      scene.showMainMenu(true);
    }
    return;
  }
  if (statusResult === "skip") {
    scene.startOpponentTurn();
    return;
  }

  scene.setBattleState(BattleState.PLAYER_TURN);
  scene.showMainMenu(true);
  if (scene.currentMessage && scene.currentMessage.text) {
    scene.messageText.setText(scene.currentMessage.text);
  } else {
    scene.messageText.setText("どうする？");
  }
}

/** モンスター入れ替え実行 */
export function performSwitch(scene) {
  const switchable = scene.switchableParty || [];
  if (switchable.length === 0 || scene.selectedSwitchIndex >= switchable.length) return;

  const selected = switchable[scene.selectedSwitchIndex];
  const currentPlayer = scene.getActivePlayer();
  const currentIndex = gameState.party.indexOf(currentPlayer);
  const newIndex = selected.index;

  if (currentIndex >= 0 && newIndex >= 0) {
    gameState.swapPartyOrder(0, newIndex);
    scene.battle.player = gameState.party[0];
  }

  scene.clearMenuTexts();
  scene.enqueueMessage(`${currentPlayer.species.name}を ひっこめた！`);
  scene.enqueueMessage(`ゆけ！ ${scene.battle.player.species.name}！`);

  setMonsterEmoji(
    scene.playerEmojiText,
    scene.battle.player.species.emoji || "?",
    scene.battle.player.species.subEmoji,
  );
  scene.playerEmojiText.setScale(Number.isFinite(scene.battle.player?.species?.sizeScale)
    ? Math.max(0.4, scene.battle.player.species.sizeScale)
    : 1);
  scene.updateHud(false);

  scene.setBattleState(BattleState.OPPONENT_TURN);
  startOpponentTurn(scene);
}
