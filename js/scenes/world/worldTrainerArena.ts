import { gameState, PARTY_CAPACITY } from "../../state/gameState.ts";
import {
  getArenaOpponent,
  calcStats,
  getMonsterMaxStamina,
  MONSTERS,
  rollMonsterAbilityId,
  syncMonsterMoves,
} from "../../data/monsters.ts";
import { createWildMonsterForEncounter } from "../../data/mapRules.ts";
import { audioManager } from "../../audio/AudioManager.ts";

export function handleTrainerInteraction(scene, npc) {
  if (scene._trainerBattlePending) {
    return;
  }

  const preBattleText = npc.text || "バトルだ！";

  if (!gameState.storyFlags.starterChosen) {
    scene.showMessage("まず 相棒のモンスターを もらってきてね！");
    return;
  }

  const activeMon = gameState.getFirstAlive();
  if (!activeMon) {
    scene.showMessage("たたかえるモンスターが いない… まずは かいふくしよう！");
    return;
  }

  scene._trainerBattlePending = true;
  scene.showMessage(preBattleText);
  scene.time.delayedCall(1500, () => {
    launchTrainerBattle(scene, npc);
  });
}

export function launchTrainerBattle(scene, npc) {
  const activeMon = gameState.getFirstAlive();
  if (!activeMon) {
    scene._trainerBattlePending = false;
    return;
  }

  if (npc?.rivalBattle === "ruins_final") {
    const gateMessage = scene._getRuinsFinalGateMessage();
    if (gateMessage) {
      scene.showMessage(gateMessage, 3000);
      scene._trainerBattlePending = false;
      return;
    }
  }

  const opponentMon = buildTrainerOpponent(npc.rivalBattle, npc.rivalLevel || 10);
  if (!opponentMon) {
    scene.showMessage("相手のモンスターが みつからない…");
    scene._trainerBattlePending = false;
    return;
  }

  gameState.markSeen(opponentMon.species.id);
  gameState.setBattle({
    player: activeMon,
    opponent: opponentMon,
    isBoss: npc.isBossTrainer || false,
    isTrainer: true,
    trainerName: npc.trainerName || "トレーナー",
    trainerBattleKey: npc.rivalBattle,
    isFinalBoss: npc.isFinalBoss || false,
  });

  audioManager.stopBgm();
  audioManager.playEncounter();

  scene.cameras.main.fadeOut(400, 0, 0, 0);
  scene.cameras.main.once("camerafadeoutcomplete", () => {
    scene.scene.pause();
    scene.scene.launch("BattleScene", { from: "WorldScene" });
  });
}

export function buildTrainerOpponent(battleKey, level) {
  const starterSpecies = gameState.storyFlags.starterSpeciesId || "EMBEAR";
  const rivalCounterMap = { EMBEAR: "FINBUB", FINBUB: "THORNVINE", THORNVINE: "EMBEAR" };
  const rivalSpeciesId = rivalCounterMap[starterSpecies] || "FINBUB";

  const opponentSpeciesMap = {
    town: rivalSpeciesId,
    forest_scout: "THORNVINE",
    forest_guardian: "CRYSTALINE",
    forest_rival: rivalSpeciesId,
    cave_scholar: "SPIRALHORN",
    cave_evil: "SHADOWPAW",
    cave_rival3: rivalSpeciesId,
    dark_grunt: "GHOSTAIL",
    dark_sentinel: "ZAPDRAKE",
    dark_tower_void: "COSMOWL",
    volcano_boss: "BLAZEBIRD",
    volcanic_scout: "SOLFLARE",
    frozen_sage: "GLACIDRAKE",
    frozen_rival: rivalSpeciesId,
    ruins_guardian: "LIGHTNIX",
    ruins_final: "SKYPIP",
    garden_champion: "ETERNIA",
    swamp_ranger: "RIPPLYNX",
    swamp_evil: "GHOSTAIL",
    coral_diver: "CORALION",
    desert_nomad: "CACTURION",
    desert_rival: rivalSpeciesId,
    shadow_beast: "COSMOWL",
    library_scholar: "SPIRALHORN",
    elite_wind: "THUNDAGLE",
    elite_flame: "SERPYRO",
    elite_tide: "WHALORD",
    elite_frost: "GLACIDRAKE",
    basin_final_rival: rivalSpeciesId,
  };

  const speciesId = opponentSpeciesMap[battleKey] || "EMBEAR";
  const species = MONSTERS[speciesId] || MONSTERS.EMBEAR;
  if (!species) {
    return createWildMonsterForEncounter("FOREST", false);
  }
  const stats = calcStats(species, level);
  const trainerMon = {
    species,
    level,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    currentHp: stats.maxHp,
    attackStage: 0,
    defenseStage: 0,
    speedStage: 0,
    abilityId: rollMonsterAbilityId(species),
    rewardMoney: 50 + level * 15,
    moveIds: [],
    stamina: getMonsterMaxStamina(),
  };
  syncMonsterMoves(trainerMon);
  return trainerMon;
}

export function handleTrainerBattleResult(scene, battleKey, won) {
  const sf = gameState.storyFlags;

  switch (battleKey) {
    case "town":
      if (won && !sf.townRivalBeaten) {
        sf.townRivalBeaten = true;
        scene.showDialogSequence([
          "レン: うそだろ…！ まさか 負けるなんて…！",
          "レン: …認めるよ。今のきみは 強い。",
          "レン: でもな、おれは あきらめない。次に会うときは もっと強くなってるからな！",
          "レン: 森で待ってるぞ。先に行って 新しいモンスターを探しておくよ！",
          `★ ライバル レンに 勝利した！ ${gameState.playerName}の冒険が本格的に始まる…！`,
        ]);
      } else if (!won) {
        scene.showMessage("レン: フフフ、まだまだだね。草むらで鍛えなおしておいで！ 何度でも受けてやるよ。");
      }
      break;
    case "forest_scout":
      if (won && !sf.forestScoutBeaten) {
        sf.forestScoutBeaten = true;
        scene.showDialogSequence([
          "ミナト: 森での立ち回り、合格だ！",
          "ミナト: 洞窟へ行くなら捕獲と実戦経験を積んでおくといい。",
          "📘 森の試験をクリアした！",
        ], () => {
          gameState.addMoney(220);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "forest_guardian":
      if (won && !sf.forestCrystalFound) {
        sf.forestCrystalFound = true;
        audioManager.playHeal();
        scene.showDialogSequence([
          "守護者: …認めよう。この森のクリスタル🔷を 預けよう。",
          "★ 森のエモじクリスタルを 手に入れた！ [1/5]",
        ], () => {
          gameState.addMoney(200);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "forest_rival":
      if (won && !sf.forestRivalBeaten) {
        sf.forestRivalBeaten = true;
        scene.showDialogSequence([
          "レン: くっ…！ また まけた…！",
          "レン: おまえ、どんどん強くなってるな…。",
          "レン: でも おれも負けてられない！ もっと修行するぞ！",
          "レン: それより… 洞窟の奥に ダーク団がいるらしい。気をつけろよ。",
          "レン: おれも 追いかけるから。先に行けよ！",
        ]);
      }
      break;
    case "cave_scholar":
      if (won && !sf.caveScholarBeaten) {
        sf.caveScholarBeaten = true;
        scene.showDialogSequence([
          "シオン: 戦術演習、見事だ。読み合いの基礎は十分だ。",
          "シオン: 次は闘技場3連戦で安定して勝てるか試してみるといい。",
          "📘 洞窟の戦術演習をクリアした！",
        ], () => {
          gameState.addMoney(320);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "cave_evil":
      if (won && !sf.caveEvilBeaten) {
        sf.caveEvilBeaten = true;
        audioManager.playHeal();
        scene.showDialogSequence([
          "シャドウ: ぐっ…まさか この わたしが…！",
          "シャドウ: 小僧…おまえの力、認めてやる。",
          "シャドウ: クリスタル🔶を…置いていく…。これ以上 戦う義理はない。",
          "シャドウ: だが ボス・ライオットは おまえごとき では相手にならんぞ…。",
          "★ 洞窟のエモじクリスタルを 手に入れた！ [2/5]",
          "★ ダーク団アジトへの道が 西に 開けた！",
        ], () => {
          gameState.addMoney(300);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "dark_sentinel":
      if (won && !sf.darkTowerSentinelBeaten) {
        sf.darkTowerSentinelBeaten = true;
        scene.showDialogSequence([
          "ノクト: …番兵の役目、ここまでだ。きみは先へ進む資格がある。",
          "ノクト: 闇は深い。だが怯むな。",
        ], () => {
          gameState.addMoney(380);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "volcano_boss":
      if (won && !sf.volcanoEvilBossBeaten) {
        sf.volcanoEvilBossBeaten = true;
        audioManager.playHeal();
        scene.showDialogSequence([
          "ライオット: なんと…！ この おれが…こんな子どもに…！",
          "ライオット: ぐぅ…認めよう。おまえには 何か特別な力がある。",
          "ライオット: クリスタル🔴を…返してやる！",
          "ライオット: だが 覚えておけ！ 最後のクリスタルは そらの遺跡にある！",
          "ライオット: おれは 遺跡で おまえを待っている…！ 最終決戦だ！",
          "★ マグマクリスタルを 手に入れた！ [4/5]",
          "── あと1つ… 最後のクリスタルが そらの遺跡に眠っている。",
          "※ 氷峰を越え、そらの遺跡を 目指そう！",
        ], () => {
          gameState.addMoney(500);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "volcanic_scout":
      if (won && !sf.volcanicScoutBeaten) {
        sf.volcanicScoutBeaten = true;
        scene.showDialogSequence([
          "ガロ: 熱波の中でも判断が鈍らないな。見事だ。",
          "ガロ: この先は氷峰。捕獲と実戦を重ねて備えろ。",
          "📘 火山斥候試験をクリアした！",
        ], () => {
          gameState.addMoney(460);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "frozen_sage":
      if (won && !sf.frozenSageBeaten) {
        sf.frozenSageBeaten = true;
        scene.showDialogSequence([
          "セツナ: 冷静さと判断力、どちらも申し分ない。",
          "セツナ: 遺跡へ向かっていい。最後まで迷わないことね。",
          "📘 氷峰の賢者試験をクリアした！",
        ], () => {
          gameState.addMoney(520);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "ruins_guardian":
      if (won && !sf.ruinsGuardianBeaten) {
        sf.ruinsGuardianBeaten = true;
        scene.showDialogSequence([
          "ラカ: 試練は完了だ。最奥の間への通行を認める。",
          "ラカ: 残るは実戦の積み重ねのみ…胸を張って進め。",
          "📘 遺跡の守人試練をクリアした！",
        ], () => {
          gameState.addMoney(650);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "ruins_final":
      if (won && !sf.ruinsFinalDone) {
        sf.ruinsFinalDone = true;
        audioManager.playHeal();
        scene.showDialogSequence([
          "ライオット: ば…ばかな…！ この おれが…完全に負けた…！",
          "ライオット: くっ…認めよう。おまえの強さは 本物だ。",
          "ライオット: …クリスタル⚡を 返す。もう ダーク団は終わりだ…。",
          "★ 遺跡のクリスタルを 手に入れた！ [5/5]",
          "── 5つのエモじクリスタルが 眩い光を放ち始めた…！",
          "── 遺跡全体が 黄金色の光に包まれていく…",
          "── クリスタルの力が 集まり、伝説の存在を呼び覚ます…！",
          "✨ エテルニア: ………ついに…目覚めの時が来たか。",
          `✨ エテルニア: おまえが ${gameState.playerName}か。クリスタルを守り抜いた勇者よ。`,
          "✨ エテルニア: 長い眠りの間、闇の脅威を感じていた。",
          "✨ エテルニア: おまえの勇気と絆が 世界を救ったのだ。",
          "✨ エテルニア: …その礼として、わたしは おまえと共に歩もう。",
          "✨ エテルニアが パーティに加わった！",
          "🎉 ── おめでとう！ メインストーリー クリア！ ──",
          `🎉 ${gameState.playerName}は 5つのクリスタルを守り、世界に平和をもたらした！`,
          "🎉 しかし… 冒険はまだ終わらない。",
          "※ 天空の花園への道が 開いた！ 最強のトレーナーと伝説のモンスターが待っている…！",
        ], () => {
          addEternaToParty();
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "cave_rival3":
      if (won && !sf.caveRivalBeaten3) {
        sf.caveRivalBeaten3 = true;
        scene.showDialogSequence([
          "レン: くっ…！ 3回目も負けるとは！",
          "レン: ダーク団のアジトに潜入するらしいな。気をつけろよ。",
          "レン: …いや、おまえなら大丈夫か。",
        ]);
      }
      break;
    case "dark_grunt":
      if (won && !sf.darkTowerGruntBeaten) {
        sf.darkTowerGruntBeaten = true;
        scene.showDialogSequence([
          "したっぱ: うわあ！ こんなに強いのか！",
          "したっぱ: ヴォイド幹部は 奥にいるぞ…！ 覚悟しておけ！",
        ], () => {
          gameState.addMoney(150);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "dark_tower_void":
      if (won && !sf.darkTowerVoidBeaten) {
        sf.darkTowerVoidBeaten = true;
        audioManager.playHeal();
        scene.showDialogSequence([
          "ヴォイド: …闇の力が 光に敗れるとは。",
          "ヴォイド: おまえの中にある光… 眩しいものだ。",
          "ヴォイド: クリスタル🟣を…持っていけ。",
          "ヴォイド: ライオットに伝えろ。もう この流れは 止められないと。",
          "★ 闇のエモじクリスタルを 手に入れた！ [3/5]",
          "── アジトの空気が 変わった。ダーク団の動揺が 感じられる…",
          "※ 洞窟に戻り、マグマ峠へ向かおう！",
        ], () => {
          gameState.addMoney(400);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "frozen_rival":
      if (won && !sf.frozenPeakRivalBeaten) {
        sf.frozenPeakRivalBeaten = true;
        scene.showDialogSequence([
          "レン: …まいった！ また負けた！",
          "レン: でも次こそ…！ 遺跡で最終決戦だ！ 先に行って待ってるぞ！",
        ]);
      }
      break;
    case "garden_champion":
      if (won) {
        scene.showDialogSequence([
          "アキラ: …素晴らしい！ 伝説の守護者を超える力だ！",
          "アキラ: 真のチャンピオンはキミだ。この称号を贈ろう！",
          "🏆 チャンピオン アキラに勝利した！ 報酬: 2000G！",
        ], () => {
          gameState.addMoney(2000);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "swamp_ranger":
      if (won && !sf.swampRangerBeaten) {
        sf.swampRangerBeaten = true;
        scene.showDialogSequence([
          "カワセ: 湿地での立ち回り、見事だ！",
          "カワセ: この先の珊瑚の浜にも行ってみるといい。",
          "📘 湿地レンジャー試験をクリアした！",
        ], () => {
          gameState.addMoney(250);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "swamp_evil":
      if (won && !sf.swampEvilBeaten) {
        sf.swampEvilBeaten = true;
        scene.showDialogSequence([
          "したっぱ: ぐぅ…湿地の実験も失敗か...!",
          "したっぱ: ここの毒沼研究データは持っていけ…もう用済みだ。",
        ], () => {
          gameState.addMoney(180);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "coral_diver":
      if (won && !sf.coralDiverBeaten) {
        sf.coralDiverBeaten = true;
        scene.showDialogSequence([
          "ウミノ: さすが！ 水中の戦いにも慣れているな！",
          "ウミノ: この浜の奥には珊瑚の真珠が眠っている…みずタイプに託してみな。",
          "📘 珊瑚ダイバー試験をクリアした！",
        ], () => {
          gameState.addMoney(280);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "desert_nomad":
      if (won && !sf.desertNomadBeaten) {
        sf.desertNomadBeaten = true;
        scene.showDialogSequence([
          "サジン: 砂嵐の中でも冷静だったな…認めよう！",
          "サジン: この谷の奥にある砂漠の遺物…探してみるのもいいだろう。",
          "📘 砂漠の遊牧試験をクリアした！",
        ], () => {
          gameState.addMoney(400);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "desert_rival":
      if (won && !sf.desertRivalBeaten) {
        sf.desertRivalBeaten = true;
        scene.showDialogSequence([
          "レン: くっ…！ 砂漠でも負けるのか…！",
          "レン: でもな、この砂の中を一緒に歩いてると…なんか楽しいよな。",
          "レン: 次は氷峰で勝負だ！ 絶対に追いついてやる！",
        ]);
      }
      break;
    case "shadow_beast":
      if (won && !sf.shadowBeastBeaten) {
        sf.shadowBeastBeaten = true;
        scene.showDialogSequence([
          "ヤミカ: …影の番人として 最後の試練を終えた。",
          "ヤミカ: この森の奥には ダーク団の研究所跡がある…。",
          "ヤミカ: そこに残されたデータが 何かの手がかりになるかもしれない。",
          "📘 影の森の番人を倒した！",
        ], () => {
          sf.shadowLabFound = true;
          gameState.addMoney(450);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "library_scholar":
      if (won && !sf.libraryScholarBeaten) {
        sf.libraryScholarBeaten = true;
        scene.showDialogSequence([
          "アカネ: 見事だ！ 知識だけでなく実戦の力もある！",
          "アカネ: この図書館のテレポートパズルを解けば、古代の秘宝にたどり着ける…。",
          "アカネ: 遺跡への道も開けるだろう。頑張りなさい！",
          "📘 古代図書館の学者試験をクリアした！",
        ], () => {
          gameState.addMoney(500);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "elite_wind":
      if (won && !sf.eliteFourWind) {
        sf.eliteFourWind = true;
        scene.showDialogSequence([
          "ハヤテ: 風のように素早い…見事だ。",
          "ハヤテ: 四天王の第一関門突破おめでとう。",
          "🏅 四天王ハヤテに勝利した！",
        ], () => {
          gameState.addMoney(800);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "elite_flame":
      if (won && !sf.eliteFourFlame) {
        sf.eliteFourFlame = true;
        scene.showDialogSequence([
          "カグラ: 炎をも凌ぐ情熱…素晴らしい。",
          "カグラ: 次の試練も乗り越えなさい。",
          "🏅 四天王カグラに勝利した！",
        ], () => {
          gameState.addMoney(900);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "elite_tide":
      if (won && !sf.eliteFourTide) {
        sf.eliteFourTide = true;
        scene.showDialogSequence([
          "ミナモ: 潮流を制する者か…見事。",
          "ミナモ: 最後の一人が待っている。覚悟を決めなさい。",
          "🏅 四天王ミナモに勝利した！",
        ], () => {
          gameState.addMoney(1000);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "elite_frost":
      if (won && !sf.eliteFourFrost) {
        sf.eliteFourFrost = true;
        scene.showDialogSequence([
          "ヒョウガ: …氷をも溶かす熱き魂。四天王すべてを制覇したな。",
          "ヒョウガ: だが、真の最終試練は…この盆地の最奥で待っている。",
          "🏅 四天王ヒョウガに勝利した！ 四天王完全制覇！",
          "✨ 星降り盆地の最奥への道が開いた…！",
        ], () => {
          gameState.addMoney(1200);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    case "basin_final_rival":
      if (won && !sf.basinFinalRival) {
        sf.basinFinalRival = true;
        scene.showDialogSequence([
          "レン: …ついに この時が来たか。",
          "レン: おまえとの最後のバトル…全力で挑んだけど、やっぱり敵わなかったな。",
          "レン: でもな…おまえと旅をしてきたこの時間は 最高だった。",
          "レン: ありがとう。おまえは 最高のライバルだ。",
          "🎉 ライバル レンとの最終決戦に勝利した！",
          "🌟 すべての試練を乗り越えた… 真のチャンピオンの誕生だ！",
        ], () => {
          gameState.addMoney(3000);
          gameState.save();
          scene.createUi();
        });
      }
      break;
    default:
      break;
  }
}

export function addEternaToParty() {
  const eterna = MONSTERS.ETERNIA || MONSTERS.AURORO || MONSTERS.BLAZEBIRD;
  if (!eterna) return;

  const level = 40;
  const stats = calcStats(eterna, level);
  const eternaEntry = {
    species: eterna,
    level,
    exp: 0,
    nextLevelExp: 10 + 8 * level,
    currentHp: stats.maxHp,
    attackStage: 0,
    defenseStage: 0,
    speedStage: 0,
    abilityId: rollMonsterAbilityId(eterna),
    moveIds: [],
    stamina: getMonsterMaxStamina(),
  };
  syncMonsterMoves(eternaEntry);

  if (gameState.party.length >= PARTY_CAPACITY) {
    gameState.box.push(eternaEntry);
  } else {
    gameState.party.push(eternaEntry);
  }
  gameState.markCaught(eterna.id);
}

export function handleArenaInteraction(scene) {
  const activeMon = gameState.getFirstAlive();
  if (!activeMon) {
    scene.showMessage("たたかえるモンスターが いない… まずは かいふくしよう！");
    return;
  }

  if (!gameState.arenaRound) gameState.arenaRound = 0;

  if (gameState.arenaRound === 0) {
    const highStr = gameState.arenaHighScore > 0 ? `（最高記録: ${gameState.arenaHighScore}連勝）` : "";
    scene.showMessage(`闘技場へようこそ！ 3連戦に挑戦だ！${highStr}`);
    scene.time.delayedCall(1500, () => {
      startArenaRound(scene, 1);
    });
  }
}

export function startArenaRound(scene, round) {
  const activeMon = gameState.getFirstAlive();
  if (!activeMon) {
    scene.showMessage("たたかえるモンスターが いない…闘技場チャレンジ終了！");
    gameState.arenaRound = 0;
    return;
  }

  gameState.arenaRound = round;
  audioManager.playEncounter();
  scene.showMessage(`闘技場 第${round}戦！`);

  scene.time.delayedCall(800, () => {
    const opponent = getArenaOpponent(round);
    gameState.markSeen(opponent.species.id);
    gameState.setBattle({
      player: activeMon,
      opponent,
      isBoss: false,
      isArena: true,
      arenaRound: round,
    });
    scene.cameras.main.fadeOut(300, 0, 0, 0);
    scene.cameras.main.once("camerafadeoutcomplete", () => {
      scene.scene.pause();
      scene.scene.launch("BattleScene", { from: "WorldScene" });
    });
  });
}

export function checkArenaProgress(scene) {
  if (!gameState.arenaRound || gameState.arenaRound <= 0) return;

  const round = gameState.arenaRound;
  if (!gameState.isPartyWiped()) {
    if (round >= 3) {
      gameState.arenaWins++;
      gameState.arenaHighScore = Math.max(gameState.arenaHighScore, gameState.arenaWins);
      const reward = 500 + round * 100;
      gameState.addMoney(reward);
      gameState.arenaRound = 0;
      const arenaDailyProgress = gameState.updateDailyChallengeProgress("ARENA_CLEAR", 1);
      let dailyBonusText = "";
      if (arenaDailyProgress.completedNow) {
        const rewardResult = gameState.claimDailyChallengeReward();
        if (rewardResult.success) {
          dailyBonusText = ` さらに日替わり達成で ${rewardResult.rewardMoney}G！🎯`;
        }
      }
      scene.showMessage(`闘技場3連戦クリア！ ${reward}Gを獲得！🏆${dailyBonusText}`);
      scene.createUi();
    } else {
      scene.showMessage(`第${round}戦 勝利！ 次の相手が待っているぞ…`);
      scene.time.delayedCall(1500, () => {
        startArenaRound(scene, round + 1);
      });
    }
  } else {
    gameState.arenaWins = 0;
    gameState.arenaRound = 0;
    scene.showMessage("闘技場チャレンジ失敗… また挑戦しよう！");
  }
}
