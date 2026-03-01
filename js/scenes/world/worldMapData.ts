import { gameState } from "../../state/gameState.ts";

export const TILE_SIZE = 32;

// タイルコード
export const T = {
  GROUND: 0,
  WALL: 1,
  GRASS: 2,
  DOOR: 3,
  FOREST: 4,
  WATER: 5,
  GYM: 6,
  PATH: 7,
  POISON: 8,      // 毒沼: 歩行すると微ダメージ
  TELEPORT: 9,    // テレポートパッド: 指定座標へワープ
  ICE_FLOOR: 10,  // 氷床: 滑って壁まで移動
  DARK: 11,       // 闇タイル: 視界制限（ELECTRICで解除）
  SAND: 12,       // 砂地: 移動速度低下・低確率エンカウント
};

// マップ定義（NPCはgetMapNpcs()で動的生成するためnpcsは省略）
export const MAPS = {
  EMOJI_TOWN: {
    name: "エモじタウン",
    width: 36,
    height: 28,
    layout: null,
    bgm: "field",
  },
  HOUSE1: {
    name: "おうち",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  LAB: {
    name: "エモじ研究所",
    width: 14,
    height: 10,
    layout: null,
    bgm: "field",
  },
  TOWN_SHOP: {
    name: "タウンショップ",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  FOREST: {
    name: "エモの森",
    width: 38,
    height: 28,
    layout: null,
    bgm: "field",
  },
  FOREST_GYM: {
    name: "森のジム",
    width: 14,
    height: 10,
    layout: null,
    bgm: "field",
  },
  CRYSTAL_CAVE: {
    name: "きらめき洞窟",
    width: 36,
    height: 26,
    layout: null,
    bgm: "field",
  },
  VOLCANIC_PASS: {
    name: "マグマ峠",
    width: 40,
    height: 30,
    layout: null,
    bgm: "field",
  },
  VOLCANO_SHOP: {
    name: "遠征補給所",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  SKY_RUINS: {
    name: "そらの遺跡",
    width: 42,
    height: 30,
    layout: null,
    bgm: "field",
  },
  DARK_TOWER: {
    name: "ダーク団アジト",
    width: 32,
    height: 26,
    layout: null,
    bgm: "field",
  },
  FROZEN_PEAK: {
    name: "氷峰",
    width: 38,
    height: 28,
    layout: null,
    bgm: "field",
  },
  FROZEN_GYM: {
    name: "氷峰ジム",
    width: 14,
    height: 10,
    layout: null,
    bgm: "field",
  },
  FROZEN_SHOP: {
    name: "氷峰補給所",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  CELESTIAL_GARDEN: {
    name: "天空の花園",
    width: 40,
    height: 28,
    layout: null,
    bgm: "field",
  },
  GARDEN_SHOP: {
    name: "天空ショップ",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  // ── 追加マップ ──
  MISTY_SWAMP: {
    name: "霧の湿地",
    width: 40,
    height: 30,
    layout: null,
    bgm: "field",
  },
  SWAMP_SHOP: {
    name: "湿地の小屋",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  CORAL_REEF: {
    name: "珊瑚の浜",
    width: 38,
    height: 28,
    layout: null,
    bgm: "field",
  },
  SAND_VALLEY: {
    name: "砂塵の谷",
    width: 42,
    height: 30,
    layout: null,
    bgm: "field",
  },
  SAND_VALLEY_SHOP: {
    name: "砂漠のオアシス",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
  SHADOW_GROVE: {
    name: "影の森",
    width: 36,
    height: 28,
    layout: null,
    bgm: "field",
  },
  ANCIENT_LIBRARY: {
    name: "古代図書館",
    width: 34,
    height: 26,
    layout: null,
    bgm: "field",
  },
  STARFALL_BASIN: {
    name: "星降り盆地",
    width: 44,
    height: 34,
    layout: null,
    bgm: "field",
  },
  BASIN_SHOP: {
    name: "星降り工房",
    width: 12,
    height: 10,
    layout: null,
    bgm: "field",
  },
};

/**
 * ストーリーフラグに応じてマップごとのNPCリストを返す（動的生成）
 * @param {string} mapKey
 * @returns {Array}
 */
export function getMapNpcs(mapKey) {
  const sf = gameState.storyFlags || {};

  // ── エモじタウン (36×28, SX=1.44, SY=1.40) ──
  if (mapKey === "EMOJI_TOWN") {
    const npcs = [
      { x: 17, y: 8, text: "スターライトを つれてきてね！", quest: "STARLITE", texture: "npc-quest" },
    ];
    if (!sf.prologueDone) {
      // プロローグ前: 町の人たちが研究所への道を案内
      npcs.push({ x: 6, y: 17, text: "ようこそ エモじタウンへ！ 北にある建物が 研究所だよ。", texture: "npc" });
      npcs.push({ x: 30, y: 7, text: "博士が きみを 待っているみたい。研究所のドアをくぐってみよう！", texture: "npc" });
      npcs.push({ x: 27, y: 14, text: null, texture: "npc-quest", story: "professor_town_hint" });
      // 母親NPC（家の前）
      npcs.push({ x: 10, y: 7, text: null, texture: "npc", story: "mom_before_lab" });
    } else if (!sf.townRivalBeaten) {
      // プロローグ後〜ライバル未撃破
      npcs.push({ x: 6, y: 17, text: "草むらをあるくと モンスターが出てくるぞ！ まずは近くで腕試しだ。", texture: "npc" });
      npcs.push({ x: 30, y: 7, text: "Pキーでセーブできるよ！ こまめにセーブするのが冒険のコツさ。", texture: "npc" });
      // チュートリアル助手NPC
      if (!sf.tutorialBattleDone) {
        npcs.push({ x: 14, y: 13, text: null, texture: "npc-quest", story: "tutorial_assistant_prebattle" });
      } else if (!sf.tutorialCatchDone) {
        npcs.push({ x: 14, y: 13, text: null, texture: "npc-quest", story: "tutorial_assistant_catch" });
      } else {
        npcs.push({ x: 14, y: 13, text: "もう大丈夫そうだね！ 冒険を楽しんで！ 何かあったらメニューの『ガイド』を見てね。", texture: "npc" });
      }
      // 母親NPC（家の前）
      if (!sf.momFarewellDone) {
        npcs.push({ x: 10, y: 7, text: null, texture: "npc", story: "mom_farewell" });
      } else {
        npcs.push({ x: 10, y: 7, text: "気をつけてね！ いつでも帰ってきていいんだよ。", texture: "npc" });
      }
      npcs.push({ x: 16, y: 15, text: "東の森に行く前に、草むらで少し練習するといいよ！", texture: "npc" });
      if (sf.starterChosen && !sf.townRivalBeaten) {
        if (!sf.rivalIntroDone) {
          // 初対面: ストーリーイベントでまず自己紹介、そのあとバトル
          npcs.push({ x: 12, y: 11, text: null, texture: "npc-quest", story: "rival_first_meet", rivalBattle: "town", trainerName: "ライバル レン", rivalLevel: 7 });
        } else {
          // 2回目以降: 直接バトル
          npcs.push({ x: 12, y: 11, text: "もう1回やろうぜ！ 今度こそ負けないぞ！", texture: "npc-quest", rivalBattle: "town", trainerName: "ライバル レン", rivalLevel: 7 });
        }
      }
    } else {
      npcs.push({ x: 6, y: 17, text: "レンに勝ったんだって？ すごいな！ 森に行く準備はできているかい？", texture: "npc" });
      npcs.push({ x: 30, y: 7, text: "Pキーでセーブできるよ！ 森に行く前にセーブしておこう。", texture: "npc" });
      npcs.push({ x: 16, y: 15, text: "東の森には クリスタルの気配があるらしい。探してみよう！", texture: "npc" });
      npcs.push({ x: 10, y: 7, text: "がんばってるね！ 疲れたら おうちで休んでいってね。", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "HOUSE1") {
    const npcs = [];
    if (!sf.prologueDone) {
      npcs.push({ x: 6, y: 5, text: "おかえり！ 博士が研究所で待っているみたい。行ってきなさい！", heal: true, texture: "npc-heal" });
    } else {
      npcs.push({ x: 6, y: 5, text: "おかえり！ ゆっくり休んでね。ここに泊まるとHPが全回復するよ。", heal: true, texture: "npc-heal" });
    }
    return npcs;
  }

  if (mapKey === "LAB") {
    const npcs = [];
    if (!sf.prologueDone) {
      npcs.push({ x: 7, y: 2, text: null, story: "professor_prologue", texture: "npc-quest" });
      // スターター台座NPC（それぞれ個性的な待機テキスト付き）
      npcs.push({ x: 3, y: 5, text: "🧸 ちいさな炎が ゆらめいている… エムベアが こちらを見ている。", story: "starter_embear", texture: "npc" });
      npcs.push({ x: 7, y: 5, text: "🐟 みずの泡が ぷくぷくと… フィンバブが のんびりしている。", story: "starter_finbub", texture: "npc" });
      npcs.push({ x: 11, y: 5, text: "🌿 葉っぱが さらさらと… ソーンバインが 静かに佇んでいる。", story: "starter_thornvine", texture: "npc" });
      // 助手NPC
      npcs.push({ x: 10, y: 2, text: "わたしは助手のアユム。博士の話をしっかり聞いてね！ きっと大事な頼みごとがあるよ。", texture: "npc" });
    } else {
      npcs.push({ x: 7, y: 2, text: `旅の調子はどうだい、${gameState.playerName}？ クリスタルをすべて守れば 伝説のモンスターが目覚めると言われているよ。`, texture: "npc-quest" });
      npcs.push({ x: 10, y: 2, text: "冒険のコツ: タイプ相性を覚えると バトルが楽になるよ！ ほのお→くさ、みず→ほのお、くさ→みずだよ。", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "TOWN_SHOP") {
    return [
      { x: 6, y: 4, text: "いらっしゃいませ！ 旅に役立つ道具をそろえているよ。", shop: true, texture: "npc-shop" },
    ];
  }

  if (mapKey === "FOREST_GYM") {
    return [
      { x: 7, y: 3, text: "ようこそ森のジムへ！ 草の試練を受ける覚悟はできた？", gymLeader: true, texture: "npc-quest" },
    ];
  }

  if (mapKey === "VOLCANO_SHOP") {
    return [
      { x: 6, y: 4, text: "火山遠征の前に補給していきな！", shop: true, texture: "npc-shop" },
    ];
  }

  if (mapKey === "FROZEN_GYM") {
    return [
      { x: 7, y: 3, text: "ようこそ氷峰ジムへ。凍てつく戦いで実力を示してみせて！", gymLeader: true, texture: "npc-quest" },
    ];
  }

  if (mapKey === "FROZEN_SHOP") {
    return [
      { x: 6, y: 4, text: "吹雪の山に備えるなら、ここで整えていって。", shop: true, texture: "npc-shop" },
    ];
  }

  if (mapKey === "GARDEN_SHOP") {
    return [
      { x: 6, y: 4, text: "天空限定の品もあるよ。見ていって！", shop: true, texture: "npc-shop" },
    ];
  }

  // ── 森 (38×28, SX=1.52, SY=1.40) ──
  if (mapKey === "FOREST") {
    const npcs = [
      { x: 17, y: 6, text: "この森には 珍しいモンスターがいるらしい… 奥に進むほど強いのが出るぞ。", texture: "npc" },
      { x: 5, y: 4, text: null, texture: "npc-quest", story: "forest_tablet_1" },
    ];
    if (!sf.forestScoutBeaten) {
      npcs.push({ x: 9, y: 8, text: null, texture: "npc-quest", rivalBattle: "forest_scout", trainerName: "レンジャー ミナト", rivalLevel: 14, preBattleText: "ミナト: 森の中は危険がいっぱいだ！ レンジャーの俺に実力を見せてみな！" });
    } else {
      npcs.push({ x: 9, y: 8, text: "森の動きが見えてきたな。次は洞窟で試されるぞ。", texture: "npc" });
    }
    if (!sf.forestCrystalFound) {
      npcs.push({ x: 21, y: 4, text: "待て！ここから先にはクリスタルがある。力で守護者を倒してみせろ！", texture: "npc-quest", story: "forest_guardian", rivalBattle: "forest_guardian", trainerName: "森の守護者", rivalLevel: 14 });
    } else if (!sf.forestRivalBeaten) {
      npcs.push({ x: 21, y: 4, text: "クリスタル…守護者に認められたか。さすがだ！", texture: "npc" });
      npcs.push({ x: 27, y: 11, text: "クリスタルを見つけたの！？ ずるいぞ！ おれとも戦え！", texture: "npc-quest", rivalBattle: "forest_rival", trainerName: "ライバル レン", rivalLevel: 16 });
    } else {
      npcs.push({ x: 21, y: 4, text: "クリスタルの力がこの森を守っている。洞窟にも向かってみよう！", texture: "npc" });
      npcs.push({ x: 27, y: 11, text: "くっ…やるじゃないか。洞窟で待ってるぞ！", texture: "npc" });
    }
    return npcs;
  }

  // ── クリスタル洞窟 (36×26, SX=1.44, SY=1.30) ──
  if (mapKey === "CRYSTAL_CAVE") {
    const npcs = [
      { x: 17, y: 21, text: "ひかる床では 強いモンスターが出やすいみたい。", texture: "npc" },
      { x: 7, y: 7, text: "闘技場へようこそ！ 3連戦に勝てば豪華報酬だ！", arena: true, texture: "npc-shop" },
      { x: 26, y: 20, text: null, texture: "npc-quest", story: "cave_memory_1" },
    ];
    if (!sf.caveScholarBeaten) {
      npcs.push({ x: 10, y: 18, text: "洞窟では一手のミスが命取りだ。戦術演習を始めよう。", texture: "npc-quest", rivalBattle: "cave_scholar", trainerName: "戦術家 シオン", rivalLevel: 24 });
    } else {
      npcs.push({ x: 10, y: 18, text: "よし、戦術理解は合格だ。次の試練へ進め。", texture: "npc" });
    }
    if (!sf.caveEvilBeaten) {
      npcs.push({ x: 29, y: 7, text: "フフフ…ダーク団の幹部シャドウだ。クリスタルは渡さん！", texture: "npc-quest", rivalBattle: "cave_evil", trainerName: "ダーク団幹部 シャドウ", rivalLevel: 21, isEvil: true });
    } else if (!sf.caveRivalBeaten3) {
      npcs.push({ x: 29, y: 7, text: "…クリスタルは守られた。しかしボス・ライオットが待っているぞ。", texture: "npc" });
      npcs.push({ x: 22, y: 13, text: "ここまで来たか！ 3度目の勝負だ！ 行くぞ！", texture: "npc-quest", rivalBattle: "cave_rival3", trainerName: "ライバル レン", rivalLevel: 23 });
    } else {
      npcs.push({ x: 29, y: 7, text: "…次はダーク団アジトへ向かえ。北の出口から行ける。", texture: "npc" });
      npcs.push({ x: 22, y: 13, text: "おれも強くなったぞ。先に進め！", texture: "npc" });
    }
    return npcs;
  }

  // ── 火山道 (40×30, SX=1.43, SY=1.36) ──
  if (mapKey === "VOLCANIC_PASS") {
    const npcs = [
      { x: 9, y: 24, text: "ここから先は高レベル地帯だ。ボールを多めに持っていけ！", texture: "npc" },
      { x: 14, y: 8, text: null, texture: "npc-quest", story: "volcano_memory_1" },
    ];
    if (!sf.volcanicScoutBeaten) {
      npcs.push({ x: 36, y: 14, text: "斥候任務中だ。ここを抜ける実力、見せてみな！", texture: "npc-quest", rivalBattle: "volcanic_scout", trainerName: "火山斥候 ガロ", rivalLevel: 33 });
    } else {
      npcs.push({ x: 36, y: 14, text: "この熱気で立ち回れるなら、氷峰でも通用するはずだ。", texture: "npc" });
    }
    if (!sf.volcanoEvilBossBeaten) {
      npcs.push({ x: 29, y: 10, text: "ハハハ！ ダーク団のボス、ライオットだ！ エテルナの力はオレのものだ！", texture: "npc-quest", rivalBattle: "volcano_boss", trainerName: "ダーク団ボス ライオット", rivalLevel: 30, isEvil: true, isBossTrainer: true });
    } else {
      npcs.push({ x: 29, y: 10, text: "…貴様め。遺跡のエテルナが目覚める前に止めてみせるか？", texture: "npc" });
    }
    return npcs;
  }

  // ── 天空遺跡 (42×30, SX=1.40, SY=1.36) ──
  if (mapKey === "SKY_RUINS") {
    const npcs = [
      { x: 11, y: 7, text: "遺跡に刻まれた伝説によると…かつて世界を救ったエモじは、今もここで眠っている。", texture: "npc-quest", story: "ruins_elder" },
      { x: 28, y: 5, text: null, texture: "npc-quest", story: "ruins_memory_2" },
    ];
    if (!sf.ruinsGuardianBeaten) {
      npcs.push({ x: 8, y: 19, text: "最後の間へ進む者には、遺跡の掟を示してもらう。受けよ！", texture: "npc-quest", rivalBattle: "ruins_guardian", trainerName: "遺跡の守人 ラカ", rivalLevel: 39, isBossTrainer: true });
    } else {
      npcs.push({ x: 8, y: 19, text: "掟は示された。最奥への扉はきみに開かれた。", texture: "npc" });
    }
    if (!sf.ruinsFinalDone) {
      npcs.push({ x: 20, y: 14, text: "ここが終点だ！ 最後のクリスタルはオレが奪う！ 覚悟しろ！", texture: "npc-quest", rivalBattle: "ruins_final", trainerName: "ダーク団ボス ライオット", rivalLevel: 38, isEvil: true, isBossTrainer: true, isFinalBoss: true });
    } else {
      npcs.push({ x: 20, y: 14, text: "伝説のエモじが守護者に認めた…すごい！", texture: "npc" });
    }
    npcs.push({ x: 34, y: 22, text: "風が強い日は先制技が勝負を分けるぞ。", texture: "npc" });
    return npcs;
  }

  // ── ダークタワー (32×26, SX=1.45, SY=1.44) ──
  if (mapKey === "DARK_TOWER") {
    const npcs = [
      { x: 7, y: 20, text: "ここはダーク団のアジトだ…！ 引き返したほうがいい！", texture: "npc" },
      { x: 23, y: 20, text: "闇の中でも光を探せ…それがトレーナーってもんだろ。", texture: "npc" },
    ];
    if (!sf.darkTowerSentinelBeaten) {
      npcs.push({ x: 26, y: 7, text: "ここを通るなら番兵戦だ。準備はできてるな？", texture: "npc-quest", rivalBattle: "dark_sentinel", trainerName: "塔の番兵 ノクト", rivalLevel: 29, isEvil: true });
    } else {
      npcs.push({ x: 26, y: 7, text: "…よく通ったな。闇の奥で油断するなよ。", texture: "npc" });
    }
    if (!sf.darkTowerGruntBeaten) {
      npcs.push({ x: 16, y: 13, text: "おい！部外者だ！ ダーク団したっぱの力を見せてやる！", texture: "npc-quest", rivalBattle: "dark_grunt", trainerName: "ダーク団したっぱ", rivalLevel: 22, isEvil: true });
    } else if (!sf.darkTowerVoidBeaten) {
      npcs.push({ x: 16, y: 13, text: "…負けたがボスは奥にいるぞ。", texture: "npc" });
      npcs.push({ x: 16, y: 6, text: "フフフ…幹部ヴォイドの闇の力を味わえ！ クリスタルは頂く！", texture: "npc-quest", rivalBattle: "dark_tower_void", trainerName: "ダーク団幹部 ヴォイド", rivalLevel: 26, isEvil: true, isBossTrainer: true });
    } else {
      npcs.push({ x: 16, y: 6, text: "くそっ…クリスタルは奪えなかった。ライオットに報告しなければ…", texture: "npc" });
    }
    return npcs;
  }

  // ── 氷峰 (38×28, SX=1.46, SY=1.40) ──
  if (mapKey === "FROZEN_PEAK") {
    const npcs = [
      { x: 9, y: 22, text: "この山は一年中雪が降っている。氷タイプが多いぞ。", texture: "npc" },
      { x: 32, y: 7, text: null, texture: "npc-quest", story: "frozen_memory_1" },
    ];
    if (!sf.frozenSageBeaten) {
      npcs.push({ x: 13, y: 8, text: "吹雪で勝つには判断力が要る。山の試験を受けるかい？", texture: "npc-quest", rivalBattle: "frozen_sage", trainerName: "氷峰の賢者 セツナ", rivalLevel: 36, isBossTrainer: true });
    } else {
      npcs.push({ x: 13, y: 8, text: "判断は鋭い。遺跡の最終局面でも迷うな。", texture: "npc" });
    }
    if (!sf.frozenPeakGymCleared) {
      npcs.push({ x: 19, y: 4, text: "ジムは建物の中だ。氷峰ジムで挑戦を待っている。", texture: "npc" });
    } else if (!sf.frozenPeakRivalBeaten) {
      npcs.push({ x: 19, y: 4, text: "見事だ。ジムバッジ2つ目…キミの実力は本物だ。", texture: "npc" });
      npcs.push({ x: 26, y: 11, text: "ジムクリアしたって？ でもおれには勝てないぜ！", texture: "npc-quest", rivalBattle: "frozen_rival", trainerName: "ライバル レン", rivalLevel: 34 });
    } else {
      npcs.push({ x: 19, y: 4, text: "いつでも再挑戦を待っているよ。", texture: "npc" });
      npcs.push({ x: 26, y: 11, text: "…まいった。遺跡で最終決戦だな。先に行くぞ！", texture: "npc" });
    }
    // こおりタイプクエスト
    if (!sf.frozenPeakIceQuest) {
      npcs.push({ x: 4, y: 7, text: "こおりタイプのモンスターを見せてくれないか？ お礼に ハイパーボールをあげるよ！", quest: "ICE_TYPE", texture: "npc-quest" });
    } else {
      npcs.push({ x: 4, y: 7, text: "ありがとう！ こおりタイプは美しいね。", texture: "npc" });
    }
    return npcs;
  }

  // ── 天空の花園 (40×28, SX=1.43, SY=1.40) ──
  if (mapKey === "CELESTIAL_GARDEN") {
    const npcs = [
      { x: 20, y: 22, text: "ここは天空の花園…クリスタルの力で生まれた楽園だ。", texture: "npc" },
      { x: 9, y: 8, text: "伝説のモンスターの気配がする…奥に進んでみては？", texture: "npc-quest" },
      { x: 31, y: 17, text: "ここのモンスターは強い。最強を目指す者だけが来る場所だ。", texture: "npc" },
      { x: 6, y: 21, text: null, story: "garden_epilogue", texture: "npc-quest" },
    ];
    if (!sf.legendaryDefeated) {
      npcs.push({ x: 20, y: 4, text: null, story: "garden_legendary", texture: "npc-quest" });
    } else {
      npcs.push({ x: 20, y: 4, text: "伝説のエモじが認めし勇者よ…また会おう。", texture: "npc" });
    }
    // 最強トレーナー（クリア後チャレンジ）
    if (sf.ruinsFinalDone) {
      npcs.push({ x: 29, y: 7, text: "世界を救った英雄に挑戦させてくれ！ 最強のトレーナーバトルだ！", texture: "npc-quest", rivalBattle: "garden_champion", trainerName: "チャンピオン アキラ", rivalLevel: 45, isBossTrainer: true });
    }
    return npcs;
  }

  // ── 霧の湿地 (40×30, SX=1.43, SY=1.36) ──
  if (mapKey === "MISTY_SWAMP") {
    const npcs = [
      { x: 20, y: 24, text: "この湿地は毒の霧が立ち込めている… 紫のタイルに注意だ。", texture: "npc" },
      { x: 7, y: 11, text: null, texture: "npc-quest", story: "swamp_tablet_1" },
      { x: 29, y: 5, text: "珊瑚の浜への道は 東にある。みずタイプが多い場所だぞ。", texture: "npc" },
    ];
    if (!sf.swampRangerBeaten) {
      npcs.push({ x: 14, y: 14, text: "湿地の毒に耐えられるか？ レンジャーの試験だ！", texture: "npc-quest", rivalBattle: "swamp_ranger", trainerName: "湿地レンジャー カスミ", rivalLevel: 11 });
    } else {
      npcs.push({ x: 14, y: 14, text: "毒沼を超えた先に 珍しいモンスターがいるぞ。", texture: "npc" });
    }
    if (!sf.swampEvilBeaten) {
      npcs.push({ x: 31, y: 11, text: "ダーク団のしたっぱだ！ ここの霧に紛れて調査中さ！", texture: "npc-quest", rivalBattle: "swamp_evil", trainerName: "ダーク団したっぱ", rivalLevel: 12, isEvil: true });
    } else {
      npcs.push({ x: 31, y: 11, text: "…ここはもう用済みだ。", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "SWAMP_SHOP") {
    return [
      { x: 6, y: 4, text: "霧でも商売は続けるよ！ 解毒剤もあるからね。", shop: true, texture: "npc-shop" },
    ];
  }

  // ── 珊瑚の浜 (38×28, SX=1.46, SY=1.40) ──
  if (mapKey === "CORAL_REEF") {
    const npcs = [
      { x: 19, y: 22, text: "この浜は珊瑚と海に囲まれた楽園だ。みずタイプの宝庫だよ。", texture: "npc" },
      { x: 9, y: 4, text: null, texture: "npc-quest", story: "coral_legend_1" },
      { x: 29, y: 14, text: "みずタイプがいれば 浅瀬を渡って隠しアイテムが見つかるかも。", texture: "npc" },
    ];
    if (!sf.coralDiverBeaten) {
      npcs.push({ x: 26, y: 7, text: "海の強者に挑戦だ！ 波乗りバトルいくぞ！", texture: "npc-quest", rivalBattle: "coral_diver", trainerName: "海洋ダイバー ウミト", rivalLevel: 14 });
    } else {
      npcs.push({ x: 26, y: 7, text: "素晴らしい！ 海の仲間を大切にしてくれ。", texture: "npc" });
    }
    // 珊瑚クエスト: みずタイプを3体以上パーティに
    if (!sf.coralWaterQuest) {
      npcs.push({ x: 6, y: 17, text: "みずタイプのモンスターを3体連れてきてくれないか？ 海底の宝物をお礼にあげるよ！", quest: "WATER_TRIO", texture: "npc-quest" });
    } else {
      npcs.push({ x: 6, y: 17, text: "海の仲間が いっぱいだね！ すばらしい！", texture: "npc" });
    }
    return npcs;
  }

  // ── 砂塵の谷 (42×30, SX=1.40, SY=1.36) ──
  if (mapKey === "SAND_VALLEY") {
    const npcs = [
      { x: 21, y: 24, text: "砂嵐で視界が悪い… 砂地では歩きにくいから注意してくれ。", texture: "npc" },
      { x: 11, y: 7, text: null, texture: "npc-quest", story: "desert_obelisk_1" },
      { x: 31, y: 16, text: "オアシスの小屋で補給できるぞ。砂漠の真ん中にある。", texture: "npc" },
    ];
    if (!sf.desertNomadBeaten) {
      npcs.push({ x: 28, y: 8, text: "砂漠を渡る者よ！ 砂の民の試練を受けよ！", texture: "npc-quest", rivalBattle: "desert_nomad", trainerName: "砂漠の遊牧民 サハラ", rivalLevel: 30, isBossTrainer: true });
    } else {
      npcs.push({ x: 28, y: 8, text: "砂漠を越える力がある。氷峰でも生き延びられるだろう。", texture: "npc" });
    }
    if (!sf.desertRivalBeaten) {
      npcs.push({ x: 20, y: 14, text: "砂漠でも追いかけてきたぞ！ おれはどこでも戦うからな！", texture: "npc-quest", rivalBattle: "desert_rival", trainerName: "ライバル レン", rivalLevel: 28 });
    } else {
      npcs.push({ x: 20, y: 14, text: "くっ…砂漠でも負けた！ でもまだまだ終わらないからな！", texture: "npc" });
    }
    // 闘技場（砂漠版）
    npcs.push({ x: 7, y: 19, text: "砂塵闘技場へようこそ！ 灼熱の3連戦だ！", arena: true, texture: "npc-shop" });
    return npcs;
  }

  if (mapKey === "SAND_VALLEY_SHOP") {
    return [
      { x: 6, y: 4, text: "オアシスにようこそ！ 砂漠の必需品を揃えております。", shop: true, texture: "npc-shop" },
    ];
  }

  // ── 影の森 (36×28, SX=1.50, SY=1.40) ──
  if (mapKey === "SHADOW_GROVE") {
    const npcs = [
      { x: 8, y: 22, text: "ここはダーク団が実験に使っていた森… 闇に覆われている。", texture: "npc" },
      { x: 27, y: 4, text: null, texture: "npc-quest", story: "shadow_memory_1" },
    ];
    if (!sf.shadowBeastBeaten) {
      npcs.push({ x: 18, y: 11, text: "闇に潜む番獣だ…！ 光の力で倒してみせろ！", texture: "npc-quest", rivalBattle: "shadow_beast", trainerName: "闇の番獣使い イブキ", rivalLevel: 25, isEvil: true, isBossTrainer: true });
    } else {
      npcs.push({ x: 18, y: 11, text: "闇は晴れた…この森にも光が戻りつつある。", texture: "npc" });
    }
    if (!sf.shadowLabFound) {
      npcs.push({ x: 29, y: 14, text: "ここにダーク団の実験記録が…！ なんて恐ろしいことを…", texture: "npc-quest", story: "shadow_lab_discovery" });
    } else {
      npcs.push({ x: 29, y: 14, text: "実験記録は確保した。これで悪事の証拠になる。", texture: "npc" });
    }
    return npcs;
  }

  // ── 古代図書館 (34×26, SX=1.55, SY=1.44) ──
  if (mapKey === "ANCIENT_LIBRARY") {
    const npcs = [
      { x: 8, y: 20, text: "この図書館には 太古の知識が眠っている。テレポートパッドを使って奥へ進もう。", texture: "npc" },
      { x: 25, y: 4, text: null, texture: "npc-quest", story: "library_codex_1" },
    ];
    if (!sf.libraryScholarBeaten) {
      npcs.push({ x: 17, y: 7, text: "図書館の知恵を試す！ 古代の賢者の試練だ！", texture: "npc-quest", rivalBattle: "library_scholar", trainerName: "古代の賢者 コデクス", rivalLevel: 35, isBossTrainer: true });
    } else {
      npcs.push({ x: 17, y: 7, text: "試練は終わった。歴史を紡ぐのはきみだ。", texture: "npc" });
    }
    if (!sf.libraryPuzzleSolved) {
      npcs.push({ x: 12, y: 13, text: "テレポートパッドを正しい順序で踏めば、奥の部屋への道が開く…", texture: "npc-quest", story: "library_puzzle_hint" });
    } else {
      npcs.push({ x: 12, y: 13, text: "パズルの解法を記憶したよ。先に進んで。", texture: "npc" });
    }
    return npcs;
  }

  // ── 星降り盆地 (44×34, SX=1.47, SY=1.42) ──
  if (mapKey === "STARFALL_BASIN") {
    const npcs = [
      { x: 22, y: 28, text: "ここは星の光が降り注ぐ 伝説の盆地… 最強のトレーナーたちが集う場所だ。", texture: "npc" },
      { x: 12, y: 7, text: null, texture: "npc-quest", story: "basin_starfall_lore" },
      { x: 32, y: 11, text: "星降りの工房では レアなアイテムが手に入るぞ。", texture: "npc" },
    ];
    // ポストゲーム四天王チャレンジ
    if (sf.ruinsFinalDone) {
      if (!sf.eliteFourWind) {
        npcs.push({ x: 9, y: 11, text: "四天王の一人、風のハヤテだ！ 風速バトルに挑め！", texture: "npc-quest", rivalBattle: "elite_wind", trainerName: "四天王 ハヤテ", rivalLevel: 42, isBossTrainer: true });
      } else {
        npcs.push({ x: 9, y: 11, text: "ハヤテ: 風を超えたか…次は炎だ。", texture: "npc" });
      }
      if (!sf.eliteFourFlame) {
        npcs.push({ x: 35, y: 11, text: "四天王の一人、炎のカグラだ！ 灼熱の中で勝てるか？", texture: "npc-quest", rivalBattle: "elite_flame", trainerName: "四天王 カグラ", rivalLevel: 44, isBossTrainer: true });
      } else {
        npcs.push({ x: 35, y: 11, text: "カグラ: 炎をも超えた…すごいな。", texture: "npc" });
      }
      if (!sf.eliteFourTide) {
        npcs.push({ x: 9, y: 23, text: "四天王の一人、潮のミナモだ！ 深海の戦術を見よ！", texture: "npc-quest", rivalBattle: "elite_tide", trainerName: "四天王 ミナモ", rivalLevel: 46, isBossTrainer: true });
      } else {
        npcs.push({ x: 9, y: 23, text: "ミナモ: 潮流を読み切ったとは…やるね。", texture: "npc" });
      }
      if (!sf.eliteFourFrost) {
        npcs.push({ x: 35, y: 23, text: "四天王の一人、氷のヒョウガだ！ 凍てつく決意を見せろ！", texture: "npc-quest", rivalBattle: "elite_frost", trainerName: "四天王 ヒョウガ", rivalLevel: 48, isBossTrainer: true });
      } else {
        npcs.push({ x: 35, y: 23, text: "ヒョウガ: 氷を貫いた…真のマスターよ。", texture: "npc" });
      }
      // 最終ライバル戦（四天王全撃破後）
      if (sf.eliteFourWind && sf.eliteFourFlame && sf.eliteFourTide && sf.eliteFourFrost && !sf.basinFinalRival) {
        npcs.push({ x: 22, y: 6, text: "ここで決着をつけようぜ！ おれとの最終決戦だ！！", texture: "npc-quest", rivalBattle: "basin_final_rival", trainerName: "ライバル レン", rivalLevel: 50, isBossTrainer: true });
      } else if (sf.basinFinalRival) {
        npcs.push({ x: 22, y: 6, text: "レン: …完敗だ。きみが 真のエモじマスターだよ。", texture: "npc" });
      }
    }
    return npcs;
  }

  if (mapKey === "BASIN_SHOP") {
    return [
      { x: 6, y: 4, text: "流れ星が落ちた素材で作ったアイテムだよ。見ていって！", shop: true, texture: "npc-shop" },
    ];
  }

  return [];
}

/** マップレイアウト生成 */
export function createMapLayout(mapKey) {
  const mapDef = MAPS[mapKey];
  if (!mapDef) return createMapLayout("EMOJI_TOWN");
  if (mapDef.layout) return mapDef.layout;

  const W = mapDef.width;
  const H = mapDef.height;
  const map = [];

  if (mapKey === "EMOJI_TOWN") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }

    // メイン通路（スケール: 25×20→36×28）
    for (let x = 1; x < W - 1; x++) map[10][x] = T.PATH;
    for (let y = 1; y < H - 1; y++) map[y][14] = T.PATH;
    // 草むら
    for (let y = 15; y <= 24; y++) {
      for (let x = 3; x <= 12; x++) map[y][x] = T.GRASS;
    }
    // 池
    map[20][22] = T.WATER;
    map[20][23] = T.WATER;
    map[21][22] = T.WATER;
    map[21][23] = T.WATER;

    // おうち
    for (let x = 4; x <= 12; x++) map[3][x] = T.WALL;
    for (let x = 4; x <= 12; x++) map[4][x] = T.WALL;
    for (let x = 4; x <= 12; x++) map[5][x] = T.WALL;
    for (let x = 4; x <= 12; x++) map[6][x] = T.WALL;
    map[6][9] = T.DOOR;

    // ショップ
    for (let x = 17; x <= 24; x++) map[3][x] = T.WALL;
    for (let x = 17; x <= 24; x++) map[4][x] = T.WALL;
    for (let x = 17; x <= 24; x++) map[5][x] = T.WALL;
    for (let x = 17; x <= 24; x++) map[6][x] = T.WALL;
    map[6][20] = T.DOOR;

    // 研究所
    for (let x = 26; x <= 33; x++) map[1][x] = T.WALL;
    for (let x = 26; x <= 33; x++) map[2][x] = T.WALL;
    for (let x = 26; x <= 33; x++) map[3][x] = T.WALL;
    for (let x = 26; x <= 33; x++) map[4][x] = T.WALL;
    for (let x = 26; x <= 33; x++) map[5][x] = T.WALL;
    for (let x = 26; x <= 33; x++) map[6][x] = T.WALL;
    map[6][29] = T.DOOR;

    // 広場
    for (let y = 11; y <= 14; y++) {
      for (let x = 12; x <= 17; x++) map[y][x] = T.PATH;
    }

    // 仕切り壁
    for (let y = 15; y <= 24; y++) map[y][13] = T.WALL;
    map[18][13] = T.GROUND;

    map[10][W - 1] = T.DOOR;

    mapDef.layout = map;
    return map;
  }

  if (mapKey === "HOUSE1") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        row.push(y === 0 || y === H - 1 || x === 0 || x === W - 1 ? T.WALL : T.GROUND);
      }
      map.push(row);
    }
    map[H - 2][Math.floor(W / 2)] = T.DOOR;
    map[2][3] = T.WALL;
    map[2][4] = T.WALL;
    mapDef.layout = map;
    return map;
  }

  if (mapKey === "TOWN_SHOP" || mapKey === "VOLCANO_SHOP" || mapKey === "FROZEN_SHOP" || mapKey === "GARDEN_SHOP") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        row.push(y === 0 || y === H - 1 || x === 0 || x === W - 1 ? T.WALL : T.GROUND);
      }
      map.push(row);
    }
    const centerX = Math.floor(W / 2);
    map[H - 2][centerX] = T.DOOR;
    for (let x = 2; x <= W - 3; x++) map[2][x] = T.WALL;
    map[4][centerX] = T.PATH;
    map[5][centerX] = T.PATH;
    for (let x = centerX - 2; x <= centerX + 2; x++) map[6][x] = T.PATH;
    mapDef.layout = map;
    return map;
  }

  if (mapKey === "FOREST_GYM" || mapKey === "FROZEN_GYM") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        row.push(y === 0 || y === H - 1 || x === 0 || x === W - 1 ? T.WALL : T.GROUND);
      }
      map.push(row);
    }
    const centerX = Math.floor(W / 2);
    map[H - 2][centerX] = T.DOOR;
    for (let y = 2; y <= H - 3; y++) map[y][centerX] = T.PATH;
    for (let x = 3; x <= W - 4; x++) map[2][x] = T.WALL;
    map[3][centerX - 1] = T.WALL;
    map[3][centerX + 1] = T.WALL;
    map[4][centerX - 2] = T.WALL;
    map[4][centerX + 2] = T.WALL;
    mapDef.layout = map;
    return map;
  }

  if (mapKey === "LAB") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        row.push(y === 0 || y === H - 1 || x === 0 || x === W - 1 ? T.WALL : T.GROUND);
      }
      map.push(row);
    }
    map[H - 2][Math.floor(W / 2)] = T.DOOR;
    map[2][2] = T.WALL; map[2][3] = T.WALL; map[2][4] = T.WALL;
    map[2][9] = T.WALL; map[2][10] = T.WALL; map[2][11] = T.WALL;
    map[5][3] = T.PATH;
    map[5][7] = T.PATH;
    map[5][11] = T.PATH;
    map[4][5] = T.WALL; map[4][6] = T.WALL;
    map[4][8] = T.WALL; map[4][9] = T.WALL;
    mapDef.layout = map;
    return map;
  }

  if (mapKey === "FOREST") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.FOREST);
        }
      }
      map.push(row);
    }
    // 通路（スケール: 25×20→38×28）
    for (let x = 1; x < W - 1; x++) map[H - 4][x] = T.PATH;
    for (let x = 1; x < W - 1; x++) map[H - 5][x] = T.PATH;
    for (let y = 4; y < H - 5; y++) map[y][18] = T.PATH;
    for (let y = 4; y < H - 5; y++) map[y][20] = T.PATH;
    // 草むら（左）
    for (let y = 4; y <= 11; y++) {
      for (let x = 3; x <= 12; x++) map[y][x] = T.GRASS;
    }
    // 草むら（右）
    for (let y = 7; y <= 17; y++) {
      for (let x = 24; x <= 33; x++) map[y][x] = T.GRASS;
    }
    // 水
    for (let y = 14; y <= 18; y++) {
      for (let x = 5; x <= 11; x++) map[y][x] = T.WATER;
    }
    map[H - 2][1] = T.DOOR;
    map[1][18] = T.DOOR;
    // ジム建物
    for (let x = 27; x <= 33; x++) map[3][x] = T.WALL;
    for (let x = 27; x <= 33; x++) map[4][x] = T.WALL;
    map[4][30] = T.DOOR;

    mapDef.layout = map;
    return map;
  }

  if (mapKey === "CRYSTAL_CAVE") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.PATH);
        }
      }
      map.push(row);
    }

    // 通路（スケール: 25×20→36×26）
    for (let y = 1; y < H - 1; y++) {
      map[y][17] = T.PATH;
      map[y][19] = T.PATH;
    }

    // 壁の障害物
    for (let x = 4; x <= 12; x++) map[5][x] = T.WALL;
    for (let x = 23; x <= 30; x++) map[8][x] = T.WALL;
    for (let y = 12; y <= 17; y++) map[y][7] = T.WALL;
    for (let y = 12; y <= 17; y++) map[y][27] = T.WALL;

    // 水場
    for (let y = 16; y <= 20; y++) {
      for (let x = 12; x <= 14; x++) map[y][x] = T.WATER;
    }

    // 森エリア
    for (let y = 4; y <= 10; y++) {
      for (let x = 3; x <= 14; x++) map[y][x] = T.FOREST;
    }
    for (let y = 7; y <= 14; y++) {
      for (let x = 22; x <= 32; x++) map[y][x] = T.FOREST;
    }
    for (let y = 18; y <= 22; y++) {
      for (let x = 23; x <= 32; x++) map[y][x] = T.FOREST;
    }

    map[H - 2][17] = T.DOOR;
    map[1][29] = T.DOOR;
    // ダーク団アジトへの入口（西側）
    map[13][1] = T.DOOR;

    mapDef.layout = map;
    return map;
  }

  if (mapKey === "VOLCANIC_PASS") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.PATH);
        }
      }
      map.push(row);
    }

    // 溶岩（スケール: 28×22→40×30）
    for (let y = 5; y <= 12; y++) {
      for (let x = 6; x <= 14; x++) map[y][x] = T.WATER;
    }
    for (let y = 16; y <= 22; y++) {
      for (let x = 26; x <= 36; x++) map[y][x] = T.WATER;
    }

    // 森エリア
    for (let y = 4; y <= 14; y++) {
      for (let x = 19; x <= 33; x++) map[y][x] = T.FOREST;
    }
    for (let y = 18; y <= 26; y++) {
      for (let x = 3; x <= 16; x++) map[y][x] = T.FOREST;
    }

    // メイン通路
    for (let x = 3; x <= 37; x++) map[24][x] = T.PATH;
    for (let y = 3; y <= 24; y++) map[y][20] = T.PATH;

    // 壁の障害物
    for (let x = 16; x <= 23; x++) map[8][x] = T.WALL;
    for (let y = 11; y <= 19; y++) map[y][31] = T.WALL;

    // 補給所建物
    for (let x = 17; x <= 23; x++) map[14][x] = T.WALL;
    for (let x = 17; x <= 23; x++) map[15][x] = T.WALL;
    map[15][20] = T.DOOR;

    map[H - 2][4] = T.DOOR;
    map[1][34] = T.DOOR;

    mapDef.layout = map;
    return map;
  }

  if (mapKey === "SKY_RUINS") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }

    // 通路（スケール: 30×22→42×30）
    for (let x = 3; x < W - 3; x++) {
      map[5][x] = T.PATH;
      map[23][x] = T.PATH;
    }
    for (let y = 5; y <= 23; y++) {
      map[y][7] = T.PATH;
      map[y][34] = T.PATH;
    }

    // 壁の障害物
    for (let y = 10; y <= 19; y++) {
      map[y][14] = T.WALL;
      map[y][27] = T.WALL;
    }

    // 草むら
    for (let y = 8; y <= 15; y++) {
      for (let x = 17; x <= 24; x++) map[y][x] = T.GRASS;
    }
    for (let y = 16; y <= 22; y++) {
      for (let x = 36; x <= 39; x++) map[y][x] = T.GRASS;
    }

    // 森エリア
    for (let y = 3; y <= 11; y++) {
      for (let x = 3; x <= 11; x++) map[y][x] = T.FOREST;
    }
    for (let y = 18; y <= 26; y++) {
      for (let x = 29; x <= 38; x++) map[y][x] = T.FOREST;
    }

    map[H - 2][34] = T.DOOR;
    // 天空の花園への入口
    map[1][20] = T.DOOR;

    mapDef.layout = map;
    return map;
  }

  // --- ダーク団アジト (22x18) ---
  if (mapKey === "DARK_TOWER") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.PATH);
        }
      }
      map.push(row);
    }
    // 内壁で部屋を区切る（スケール: 22×18→32×26）
    for (let x = 6; x <= 12; x++) map[9][x] = T.WALL;
    for (let x = 19; x <= 25; x++) map[9][x] = T.WALL;
    for (let y = 9; y <= 16; y++) map[y][15] = T.WALL;
    map[12][15] = T.PATH; // 通路
    for (let x = 6; x <= 25; x++) map[16][x] = T.WALL;
    map[16][15] = T.PATH; // 通路
    // 草むら（闇の庭園）
    for (let y = 3; y <= 6; y++) {
      for (let x = 3; x <= 9; x++) map[y][x] = T.FOREST;
    }
    for (let y = 3; y <= 6; y++) {
      for (let x = 22; x <= 28; x++) map[y][x] = T.FOREST;
    }
    for (let y = 19; y <= 22; y++) {
      for (let x = 4; x <= 12; x++) map[y][x] = T.GRASS;
    }
    for (let y = 19; y <= 22; y++) {
      for (let x = 19; x <= 26; x++) map[y][x] = T.GRASS;
    }
    // 入口（南）
    map[H - 2][16] = T.DOOR;
    // 影の森への出口（北）
    map[1][16] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 氷峰 (26x20) ---
  if (mapKey === "FROZEN_PEAK") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // 氷の道（スケール: 26×20→38×28）
    for (let x = 3; x < W - 3; x++) map[14][x] = T.PATH;
    for (let y = 4; y <= 23; y++) map[y][18] = T.PATH;
    for (let y = 4; y <= 23; y++) map[y][19] = T.PATH;
    // 雪原（草むら≒吹雪エリア）
    for (let y = 4; y <= 11; y++) {
      for (let x = 3; x <= 13; x++) map[y][x] = T.GRASS;
    }
    for (let y = 17; y <= 24; y++) {
      for (let x = 23; x <= 34; x++) map[y][x] = T.GRASS;
    }
    // 氷の池
    for (let y = 7; y <= 11; y++) {
      for (let x = 25; x <= 29; x++) map[y][x] = T.WATER;
    }
    for (let y = 18; y <= 21; y++) {
      for (let x = 6; x <= 9; x++) map[y][x] = T.WATER;
    }
    // 壁の障害物
    for (let x = 9; x <= 15; x++) map[7][x] = T.WALL;
    for (let y = 17; y <= 22; y++) map[y][15] = T.WALL;
    // ジム建物
    for (let x = 16; x <= 22; x++) map[3][x] = T.WALL;
    for (let x = 16; x <= 22; x++) map[4][x] = T.WALL;
    map[4][19] = T.DOOR;
    // 補給所
    for (let x = 26; x <= 32; x++) map[18][x] = T.WALL;
    for (let x = 26; x <= 32; x++) map[19][x] = T.WALL;
    map[19][29] = T.DOOR;
    // ドア
    map[H - 2][4] = T.DOOR;  // 南：砂漠へ
    map[1][32] = T.DOOR;      // 北：図書館へ
    mapDef.layout = map;
    return map;
  }

  // --- 天空の花園 (28x20) ---
  if (mapKey === "CELESTIAL_GARDEN") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // 花園の小道（スケール: 28×20→40×28）
    for (let x = 3; x < W - 3; x++) map[11][x] = T.PATH;
    for (let x = 3; x < W - 3; x++) map[20][x] = T.PATH;
    for (let y = 3; y <= 24; y++) map[y][11] = T.PATH;
    for (let y = 3; y <= 24; y++) map[y][29] = T.PATH;
    // 花畑（草むら）
    for (let y = 4; y <= 10; y++) {
      for (let x = 3; x <= 10; x++) map[y][x] = T.GRASS;
    }
    for (let y = 4; y <= 10; y++) {
      for (let x = 30; x <= 37; x++) map[y][x] = T.GRASS;
    }
    for (let y = 21; y <= 24; y++) {
      for (let x = 14; x <= 26; x++) map[y][x] = T.GRASS;
    }
    // 天空の森
    for (let y = 13; y <= 18; y++) {
      for (let x = 3; x <= 9; x++) map[y][x] = T.FOREST;
    }
    for (let y = 13; y <= 18; y++) {
      for (let x = 31; x <= 37; x++) map[y][x] = T.FOREST;
    }
    // 聖なる泉
    for (let y = 7; y <= 10; y++) {
      for (let x = 17; x <= 23; x++) map[y][x] = T.WATER;
    }
    // 壁の島
    for (let y = 14; y <= 17; y++) {
      map[y][19] = T.WALL;
      map[y][21] = T.WALL;
    }
    // 天空ショップ
    for (let x = 11; x <= 17; x++) map[6][x] = T.WALL;
    for (let x = 11; x <= 17; x++) map[7][x] = T.WALL;
    map[7][14] = T.DOOR;
    // 入口（南）
    map[H - 2][20] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 霧の湿地 (28x22) ---
  if (mapKey === "MISTY_SWAMP") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // メイン通路（スケール: 28×22→40×30）
    for (let x = 3; x < W - 3; x++) map[15][x] = T.PATH;
    for (let y = 3; y <= 26; y++) map[y][20] = T.PATH;
    // 毒沼（POISONタイル）
    for (let y = 4; y <= 10; y++) {
      for (let x = 3; x <= 11; x++) map[y][x] = T.POISON;
    }
    for (let y = 19; y <= 24; y++) {
      for (let x = 26; x <= 34; x++) map[y][x] = T.POISON;
    }
    // 森エリア（エンカウント）
    for (let y = 4; y <= 11; y++) {
      for (let x = 23; x <= 34; x++) map[y][x] = T.FOREST;
    }
    for (let y = 19; y <= 26; y++) {
      for (let x = 3; x <= 14; x++) map[y][x] = T.GRASS;
    }
    // 水面
    for (let y = 11; y <= 14; y++) {
      for (let x = 6; x <= 10; x++) map[y][x] = T.WATER;
    }
    for (let y = 16; y <= 19; y++) {
      for (let x = 29; x <= 34; x++) map[y][x] = T.WATER;
    }
    // 壁（障害物）
    for (let x = 13; x <= 17; x++) map[8][x] = T.WALL;
    for (let y = 20; y <= 24; y++) map[y][17] = T.WALL;
    // 小屋（ショップ）
    for (let x = 13; x <= 19; x++) map[4][x] = T.WALL;
    for (let x = 13; x <= 19; x++) map[5][x] = T.WALL;
    map[5][16] = T.DOOR;
    // 入口（南西 → 森から）
    map[H - 2][4] = T.DOOR;
    // 東出口（珊瑚の浜へ）
    map[15][W - 1] = T.DOOR;
    // 北出口（洞窟へ）
    map[1][20] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 珊瑚の浜 (26x20) ---
  if (mapKey === "CORAL_REEF") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // 砂浜通路（スケール: 26×20→38×28）
    for (let x = 3; x < W - 3; x++) map[14][x] = T.PATH;
    for (let y = 3; y <= 24; y++) map[y][19] = T.PATH;
    // 大海原（水タイル）
    for (let y = 3; y <= 8; y++) {
      for (let x = 3; x <= 15; x++) map[y][x] = T.WATER;
    }
    for (let y = 3; y <= 11; y++) {
      for (let x = 23; x <= 34; x++) map[y][x] = T.WATER;
    }
    // 浅瀬（草むら扱い）
    for (let y = 10; y <= 13; y++) {
      for (let x = 4; x <= 12; x++) map[y][x] = T.GRASS;
    }
    for (let y = 17; y <= 22; y++) {
      for (let x = 23; x <= 32; x++) map[y][x] = T.GRASS;
    }
    // サンゴ礁（森タイル）
    for (let y = 17; y <= 24; y++) {
      for (let x = 3; x <= 12; x++) map[y][x] = T.FOREST;
    }
    // 壁（岩礁）
    for (let x = 15; x <= 18; x++) map[7][x] = T.WALL;
    for (let y = 20; y <= 22; y++) map[y][16] = T.WALL;
    // 入口（西 → 湿地から）
    map[14][0] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 砂塵の谷 (30x22) ---
  if (mapKey === "SAND_VALLEY") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.SAND);
        }
      }
      map.push(row);
    }
    // 石畳メイン通路（スケール: 30×22→42×30）
    for (let x = 3; x < W - 3; x++) map[15][x] = T.PATH;
    for (let y = 3; y <= 26; y++) map[y][21] = T.PATH;
    // オアシス（水 + 緑）
    for (let y = 11; y <= 14; y++) {
      for (let x = 17; x <= 20; x++) map[y][x] = T.WATER;
    }
    for (let y = 10; y <= 15; y++) {
      map[y][15] = T.GRASS;
      map[y][21] = T.GRASS;
    }
    // 砂漠の草むら（エンカウントエリア）
    for (let y = 4; y <= 11; y++) {
      for (let x = 3; x <= 13; x++) map[y][x] = T.FOREST;
    }
    for (let y = 19; y <= 26; y++) {
      for (let x = 28; x <= 38; x++) map[y][x] = T.FOREST;
    }
    // 岩壁（迷路要素）
    for (let x = 8; x <= 14; x++) map[7][x] = T.WALL;
    for (let y = 18; y <= 23; y++) map[y][25] = T.WALL;
    for (let x = 31; x <= 36; x++) map[11][x] = T.WALL;
    for (let y = 5; y <= 11; y++) map[y][31] = T.WALL;
    // オアシスショップ
    for (let x = 17; x <= 22; x++) map[7][x] = T.WALL;
    for (let x = 17; x <= 22; x++) map[8][x] = T.WALL;
    map[8][20] = T.DOOR;
    // 入口（南 → 火山から直行ルート）
    map[H - 2][7] = T.DOOR;
    // 北出口（氷峰へ）
    map[1][34] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 影の森 (24x20) ---
  if (mapKey === "SHADOW_GROVE") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.DARK);
        }
      }
      map.push(row);
    }
    // 闇の中の通路（スケール: 24×20→36×28）
    for (let x = 3; x < W - 3; x++) map[14][x] = T.PATH;
    for (let y = 3; y <= 24; y++) map[y][18] = T.PATH;
    // 闇の草むら
    for (let y = 4; y <= 11; y++) {
      for (let x = 3; x <= 12; x++) map[y][x] = T.FOREST;
    }
    for (let y = 17; y <= 24; y++) {
      for (let x = 23; x <= 32; x++) map[y][x] = T.FOREST;
    }
    // 闇の水たまり
    for (let y = 7; y <= 10; y++) {
      for (let x = 24; x <= 27; x++) map[y][x] = T.WATER;
    }
    // 壁島
    for (let x = 14; x <= 17; x++) map[7][x] = T.WALL;
    for (let y = 18; y <= 21; y++) map[y][15] = T.WALL;
    // 実験ラボ跡（壁で囲む）
    for (let x = 26; x <= 32; x++) map[13][x] = T.WALL;
    for (let x = 26; x <= 32; x++) map[15][x] = T.WALL;
    for (let y = 13; y <= 15; y++) { map[y][26] = T.WALL; map[y][32] = T.WALL; }
    map[15][29] = T.PATH; // 入口
    // 入口（南 → ダークタワーから）
    map[H - 2][8] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 古代図書館 (22x18) ---
  if (mapKey === "ANCIENT_LIBRARY") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // 本棚の壁（迷路構造）（スケール: 22×18→34×26）
    for (let x = 5; x <= 11; x++) map[6][x] = T.WALL;
    for (let x = 22; x <= 28; x++) map[6][x] = T.WALL;
    for (let x = 5; x <= 11; x++) map[12][x] = T.WALL;
    for (let x = 22; x <= 28; x++) map[12][x] = T.WALL;
    for (let x = 9; x <= 23; x++) map[17][x] = T.WALL;
    // 通路
    for (let y = 3; y <= 22; y++) map[y][17] = T.PATH;
    for (let x = 3; x < W - 3; x++) map[9][x] = T.PATH;
    for (let x = 3; x < W - 3; x++) map[20][x] = T.PATH;
    // テレポートパッド配置
    map[4][8] = T.TELEPORT;
    map[4][25] = T.TELEPORT;
    map[13][5] = T.TELEPORT;
    map[13][28] = T.TELEPORT;
    map[19][8] = T.TELEPORT;
    map[19][25] = T.TELEPORT;
    // 学習エリア（草むら相当: エンカウントあり）
    for (let y = 3; y <= 4; y++) {
      for (let x = 12; x <= 16; x++) map[y][x] = T.GRASS;
    }
    for (let y = 14; y <= 16; y++) {
      for (let x = 12; x <= 16; x++) map[y][x] = T.GRASS;
    }
    for (let y = 22; y <= 23; y++) {
      for (let x = 3; x <= 8; x++) map[y][x] = T.GRASS;
    }
    for (let y = 22; y <= 23; y++) {
      for (let x = 25; x <= 29; x++) map[y][x] = T.GRASS;
    }
    // 入口（南）
    map[H - 2][17] = T.DOOR;
    // 北出口（遺跡方面へ）
    map[1][17] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  // --- 星降り盆地 (30x24) ---
  if (mapKey === "STARFALL_BASIN") {
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
          row.push(T.WALL);
        } else {
          row.push(T.GROUND);
        }
      }
      map.push(row);
    }
    // 星の光路（スケール: 30×24→44×34）
    for (let x = 3; x < W - 3; x++) map[17][x] = T.PATH;
    for (let y = 3; y <= 30; y++) map[y][22] = T.PATH;
    // 四天王の闘技場（4隅の広場）
    for (let y = 7; y <= 13; y++) {
      for (let x = 4; x <= 13; x++) map[y][x] = T.PATH;
    }
    for (let y = 7; y <= 13; y++) {
      for (let x = 31; x <= 40; x++) map[y][x] = T.PATH;
    }
    for (let y = 21; y <= 27; y++) {
      for (let x = 4; x <= 13; x++) map[y][x] = T.PATH;
    }
    for (let y = 21; y <= 27; y++) {
      for (let x = 31; x <= 40; x++) map[y][x] = T.PATH;
    }
    // 中央の星降りの泉
    for (let y = 14; y <= 20; y++) {
      for (let x = 18; x <= 26; x++) map[y][x] = T.WATER;
    }
    map[17][22] = T.PATH; // 通路維持
    // 最強草むら（高レベルエンカウント）
    for (let y = 3; y <= 6; y++) {
      for (let x = 15; x <= 29; x++) map[y][x] = T.GRASS;
    }
    for (let y = 28; y <= 31; y++) {
      for (let x = 15; x <= 29; x++) map[y][x] = T.GRASS;
    }
    // 森エリア
    for (let y = 4; y <= 11; y++) {
      for (let x = 32; x <= 40; x++) map[y][x] = T.FOREST;
    }
    for (let y = 23; y <= 30; y++) {
      for (let x = 3; x <= 10; x++) map[y][x] = T.FOREST;
    }
    // 壁の障害物
    for (let x = 15; x <= 18; x++) map[11][x] = T.WALL;
    for (let x = 26; x <= 29; x++) map[23][x] = T.WALL;
    // 工房（ショップ）
    for (let x = 29; x <= 35; x++) map[14][x] = T.WALL;
    for (let x = 29; x <= 35; x++) map[15][x] = T.WALL;
    for (let x = 29; x <= 35; x++) map[16][x] = T.WALL;
    map[16][32] = T.DOOR;
    // 入口（南 → 天空の花園から）
    map[H - 2][22] = T.DOOR;
    mapDef.layout = map;
    return map;
  }

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
        row.push(T.WALL);
      } else {
        row.push(T.GROUND);
      }
    }
    map.push(row);
  }

  // フォールバックレイアウト（EMOJI_TOWN準拠、スケール済み）
  for (let x = 1; x < W - 1; x++) map[10][x] = T.PATH;
  for (let y = 1; y < H - 1; y++) map[y][14] = T.PATH;

  for (let x = 4; x <= 12; x++) map[3][x] = T.WALL;
  for (let x = 4; x <= 12; x++) map[4][x] = T.WALL;
  for (let x = 4; x <= 12; x++) map[5][x] = T.WALL;
  for (let x = 4; x <= 12; x++) map[6][x] = T.WALL;
  map[6][9] = T.DOOR;

  for (let x = 17; x <= 24; x++) map[3][x] = T.WALL;
  for (let x = 17; x <= 24; x++) map[4][x] = T.WALL;
  for (let x = 17; x <= 24; x++) map[5][x] = T.WALL;
  for (let x = 17; x <= 24; x++) map[6][x] = T.WALL;

  for (let x = 26; x <= 33; x++) map[1][x] = T.WALL;
  for (let x = 26; x <= 33; x++) map[2][x] = T.WALL;
  for (let x = 26; x <= 33; x++) map[3][x] = T.WALL;
  for (let x = 26; x <= 33; x++) map[4][x] = T.WALL;
  for (let x = 26; x <= 33; x++) map[5][x] = T.WALL;
  for (let x = 26; x <= 33; x++) map[6][x] = T.WALL;
  map[6][29] = T.DOOR;

  for (let y = 11; y <= 14; y++) {
    for (let x = 12; x <= 17; x++) map[y][x] = T.PATH;
  }

  for (let y = 15; y <= 24; y++) {
    for (let x = 3; x <= 12; x++) map[y][x] = T.GRASS;
  }

  map[20][22] = T.WATER;
  map[20][23] = T.WATER;
  map[21][22] = T.WATER;
  map[21][23] = T.WATER;

  for (let y = 15; y <= 24; y++) map[y][13] = T.WALL;
  map[18][13] = T.GROUND;

  map[10][W - 1] = T.DOOR;

  mapDef.layout = map;
  return map;
}

export const MAP_FACILITY_MARKERS = {
  EMOJI_TOWN: [
    { x: 9, y: 3, emoji: "💖", label: "回復" },
    { x: 20, y: 3, emoji: "🛒", label: "ショップ" },
  ],
  FOREST: [
    { x: 30, y: 3, emoji: "🏛️", label: "ジム" },
  ],
  MISTY_SWAMP: [
    { x: 16, y: 4, emoji: "🛒", label: "小屋" },
  ],
  SAND_VALLEY: [
    { x: 20, y: 7, emoji: "🛒", label: "オアシス" },
  ],
  VOLCANIC_PASS: [
    { x: 20, y: 14, emoji: "🛒", label: "補給所" },
  ],
  FROZEN_PEAK: [
    { x: 19, y: 3, emoji: "🏛️", label: "ジム" },
    { x: 29, y: 18, emoji: "🛒", label: "補給所" },
  ],
  CELESTIAL_GARDEN: [
    { x: 14, y: 6, emoji: "🛒", label: "ショップ" },
  ],
  STARFALL_BASIN: [
    { x: 32, y: 14, emoji: "🛒", label: "工房" },
  ],
};

export const MAP_BUILDING_DECOR = {
  EMOJI_TOWN: [
    { x: 4, y: 3, w: 9, h: 4, roofColor: 0xb91c1c, wallColor: 0x9ca3af, emoji: "🏠", label: "おうち" },
    { x: 17, y: 3, w: 8, h: 4, roofColor: 0x0284c7, wallColor: 0x94a3b8, emoji: "🛒", label: "ショップ" },
    { x: 26, y: 1, w: 8, h: 6, roofColor: 0x7c3aed, wallColor: 0xa1a1aa, emoji: "🧪", label: "研究所" },
  ],
  FOREST: [
    { x: 27, y: 3, w: 7, h: 2, roofColor: 0xb45309, wallColor: 0x78716c, emoji: "🏛️", label: "ジム" },
  ],
  MISTY_SWAMP: [
    { x: 13, y: 4, w: 7, h: 2, roofColor: 0x166534, wallColor: 0x6b7280, emoji: "🛒", label: "小屋" },
  ],
  SAND_VALLEY: [
    { x: 17, y: 7, w: 6, h: 2, roofColor: 0xd97706, wallColor: 0xa8a29e, emoji: "🛒", label: "オアシス" },
  ],
  VOLCANIC_PASS: [
    { x: 17, y: 14, w: 7, h: 2, roofColor: 0xdc2626, wallColor: 0x78716c, emoji: "🛒", label: "補給所" },
  ],
  FROZEN_PEAK: [
    { x: 16, y: 3, w: 7, h: 2, roofColor: 0x1d4ed8, wallColor: 0x9ca3af, emoji: "🏛️", label: "ジム" },
    { x: 26, y: 18, w: 7, h: 2, roofColor: 0x0284c7, wallColor: 0x94a3b8, emoji: "🛒", label: "補給所" },
  ],
  CELESTIAL_GARDEN: [
    { x: 11, y: 6, w: 7, h: 2, roofColor: 0x0ea5e9, wallColor: 0x9ca3af, emoji: "🛒", label: "ショップ" },
  ],
  STARFALL_BASIN: [
    { x: 29, y: 14, w: 7, h: 3, roofColor: 0x7c3aed, wallColor: 0x9ca3af, emoji: "🛒", label: "工房" },
  ],
};

// ドア遷移先の定義（スケール済み座標）
export const DOOR_TRANSITIONS = {
  EMOJI_TOWN: [
    { doorCheck: (x, y) => y === 6 && x === 9, target: "HOUSE1", startX: 6, startY: 8 },
    { doorCheck: (x, y) => y === 6 && x === 20, target: "TOWN_SHOP", startX: 6, startY: 8 },
    { doorCheck: (x, y) => y === 6 && x === 29, target: "LAB", startX: 7, startY: 8 },
    { doorCheck: (x, y) => x === 35, target: "FOREST", startX: 1, startY: 25 },
  ],
  HOUSE1: [
    { doorCheck: () => true, target: "EMOJI_TOWN", startX: 9, startY: 7 },
  ],
  LAB: [
    { doorCheck: () => true, target: "EMOJI_TOWN", startX: 29, startY: 7 },
  ],
  TOWN_SHOP: [
    { doorCheck: () => true, target: "EMOJI_TOWN", startX: 20, startY: 7 },
  ],
  FOREST: [
    { doorCheck: (x, y) => x === 1 && y === 26, target: "EMOJI_TOWN", startX: 34, startY: 10 },
    { doorCheck: (x, y) => x === 18 && y === 1, target: "MISTY_SWAMP", startX: 4, startY: 28 },
    { doorCheck: (x, y) => x === 30 && y === 4, target: "FOREST_GYM", startX: 7, startY: 8 },
  ],
  FOREST_GYM: [
    { doorCheck: () => true, target: "FOREST", startX: 30, startY: 5 },
  ],
  CRYSTAL_CAVE: [
    { doorCheck: (x, y) => x === 17 && y === 24, target: "MISTY_SWAMP", startX: 20, startY: 2 },
    { doorCheck: (x, y) => x === 29 && y === 1, target: "VOLCANIC_PASS", startX: 4, startY: 28 },
    { doorCheck: (x, y) => x === 1 && y === 13, target: "DARK_TOWER", startX: 16, startY: 24 },
  ],
  VOLCANIC_PASS: [
    { doorCheck: (x, y) => x === 4 && y === 28, target: "CRYSTAL_CAVE", startX: 29, startY: 2 },
    { doorCheck: (x, y) => x === 34 && y === 1, target: "SAND_VALLEY", startX: 7, startY: 28 },
    { doorCheck: (x, y) => x === 20 && y === 15, target: "VOLCANO_SHOP", startX: 6, startY: 8 },
  ],
  VOLCANO_SHOP: [
    { doorCheck: () => true, target: "VOLCANIC_PASS", startX: 20, startY: 16 },
  ],
  DARK_TOWER: [
    { doorCheck: (x, y) => x === 16 && y === 24, target: "CRYSTAL_CAVE", startX: 2, startY: 13 },
    { doorCheck: (x, y) => x === 16 && y === 1, target: "SHADOW_GROVE", startX: 8, startY: 26 },
  ],
  FROZEN_PEAK: [
    { doorCheck: (x, y) => x === 4 && y === 26, target: "SAND_VALLEY", startX: 34, startY: 2 },
    { doorCheck: (x, y) => x === 32 && y === 1, target: "ANCIENT_LIBRARY", startX: 17, startY: 24 },
    { doorCheck: (x, y) => x === 19 && y === 4, target: "FROZEN_GYM", startX: 7, startY: 8 },
    { doorCheck: (x, y) => x === 29 && y === 19, target: "FROZEN_SHOP", startX: 6, startY: 8 },
  ],
  FROZEN_GYM: [
    { doorCheck: () => true, target: "FROZEN_PEAK", startX: 19, startY: 5 },
  ],
  FROZEN_SHOP: [
    { doorCheck: () => true, target: "FROZEN_PEAK", startX: 29, startY: 20 },
  ],
  SKY_RUINS: [
    { doorCheck: (x, y) => x === 34 && y === 28, target: "ANCIENT_LIBRARY", startX: 17, startY: 2 },
    { doorCheck: (x, y) => x === 20 && y === 1, target: "CELESTIAL_GARDEN", startX: 20, startY: 26 },
  ],
  CELESTIAL_GARDEN: [
    { doorCheck: (x, y) => x === 20 && y === 26, target: "SKY_RUINS", startX: 20, startY: 2 },
    { doorCheck: (x, y) => x === 14 && y === 7, target: "GARDEN_SHOP", startX: 6, startY: 8 },
    { doorCheck: (x, y) => x === 20 && y === 1, target: "STARFALL_BASIN", startX: 22, startY: 32 },
  ],
  GARDEN_SHOP: [
    { doorCheck: () => true, target: "CELESTIAL_GARDEN", startX: 14, startY: 8 },
  ],
  // ── 追加マップ遷移 ──
  MISTY_SWAMP: [
    { doorCheck: (x, y) => x === 4 && y === 28, target: "FOREST", startX: 18, startY: 2 },
    { doorCheck: (x, y) => x === 39 && y === 15, target: "CORAL_REEF", startX: 1, startY: 14 },
    { doorCheck: (x, y) => x === 20 && y === 1, target: "CRYSTAL_CAVE", startX: 17, startY: 23 },
    { doorCheck: (x, y) => x === 16 && y === 5, target: "SWAMP_SHOP", startX: 6, startY: 8 },
  ],
  SWAMP_SHOP: [
    { doorCheck: () => true, target: "MISTY_SWAMP", startX: 16, startY: 6 },
  ],
  CORAL_REEF: [
    { doorCheck: (x, y) => x === 0 && y === 14, target: "MISTY_SWAMP", startX: 38, startY: 15 },
  ],
  SAND_VALLEY: [
    { doorCheck: (x, y) => x === 7 && y === 28, target: "VOLCANIC_PASS", startX: 34, startY: 2 },
    { doorCheck: (x, y) => x === 34 && y === 1, target: "FROZEN_PEAK", startX: 4, startY: 26 },
    { doorCheck: (x, y) => x === 20 && y === 8, target: "SAND_VALLEY_SHOP", startX: 6, startY: 8 },
  ],
  SAND_VALLEY_SHOP: [
    { doorCheck: () => true, target: "SAND_VALLEY", startX: 20, startY: 9 },
  ],
  SHADOW_GROVE: [
    { doorCheck: (x, y) => x === 8 && y === 26, target: "DARK_TOWER", startX: 16, startY: 2 },
  ],
  ANCIENT_LIBRARY: [
    { doorCheck: (x, y) => x === 17 && y === 24, target: "FROZEN_PEAK", startX: 32, startY: 2 },
    { doorCheck: (x, y) => x === 17 && y === 1, target: "SKY_RUINS", startX: 34, startY: 27 },
  ],
  STARFALL_BASIN: [
    { doorCheck: (x, y) => x === 22 && y === 32, target: "CELESTIAL_GARDEN", startX: 20, startY: 2 },
    { doorCheck: (x, y) => x === 32 && y === 16, target: "BASIN_SHOP", startX: 6, startY: 8 },
  ],
  BASIN_SHOP: [
    { doorCheck: () => true, target: "STARFALL_BASIN", startX: 32, startY: 17 },
  ],
};

export const SWIMMABLE_WATER_TILES = {
  FOREST: [
    { x: 8, y: 14 },
    { x: 8, y: 15 },
    { x: 8, y: 16 },
    { x: 8, y: 17 },
  ],
  CORAL_REEF: [
    { x: 7, y: 7 },
    { x: 8, y: 7 },
    { x: 9, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 9, y: 8 },
  ],
  MISTY_SWAMP: [
    { x: 7, y: 12 },
    { x: 8, y: 12 },
  ],
};

export const FIRE_ICE_BLOCKS = {
  VOLCANIC_PASS: [
    { x: 24, y: 24, id: "volcano_ice_gate_1" },
    { x: 25, y: 24, id: "volcano_ice_gate_2" },
  ],
  SAND_VALLEY: [
    { x: 27, y: 15, id: "desert_ice_1" },
  ],
  SHADOW_GROVE: [
    { x: 17, y: 7, id: "shadow_ice_1" },
    { x: 17, y: 8, id: "shadow_ice_2" },
  ],
};

export const FIELD_HIDDEN_ITEMS = {
  FOREST: [
    {
      id: "forest_islet_cache",
      x: 8,
      y: 15,
      requiredType: "WATER",
      itemId: "GREAT_BALL",
      quantity: 2,
      message: "🌊 みずの力で小島へ！ ハイキャッチボールx2を見つけた！",
      flagKey: "forestSwimTreasureTaken",
      markerEmoji: "🎁",
    },
  ],
  CRYSTAL_CAVE: [
    {
      id: "cave_dark_cache",
      x: 26,
      y: 20,
      requiredType: "ELECTRIC",
      itemId: "ULTRA_BALL",
      quantity: 1,
      message: "⚡ ひかりで暗闇を照らした！ 見えない宝箱からエリートボールを見つけた！",
      flagKey: "caveHiddenItemFound",
      markerEmoji: "✨",
    },
  ],
  MISTY_SWAMP: [
    {
      id: "swamp_herb_cache",
      x: 9,
      y: 20,
      requiredType: "GRASS",
      itemId: "POTION",
      quantity: 5,
      message: "🌿 くさの力で毒草を見分けた！ ヒールジェル×5を見つけた！",
      flagKey: "swampHerbFound",
      markerEmoji: "🌿",
    },
  ],
  CORAL_REEF: [
    {
      id: "coral_pearl_cache",
      x: 9,
      y: 7,
      requiredType: "WATER",
      itemId: "GREAT_BALL",
      quantity: 3,
      message: "🌊 浅瀬の底から真珠を拾った！ ハイキャッチボール×3を見つけた！",
      flagKey: "coralPearlFound",
      markerEmoji: "🦪",
    },
  ],
  SAND_VALLEY: [
    {
      id: "desert_relic_cache",
      x: 11,
      y: 5,
      requiredType: "FIRE",
      itemId: "ULTRA_BALL",
      quantity: 2,
      message: "🔥 炎で砂岩を溶かした！ 古代の遺物からエリートボール×2を見つけた！",
      flagKey: "desertRelicFound",
      markerEmoji: "🏺",
    },
  ],
  SHADOW_GROVE: [
    {
      id: "shadow_data_cache",
      x: 29,
      y: 14,
      requiredType: "ELECTRIC",
      itemId: "MEGA_ETHER",
      quantity: 2,
      message: "⚡ 電気で端末を起動した！ ダーク団の倉庫からメガエーテル×2を見つけた！",
      flagKey: "shadowDataFound",
      markerEmoji: "💾",
    },
  ],
  STARFALL_BASIN: [
    {
      id: "basin_star_cache",
      x: 22,
      y: 17,
      requiredType: "ICE",
      itemId: "DUSK_BALL",
      quantity: 3,
      message: "❄️ 凍結した星石を砕いた！ ダスクボール×3を見つけた！",
      flagKey: "basinStarFound",
      markerEmoji: "⭐",
    },
  ],
};

// テレポートパッドの遷移先定義
export const TELEPORT_PADS = {
  ANCIENT_LIBRARY: [
    { x: 8, y: 4, destX: 25, destY: 4 },
    { x: 25, y: 4, destX: 8, destY: 4 },
    { x: 5, y: 13, destX: 28, destY: 13 },
    { x: 28, y: 13, destX: 5, destY: 13 },
    { x: 8, y: 19, destX: 25, destY: 19 },
    { x: 25, y: 19, destX: 8, destY: 19 },
  ],
};

// 毒沼のダメージ設定（歩くたびにパーティ先頭のHPを減算）
export const POISON_SWAMP_DAMAGE = 3;
