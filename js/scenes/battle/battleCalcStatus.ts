// バトル計算・状態異常ロジック
import { calcStats, getAbilityById } from "../../data/monsters.ts";
import { WEATHER } from "../../data/mapRules.ts";
import {
  TYPE_EFFECTIVENESS,
} from "../../data/monsters.ts";
import {
  StatusCondition,
  CRITICAL_HIT_RATE,
  CRITICAL_HIT_MULTIPLIER,
  DAMAGE_RANDOM_MIN,
  DAMAGE_RANDOM_MAX,
  STAB_BONUS,
  BURN_DAMAGE_RATIO,
  POISON_DAMAGE_RATIO,
  PARALYSIS_SKIP_RATE,
  FREEZE_THAW_RATE,
  SLEEP_WAKE_RATE,
  BURN_ATTACK_MULTIPLIER,
  getWeatherModifier,
} from "./battleConstants.ts";
import { audioManager } from "../../audio/AudioManager.ts";

/** 元素状態の初期化 */
export function initializeElementStates(scene) {
  [scene.battle?.player, scene.battle?.opponent].forEach((monster) => {
    if (!monster) return;
    monster.wetTurns = Math.max(0, Math.floor(monster.wetTurns || 0));
    monster.accuracyDownTurns = Math.max(0, Math.floor(monster.accuracyDownTurns || 0));
    monster.lastMoveType = monster.lastMoveType || null;
  });
}

/** ターン開始時の元素状態更新 */
export function updateElementStatesAtTurnStart(scene, monster) {
  if (!monster) return;
  if (monster.wetTurns > 0) {
    monster.wetTurns = Math.max(0, monster.wetTurns - 1);
  }
  if (monster.accuracyDownTurns > 0) {
    monster.accuracyDownTurns = Math.max(0, monster.accuracyDownTurns - 1);
    scene.enqueueMessage(`${monster.species.name}は すいじょうきで みえづらい…`);
  }
}

/** 命中判定 */
export function isMoveHit(move, user = null) {
  if (!move) return false;
  const rawAccuracy = move.accuracy;
  if (rawAccuracy === undefined || rawAccuracy === null) return true;

  let accuracy = rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy;
  if (user && user.accuracyDownTurns > 0) {
    accuracy *= 0.75;
  }
  const clamped = Phaser.Math.Clamp(accuracy, 0, 100);
  return Math.random() * 100 <= clamped;
}

/** 技による状態異常の付与試行 */
export function tryApplyMoveStatus(target, move) {
  if (!target || !move || !move.inflictStatus || !move.statusChance) return false;
  if (target.statusCondition && target.statusCondition !== StatusCondition.NONE) return false;

  const chancePercent = move.statusChance <= 1 ? move.statusChance * 100 : move.statusChance;
  const chance = Phaser.Math.Clamp(chancePercent, 0, 100);
  if (Math.random() * 100 > chance) return false;

  target.statusCondition = move.inflictStatus;
  return true;
}

/** 元素反応の適用（電気×水、炎×氷など） */
export function applyElementReaction(scene, attacker, defender, move, baseDamage) {
  if (!attacker || !defender || !move) return { extraDamage: 0, messages: [] };

  const messages = [];
  let extraDamage = 0;

  const wetByWeather = scene.weather === WEATHER.RAINY;
  const wetByState = (defender.wetTurns || 0) > 0;
  const wetByLastMove = defender.lastMoveType === "WATER";

  if (move.type === "ELECTRIC" && (wetByWeather || wetByState || wetByLastMove)) {
    const stats = calcStats(defender.species, defender.level || 1);
    const shockDamage = Math.max(1, Math.floor(stats.maxHp * 0.12));
    extraDamage += shockDamage;
    messages.push(`⚡ みずをつたって かんでん！ ついかで ${shockDamage} ダメージ！`);
  }

  if (move.type === "FIRE" && defender.statusCondition === StatusCondition.FREEZE) {
    defender.statusCondition = StatusCondition.NONE;
    const steamDamage = Math.max(1, Math.floor(Math.max(1, baseDamage) * 0.5));
    extraDamage += steamDamage;
    defender.accuracyDownTurns = Math.max(defender.accuracyDownTurns || 0, 2);
    messages.push(`♨️ こおりが とけて すいじょうきばくはつ！ ついかで ${steamDamage} ダメージ！`);
    messages.push(`${defender.species.name}の めいちゅうが さがった！`);
  }

  return { extraDamage, messages };
}

/** 攻撃後の元素状態更新 */
export function updateElementStateAfterHit(scene, attacker, defender, move) {
  if (!attacker || !defender || !move) return;
  attacker.lastMoveType = move.type || null;
  if (move.type === "WATER" && defender.currentHp > 0) {
    defender.wetTurns = Math.max(defender.wetTurns || 0, 2);
    scene.enqueueMessage(`${defender.species.name}は びしょぬれになった！`);
  }
}

/**
 * ターン開始時の状態異常処理。
 * @returns {"act" | "skip" | "fainted"}
 */
export function processTurnStartStatus(scene, monster) {
  if (!monster || !monster.species) return "act";
  updateElementStatesAtTurnStart(scene, monster);
  if (!monster.statusCondition || monster.statusCondition === StatusCondition.NONE) return "act";

  // キズナによる状態異常回復 (bond 80以上, プレイヤー側のみ, 20%で発動)
  if (monster === scene.battle?.player && (monster.bond || 0) >= 80 && Math.random() < 0.2) {
    monster.statusCondition = StatusCondition.NONE;
    scene.enqueueMessage(`❤️ ${monster.species.name}は キズナのちからで じょうたいを なおした！`);
    scene.updateHud(true);
    return "act";
  }

  if (monster.statusCondition === StatusCondition.BURN) {
    const stats = calcStats(monster.species, monster.level || 1);
    const burnDamage = Math.max(1, Math.floor(stats.maxHp * BURN_DAMAGE_RATIO));
    monster.currentHp = Math.max(0, monster.currentHp - burnDamage);
    scene.enqueueMessage(`${monster.species.name}は やけどで くるしんでいる！ ${burnDamage}ダメージ！`);
    scene.updateHud(true);
    if (monster.currentHp <= 0) return "fainted";
  }

  if (monster.statusCondition === StatusCondition.POISON) {
    const stats = calcStats(monster.species, monster.level || 1);
    const poisonDamage = Math.max(1, Math.floor(stats.maxHp * POISON_DAMAGE_RATIO));
    monster.currentHp = Math.max(0, monster.currentHp - poisonDamage);
    scene.enqueueMessage(`${monster.species.name}は どくで ダメージを うけている！ ${poisonDamage}ダメージ！`);
    scene.updateHud(true);
    if (monster.currentHp <= 0) return "fainted";
  }

  if (monster.statusCondition === StatusCondition.PARALYSIS) {
    if (Math.random() < PARALYSIS_SKIP_RATE) {
      scene.enqueueMessage(`${monster.species.name}は しびれて うごけない！`);
      return "skip";
    }
  }

  if (monster.statusCondition === StatusCondition.FREEZE) {
    if (Math.random() < FREEZE_THAW_RATE) {
      monster.statusCondition = StatusCondition.NONE;
      scene.enqueueMessage(`${monster.species.name}の こおりが とけた！`);
    } else {
      scene.enqueueMessage(`${monster.species.name}は こおって うごけない！`);
      return "skip";
    }
  }

  if (monster.statusCondition === StatusCondition.SLEEP) {
    monster._sleepTurns = (monster._sleepTurns || 0) + 1;
    if (monster._sleepTurns >= (monster._sleepDuration || 3) || Math.random() < SLEEP_WAKE_RATE) {
      monster.statusCondition = StatusCondition.NONE;
      monster._sleepTurns = 0;
      scene.enqueueMessage(`${monster.species.name}は めを さました！`);
    } else {
      scene.enqueueMessage(`${monster.species.name}は ぐうぐう ねむっている…`);
      return "skip";
    }
  }

  return "act";
}

/** ステータス技の処理 */
export function handleStatusMove(scene, user, target, move, _isPlayer) {
  const userName = user.species.name;

  if (move.selfAttackStage) {
    const before = user.attackStage || 0;
    user.attackStage = scene.clampStage(before + move.selfAttackStage);
    if (user.attackStage !== before) scene.enqueueMessage(`${userName}は きあいを ためた！ こうげきが あがった！`);
    else scene.enqueueMessage("これいじょう こうげきは かわらない！");
  }
  if (move.selfDefenseStage) {
    const before = user.defenseStage || 0;
    user.defenseStage = scene.clampStage(before + move.selfDefenseStage);
    if (user.defenseStage !== before) scene.enqueueMessage(`${userName}は ぼうぎょたいせいを とった！ ぼうぎょが あがった！`);
    else scene.enqueueMessage("これいじょう ぼうぎょは かわらない！");
  }
  if (move.targetAttackStage) {
    const before = target.attackStage || 0;
    target.attackStage = scene.clampStage(before + move.targetAttackStage);
    if (target.attackStage !== before) scene.enqueueMessage(`${target.species.name}の こうげきが さがった！`);
    else scene.enqueueMessage("しかし これいじょう さがらない！");
  }
  if (move.selfHealPercent) {
    const stats = calcStats(user.species, user.level || 1);
    const maxHp = stats.maxHp;
    const healAmt = Math.floor(maxHp * move.selfHealPercent);
    const before = user.currentHp;
    user.currentHp = Math.min(maxHp, user.currentHp + healAmt);
    const healed = user.currentHp - before;
    if (healed > 0) {
      scene.enqueueMessage(`${userName}は HPを ${healed} かいふくした！`);
      audioManager.playHeal();
    } else {
      scene.enqueueMessage("しかし HPは まんたんだ！");
    }
    scene.updateHud(true);
  }
}

/** ダメージ計算 */
export function calculateDamage(scene, attacker, defender, move) {
  const basePower = move.power || 0;
  if (basePower <= 0) return { damage: 0, effectiveness: 1, critical: false };

  const level = attacker.level || 1;
  const atkStats = calcStats(attacker.species, level);
  const defStats = calcStats(defender.species, defender.level || 1);

  const atkBase = atkStats.attack;
  const defBase = defStats.defense;

  const atkStage = attacker.attackStage || 0;
  const defStage = defender.defenseStage || 0;
  const atkMult = Math.max(0.25, 1 + atkStage * 0.25);
  const defMult = Math.max(0.25, 1 + defStage * 0.25);
  const burnMul = attacker.statusCondition === StatusCondition.BURN && move.category === "physical" ? BURN_ATTACK_MULTIPLIER : 1;

  const effectiveness = getEffectiveness(move.type, defender.species.primaryType, defender.species.secondaryType);
  const stab = (move.type === attacker.species.primaryType || move.type === attacker.species.secondaryType) ? STAB_BONUS : 1;
  const randomFactor = Phaser.Math.FloatBetween(DAMAGE_RANDOM_MIN, DAMAGE_RANDOM_MAX);

  let critRate = CRITICAL_HIT_RATE;
  if (attacker === scene.battle?.player && (attacker.bond || 0) >= 90) {
    critRate += 0.1;
  }
  const critical = Math.random() < critRate;

  const criticalMul = critical ? CRITICAL_HIT_MULTIPLIER : 1;
  const weatherMul = getWeatherModifier(scene.weather, move.type);
  const abilityMod = getAbilityDamageModifier(attacker, defender, move);

  const damage =
    (((2 * level) / 5 + 2) * basePower * ((atkBase * atkMult * burnMul) / (defBase * defMult))) / 50 + 2;

  return {
    damage: Math.max(1, Math.round(damage * effectiveness * stab * randomFactor * criticalMul * weatherMul * abilityMod.attackerMul * abilityMod.defenderMul)),
    effectiveness,
    critical,
    weatherBoosted: weatherMul > 1.0,
    weatherWeakened: weatherMul < 1.0,
  };
}

/** タイプ相性倍率を取得 */
export function getEffectiveness(attackType, primaryDefendType, secondaryDefendType) {
  const row = TYPE_EFFECTIVENESS[attackType];
  if (!row) return 1;
  const primary = row[primaryDefendType] || 1;
  const secondary = secondaryDefendType ? (row[secondaryDefendType] || 1) : 1;
  return primary * secondary;
}

/** モンスターの特性を取得 */
export function getMonsterAbility(monster) {
  if (!monster || !monster.species) return null;
  return getAbilityById(monster.abilityId || monster.species.abilityId);
}

/** HP が低いかどうか判定 */
export function isLowHp(monster) {
  if (!monster || !monster.species) return false;
  const stats = calcStats(monster.species, monster.level || 1);
  return monster.currentHp <= Math.floor((stats.maxHp || 1) / 3);
}

/** 特性によるダメージ倍率修正 */
export function getAbilityDamageModifier(attacker, defender, move) {
  let attackerMul = 1;
  let defenderMul = 1;

  const attackerAbility = getMonsterAbility(attacker);
  if (attackerAbility && isLowHp(attacker)) {
    if (attackerAbility.id === "BLAZE" && move.type === "FIRE") {
      attackerMul *= 1.25;
    } else if (attackerAbility.id === "TORRENT" && move.type === "WATER") {
      attackerMul *= 1.25;
    } else if (attackerAbility.id === "OVERGROW" && move.type === "GRASS") {
      attackerMul *= 1.25;
    } else if (attackerAbility.id === "MOTOR_DRIVE" && move.type === "ELECTRIC") {
      attackerMul *= 1.25;
    } else if (attackerAbility.id === "ICE_BODY" && move.type === "ICE") {
      attackerMul *= 1.25;
    }
  }

  const defenderAbility = getMonsterAbility(defender);
  if (defenderAbility) {
    if (defenderAbility.id === "STURDY") {
      defenderMul *= 0.9;
    } else if (defenderAbility.id === "INTIMIDATE") {
      defenderMul *= 0.92;
    } else if (defenderAbility.id === "SWIFT_SWIM") {
      defenderMul *= 0.9;
    }
  }

  return { attackerMul, defenderMul };
}
