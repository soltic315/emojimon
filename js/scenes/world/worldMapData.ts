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
};

// マップ定義（NPCはgetMapNpcs()で動的生成するためnpcsは省略）
export const MAPS = {
  EMOJI_TOWN: {
    name: "エモじタウン",
    width: 25,
    height: 20,
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
  FOREST: {
    name: "エモの森",
    width: 25,
    height: 20,
    layout: null,
    bgm: "field",
  },
  CRYSTAL_CAVE: {
    name: "きらめき洞窟",
    width: 25,
    height: 20,
    layout: null,
    bgm: "field",
  },
  VOLCANIC_PASS: {
    name: "マグマ峠",
    width: 28,
    height: 22,
    layout: null,
    bgm: "field",
  },
  SKY_RUINS: {
    name: "そらの遺跡",
    width: 30,
    height: 22,
    layout: null,
    bgm: "field",
  },
  DARK_TOWER: {
    name: "ダーク団アジト",
    width: 22,
    height: 18,
    layout: null,
    bgm: "field",
  },
  FROZEN_PEAK: {
    name: "氷峰",
    width: 26,
    height: 20,
    layout: null,
    bgm: "field",
  },
  CELESTIAL_GARDEN: {
    name: "天空の花園",
    width: 28,
    height: 20,
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

  if (mapKey === "EMOJI_TOWN") {
    const npcs = [
      { x: 14, y: 5, text: "いらっしゃいませ！", shop: true, texture: "npc-shop" },
      { x: 12, y: 6, text: "スターライトを つれてきてね！", quest: "STARLITE", texture: "npc-quest" },
    ];
    if (!sf.prologueDone) {
      // プロローグ前: 町の人たちが研究所への道を案内
      npcs.push({ x: 4, y: 12, text: "ようこそ エモじタウンへ！ 北にある建物が 研究所だよ。", texture: "npc" });
      npcs.push({ x: 21, y: 5, text: "博士が きみを 待っているみたい。研究所のドアをくぐってみよう！", texture: "npc" });
      npcs.push({ x: 19, y: 10, text: null, texture: "npc-quest", story: "professor_town_hint" });
      // 母親NPC（家の前）
      npcs.push({ x: 7, y: 5, text: null, texture: "npc", story: "mom_before_lab" });
    } else if (!sf.townRivalBeaten) {
      // プロローグ後〜ライバル未撃破
      npcs.push({ x: 4, y: 12, text: "草むらをあるくと モンスターが出てくるぞ！ まずは近くで腕試しだ。", texture: "npc" });
      npcs.push({ x: 21, y: 5, text: "Pキーでセーブできるよ！ こまめにセーブするのが冒険のコツさ。", texture: "npc" });
      // チュートリアル助手NPC
      if (!sf.tutorialBattleDone) {
        npcs.push({ x: 10, y: 9, text: null, texture: "npc-quest", story: "tutorial_assistant_prebattle" });
      } else if (!sf.tutorialCatchDone) {
        npcs.push({ x: 10, y: 9, text: null, texture: "npc-quest", story: "tutorial_assistant_catch" });
      } else {
        npcs.push({ x: 10, y: 9, text: "もう大丈夫そうだね！ 冒険を楽しんで！ 何かあったらメニューの『ガイド』を見てね。", texture: "npc" });
      }
      // 母親NPC（家の前）
      if (!sf.momFarewellDone) {
        npcs.push({ x: 7, y: 5, text: null, texture: "npc", story: "mom_farewell" });
      } else {
        npcs.push({ x: 7, y: 5, text: "気をつけてね！ いつでも帰ってきていいんだよ。", texture: "npc" });
      }
      npcs.push({ x: 11, y: 11, text: "東の森に行く前に、草むらで少し練習するといいよ！", texture: "npc" });
      if (sf.starterChosen && !sf.townRivalBeaten) {
        if (!sf.rivalIntroDone) {
          // 初対面: ストーリーイベントでまず自己紹介、そのあとバトル
          npcs.push({ x: 8, y: 8, text: null, texture: "npc-quest", story: "rival_first_meet", rivalBattle: "town", trainerName: "ライバル レン", rivalLevel: 7 });
        } else {
          // 2回目以降: 直接バトル
          npcs.push({ x: 8, y: 8, text: "もう1回やろうぜ！ 今度こそ負けないぞ！", texture: "npc-quest", rivalBattle: "town", trainerName: "ライバル レン", rivalLevel: 7 });
        }
      }
    } else {
      npcs.push({ x: 4, y: 12, text: "レンに勝ったんだって？ すごいな！ 森に行く準備はできているかい？", texture: "npc" });
      npcs.push({ x: 21, y: 5, text: "Pキーでセーブできるよ！ 森に行く前にセーブしておこう。", texture: "npc" });
      npcs.push({ x: 11, y: 11, text: "東の森には クリスタルの気配があるらしい。探してみよう！", texture: "npc" });
      npcs.push({ x: 7, y: 5, text: "がんばってるね！ 疲れたら おうちで休んでいってね。", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "HOUSE1") {
    const npcs = [];
    if (!sf.prologueDone) {
      npcs.push({ x: 6, y: 5, text: "おかえり！ 博士が研究所で待っているみたい。行ってきなさい！", heal: true, texture: "npc" });
    } else {
      npcs.push({ x: 6, y: 5, text: "おかえり！ ゆっくり休んでね。ここに泊まるとHPが全回復するよ。", heal: true, texture: "npc" });
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

  if (mapKey === "FOREST") {
    const npcs = [
      { x: 11, y: 4, text: "この森には 珍しいモンスターがいるらしい… 奥に進むほど強いのが出るぞ。", texture: "npc" },
      { x: 3, y: 3, text: null, texture: "npc-quest", story: "forest_tablet_1" },
    ];
    if (!sf.forestScoutBeaten) {
      npcs.push({ x: 6, y: 6, text: null, texture: "npc-quest", rivalBattle: "forest_scout", trainerName: "レンジャー ミナト", rivalLevel: 14, preBattleText: "ミナト: 森の中は危険がいっぱいだ！ レンジャーの俺に実力を見せてみな！" });
    } else {
      npcs.push({ x: 6, y: 6, text: "森の動きが見えてきたな。次は洞窟で試されるぞ。", texture: "npc" });
    }
    if (!sf.forestCrystalFound) {
      npcs.push({ x: 14, y: 3, text: "待て！ここから先にはクリスタルがある。力で守護者を倒してみせろ！", texture: "npc-quest", story: "forest_guardian", rivalBattle: "forest_guardian", trainerName: "森の守護者", rivalLevel: 14 });
    } else if (!sf.forestRivalBeaten) {
      npcs.push({ x: 14, y: 3, text: "クリスタル…守護者に認められたか。さすがだ！", texture: "npc" });
      npcs.push({ x: 18, y: 8, text: "クリスタルを見つけたの！？ ずるいぞ！ おれとも戦え！", texture: "npc-quest", rivalBattle: "forest_rival", trainerName: "ライバル レン", rivalLevel: 16 });
    } else {
      npcs.push({ x: 14, y: 3, text: "クリスタルの力がこの森を守っている。洞窟にも向かってみよう！", texture: "npc" });
      npcs.push({ x: 18, y: 8, text: "くっ…やるじゃないか。洞窟で待ってるぞ！", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "CRYSTAL_CAVE") {
    const npcs = [
      { x: 12, y: 16, text: "ひかる床では 強いモンスターが出やすいみたい。", texture: "npc" },
      { x: 5, y: 5, text: "闘技場へようこそ！ 3連戦に勝てば豪華報酬だ！", arena: true, texture: "npc-shop" },
      { x: 18, y: 15, text: null, texture: "npc-quest", story: "cave_memory_1" },
    ];
    if (!sf.caveScholarBeaten) {
      npcs.push({ x: 7, y: 14, text: "洞窟では一手のミスが命取りだ。戦術演習を始めよう。", texture: "npc-quest", rivalBattle: "cave_scholar", trainerName: "戦術家 シオン", rivalLevel: 24 });
    } else {
      npcs.push({ x: 7, y: 14, text: "よし、戦術理解は合格だ。次の試練へ進め。", texture: "npc" });
    }
    if (!sf.caveEvilBeaten) {
      npcs.push({ x: 20, y: 5, text: "フフフ…ダーク団の幹部シャドウだ。クリスタルは渡さん！", texture: "npc-quest", rivalBattle: "cave_evil", trainerName: "ダーク団幹部 シャドウ", rivalLevel: 21, isEvil: true });
    } else if (!sf.caveRivalBeaten3) {
      npcs.push({ x: 20, y: 5, text: "…クリスタルは守られた。しかしボス・ライオットが待っているぞ。", texture: "npc" });
      npcs.push({ x: 15, y: 10, text: "ここまで来たか！ 3度目の勝負だ！ 行くぞ！", texture: "npc-quest", rivalBattle: "cave_rival3", trainerName: "ライバル レン", rivalLevel: 23 });
    } else {
      npcs.push({ x: 20, y: 5, text: "…次はダーク団アジトへ向かえ。北の出口から行ける。", texture: "npc" });
      npcs.push({ x: 15, y: 10, text: "おれも強くなったぞ。先に進め！", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "VOLCANIC_PASS") {
    const npcs = [
      { x: 6, y: 18, text: "ここから先は高レベル地帯だ。ボールを多めに持っていけ！", texture: "npc" },
      { x: 14, y: 12, text: "補給所だよ。遠征前に買っていきな！", shop: true, texture: "npc-shop" },
      { x: 10, y: 6, text: null, texture: "npc-quest", story: "volcano_memory_1" },
    ];
    if (!sf.volcanicScoutBeaten) {
      npcs.push({ x: 25, y: 10, text: "斥候任務中だ。ここを抜ける実力、見せてみな！", texture: "npc-quest", rivalBattle: "volcanic_scout", trainerName: "火山斥候 ガロ", rivalLevel: 33 });
    } else {
      npcs.push({ x: 25, y: 10, text: "この熱気で立ち回れるなら、氷峰でも通用するはずだ。", texture: "npc" });
    }
    if (!sf.volcanoEvilBossBeaten) {
      npcs.push({ x: 20, y: 7, text: "ハハハ！ ダーク団のボス、ライオットだ！ エテルナの力はオレのものだ！", texture: "npc-quest", rivalBattle: "volcano_boss", trainerName: "ダーク団ボス ライオット", rivalLevel: 30, isEvil: true, isBossTrainer: true });
    } else {
      npcs.push({ x: 20, y: 7, text: "…貴様め。遺跡のエテルナが目覚める前に止めてみせるか？", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "SKY_RUINS") {
    const npcs = [
      { x: 8, y: 5, text: "遺跡に刻まれた伝説によると…かつて世界を救ったエモじは、今もここで眠っている。", texture: "npc-quest", story: "ruins_elder" },
      { x: 20, y: 4, text: null, texture: "npc-quest", story: "ruins_memory_2" },
    ];
    if (!sf.ruinsGuardianBeaten) {
      npcs.push({ x: 6, y: 14, text: "最後の間へ進む者には、遺跡の掟を示してもらう。受けよ！", texture: "npc-quest", rivalBattle: "ruins_guardian", trainerName: "遺跡の守人 ラカ", rivalLevel: 39, isBossTrainer: true });
    } else {
      npcs.push({ x: 6, y: 14, text: "掟は示された。最奥への扉はきみに開かれた。", texture: "npc" });
    }
    if (!sf.ruinsFinalDone) {
      npcs.push({ x: 14, y: 10, text: "ここが終点だ！ 最後のクリスタルはオレが奪う！ 覚悟しろ！", texture: "npc-quest", rivalBattle: "ruins_final", trainerName: "ダーク団ボス ライオット", rivalLevel: 38, isEvil: true, isBossTrainer: true, isFinalBoss: true });
    } else {
      npcs.push({ x: 14, y: 10, text: "伝説のエモじが守護者に認めた…すごい！", texture: "npc" });
    }
    npcs.push({ x: 24, y: 16, text: "風が強い日は先制技が勝負を分けるぞ。", texture: "npc" });
    return npcs;
  }

  if (mapKey === "DARK_TOWER") {
    const npcs = [
      { x: 5, y: 14, text: "ここはダーク団のアジトだ…！ 引き返したほうがいい！", texture: "npc" },
      { x: 16, y: 14, text: "闇の中でも光を探せ…それがトレーナーってもんだろ。", texture: "npc" },
    ];
    if (!sf.darkTowerSentinelBeaten) {
      npcs.push({ x: 18, y: 5, text: "ここを通るなら番兵戦だ。準備はできてるな？", texture: "npc-quest", rivalBattle: "dark_sentinel", trainerName: "塔の番兵 ノクト", rivalLevel: 29, isEvil: true });
    } else {
      npcs.push({ x: 18, y: 5, text: "…よく通ったな。闇の奥で油断するなよ。", texture: "npc" });
    }
    if (!sf.darkTowerGruntBeaten) {
      npcs.push({ x: 11, y: 9, text: "おい！部外者だ！ ダーク団したっぱの力を見せてやる！", texture: "npc-quest", rivalBattle: "dark_grunt", trainerName: "ダーク団したっぱ", rivalLevel: 22, isEvil: true });
    } else if (!sf.darkTowerVoidBeaten) {
      npcs.push({ x: 11, y: 9, text: "…負けたがボスは奥にいるぞ。", texture: "npc" });
      npcs.push({ x: 11, y: 4, text: "フフフ…幹部ヴォイドの闇の力を味わえ！ クリスタルは頂く！", texture: "npc-quest", rivalBattle: "dark_tower_void", trainerName: "ダーク団幹部 ヴォイド", rivalLevel: 26, isEvil: true, isBossTrainer: true });
    } else {
      npcs.push({ x: 11, y: 4, text: "くそっ…クリスタルは奪えなかった。ライオットに報告しなければ…", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "FROZEN_PEAK") {
    const npcs = [
      { x: 6, y: 16, text: "この山は一年中雪が降っている。氷タイプが多いぞ。", texture: "npc" },
      { x: 20, y: 15, text: "補給所だよ。氷の山は危険だから準備万端で行きな！", shop: true, texture: "npc-shop" },
      { x: 22, y: 5, text: null, texture: "npc-quest", story: "frozen_memory_1" },
    ];
    if (!sf.frozenSageBeaten) {
      npcs.push({ x: 9, y: 6, text: "吹雪で勝つには判断力が要る。山の試験を受けるかい？", texture: "npc-quest", rivalBattle: "frozen_sage", trainerName: "氷峰の賢者 セツナ", rivalLevel: 36, isBossTrainer: true });
    } else {
      npcs.push({ x: 9, y: 6, text: "判断は鋭い。遺跡の最終局面でも迷うな。", texture: "npc" });
    }
    if (!sf.frozenPeakGymCleared) {
      npcs.push({ x: 13, y: 3, text: "ようこそ氷峰ジムへ。ICEの達人、ユキハの氷を砕けるか？", texture: "npc-quest", story: "frozen_gym_intro" });
    } else if (!sf.frozenPeakRivalBeaten) {
      npcs.push({ x: 13, y: 3, text: "見事だ。ジムバッジ2つ目…キミの実力は本物だ。", texture: "npc" });
      npcs.push({ x: 18, y: 8, text: "ジムクリアしたって？ でもおれには勝てないぜ！", texture: "npc-quest", rivalBattle: "frozen_rival", trainerName: "ライバル レン", rivalLevel: 34 });
    } else {
      npcs.push({ x: 13, y: 3, text: "いつでも再挑戦を待っているよ。", texture: "npc" });
      npcs.push({ x: 18, y: 8, text: "…まいった。遺跡で最終決戦だな。先に行くぞ！", texture: "npc" });
    }
    // こおりタイプクエスト
    if (!sf.frozenPeakIceQuest) {
      npcs.push({ x: 3, y: 5, text: "こおりタイプのモンスターを見せてくれないか？ お礼に ハイパーボールをあげるよ！", quest: "ICE_TYPE", texture: "npc-quest" });
    } else {
      npcs.push({ x: 3, y: 5, text: "ありがとう！ こおりタイプは美しいね。", texture: "npc" });
    }
    return npcs;
  }

  if (mapKey === "CELESTIAL_GARDEN") {
    const npcs = [
      { x: 14, y: 16, text: "ここは天空の花園…クリスタルの力で生まれた楽園だ。", texture: "npc" },
      { x: 6, y: 6, text: "伝説のモンスターの気配がする…奥に進んでみては？", texture: "npc-quest" },
      { x: 22, y: 12, text: "ここのモンスターは強い。最強を目指す者だけが来る場所だ。", texture: "npc" },
      { x: 10, y: 4, text: "特別なアイテムがあるよ！", shop: true, texture: "npc-shop" },
      { x: 4, y: 15, text: null, story: "garden_epilogue", texture: "npc-quest" },
    ];
    if (!sf.legendaryDefeated) {
      npcs.push({ x: 14, y: 3, text: null, story: "garden_legendary", texture: "npc-quest" });
    } else {
      npcs.push({ x: 14, y: 3, text: "伝説のエモじが認めし勇者よ…また会おう。", texture: "npc" });
    }
    // 最強トレーナー（クリア後チャレンジ）
    if (sf.ruinsFinalDone) {
      npcs.push({ x: 20, y: 5, text: "世界を救った英雄に挑戦させてくれ！ 最強のトレーナーバトルだ！", texture: "npc-quest", rivalBattle: "garden_champion", trainerName: "チャンピオン アキラ", rivalLevel: 45, isBossTrainer: true });
    }
    return npcs;
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
    for (let x = 1; x < W - 1; x++) map[H - 3][x] = T.PATH;
    for (let x = 1; x < W - 1; x++) map[H - 4][x] = T.PATH;
    for (let y = 3; y < H - 4; y++) map[y][12] = T.PATH;
    for (let y = 3; y < H - 4; y++) map[y][13] = T.PATH;
    for (let y = 3; y <= 8; y++) {
      for (let x = 2; x <= 8; x++) map[y][x] = T.GRASS;
    }
    for (let y = 5; y <= 12; y++) {
      for (let x = 16; x <= 22; x++) map[y][x] = T.GRASS;
    }
    for (let y = 10; y <= 13; y++) {
      for (let x = 3; x <= 7; x++) map[y][x] = T.WATER;
    }
    map[H - 2][1] = T.DOOR;
    map[1][12] = T.DOOR;
    map[2][20] = T.GYM;

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

    for (let y = 1; y < H - 1; y++) {
      map[y][12] = T.PATH;
      map[y][13] = T.PATH;
    }

    for (let x = 3; x <= 8; x++) map[4][x] = T.WALL;
    for (let x = 16; x <= 21; x++) map[6][x] = T.WALL;
    for (let y = 9; y <= 13; y++) map[y][5] = T.WALL;
    for (let y = 9; y <= 13; y++) map[y][19] = T.WALL;

    for (let y = 12; y <= 15; y++) {
      for (let x = 8; x <= 10; x++) map[y][x] = T.WATER;
    }

    for (let y = 3; y <= 8; y++) {
      for (let x = 2; x <= 10; x++) map[y][x] = T.FOREST;
    }
    for (let y = 5; y <= 11; y++) {
      for (let x = 15; x <= 22; x++) map[y][x] = T.FOREST;
    }
    for (let y = 14; y <= 17; y++) {
      for (let x = 16; x <= 22; x++) map[y][x] = T.FOREST;
    }

    map[H - 2][12] = T.DOOR;
    map[1][20] = T.DOOR;
    // ダーク団アジトへの入口（西側）
    map[10][1] = T.DOOR;

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

    for (let y = 4; y <= 9; y++) {
      for (let x = 4; x <= 10; x++) map[y][x] = T.WATER;
    }
    for (let y = 12; y <= 16; y++) {
      for (let x = 18; x <= 25; x++) map[y][x] = T.WATER;
    }

    for (let y = 3; y <= 10; y++) {
      for (let x = 13; x <= 23; x++) map[y][x] = T.FOREST;
    }
    for (let y = 13; y <= 19; y++) {
      for (let x = 2; x <= 11; x++) map[y][x] = T.FOREST;
    }

    for (let x = 2; x <= 26; x++) map[18][x] = T.PATH;
    for (let y = 2; y <= 18; y++) map[y][14] = T.PATH;

    for (let x = 11; x <= 16; x++) map[6][x] = T.WALL;
    for (let y = 8; y <= 14; y++) map[y][22] = T.WALL;

    map[H - 2][3] = T.DOOR;
    map[1][24] = T.DOOR;

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

    for (let x = 2; x < W - 2; x++) {
      map[4][x] = T.PATH;
      map[17][x] = T.PATH;
    }
    for (let y = 4; y <= 17; y++) {
      map[y][5] = T.PATH;
      map[y][24] = T.PATH;
    }

    for (let y = 7; y <= 14; y++) {
      map[y][10] = T.WALL;
      map[y][19] = T.WALL;
    }

    for (let y = 6; y <= 11; y++) {
      for (let x = 12; x <= 17; x++) map[y][x] = T.GRASS;
    }
    for (let y = 12; y <= 16; y++) {
      for (let x = 26; x <= 28; x++) map[y][x] = T.GRASS;
    }

    for (let y = 2; y <= 8; y++) {
      for (let x = 2; x <= 8; x++) map[y][x] = T.FOREST;
    }
    for (let y = 13; y <= 19; y++) {
      for (let x = 21; x <= 27; x++) map[y][x] = T.FOREST;
    }

    map[H - 2][24] = T.DOOR;
    // 天空の花園への入口（クリア後）
    map[1][14] = T.DOOR;

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
    // 内壁で部屋を区切る
    for (let x = 4; x <= 8; x++) map[6][x] = T.WALL;
    for (let x = 13; x <= 17; x++) map[6][x] = T.WALL;
    for (let y = 6; y <= 11; y++) map[y][10] = T.WALL;
    map[8][10] = T.PATH; // 通路
    for (let x = 4; x <= 17; x++) map[11][x] = T.WALL;
    map[11][10] = T.PATH; // 通路
    // 草むら（闇の庭園）
    for (let y = 2; y <= 4; y++) {
      for (let x = 2; x <= 6; x++) map[y][x] = T.FOREST;
    }
    for (let y = 2; y <= 4; y++) {
      for (let x = 15; x <= 19; x++) map[y][x] = T.FOREST;
    }
    for (let y = 13; y <= 15; y++) {
      for (let x = 3; x <= 8; x++) map[y][x] = T.GRASS;
    }
    for (let y = 13; y <= 15; y++) {
      for (let x = 13; x <= 18; x++) map[y][x] = T.GRASS;
    }
    // 入口（南）
    map[H - 2][11] = T.DOOR;
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
    // 氷の道
    for (let x = 2; x < W - 2; x++) map[10][x] = T.PATH;
    for (let y = 3; y <= 16; y++) map[y][12] = T.PATH;
    for (let y = 3; y <= 16; y++) map[y][13] = T.PATH;
    // 雪原（草むら≒吹雪エリア）
    for (let y = 3; y <= 8; y++) {
      for (let x = 2; x <= 9; x++) map[y][x] = T.GRASS;
    }
    for (let y = 12; y <= 17; y++) {
      for (let x = 16; x <= 23; x++) map[y][x] = T.GRASS;
    }
    // 氷の池
    for (let y = 5; y <= 8; y++) {
      for (let x = 17; x <= 20; x++) map[y][x] = T.WATER;
    }
    for (let y = 13; y <= 15; y++) {
      for (let x = 4; x <= 6; x++) map[y][x] = T.WATER;
    }
    // 壁の障害物
    for (let x = 6; x <= 10; x++) map[5][x] = T.WALL;
    for (let y = 12; y <= 16; y++) map[y][10] = T.WALL;
    // ジムタイル
    map[3][13] = T.GYM;
    // ドア
    map[H - 2][3] = T.DOOR;  // 南：マグマ峠へ
    map[1][22] = T.DOOR;      // 北：そらの遺跡へ
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
    // 花園の小道
    for (let x = 2; x < W - 2; x++) map[8][x] = T.PATH;
    for (let x = 2; x < W - 2; x++) map[14][x] = T.PATH;
    for (let y = 2; y <= 17; y++) map[y][8] = T.PATH;
    for (let y = 2; y <= 17; y++) map[y][20] = T.PATH;
    // 花畑（草むら）
    for (let y = 3; y <= 7; y++) {
      for (let x = 2; x <= 7; x++) map[y][x] = T.GRASS;
    }
    for (let y = 3; y <= 7; y++) {
      for (let x = 21; x <= 26; x++) map[y][x] = T.GRASS;
    }
    for (let y = 15; y <= 17; y++) {
      for (let x = 10; x <= 18; x++) map[y][x] = T.GRASS;
    }
    // 天空の森
    for (let y = 9; y <= 13; y++) {
      for (let x = 2; x <= 6; x++) map[y][x] = T.FOREST;
    }
    for (let y = 9; y <= 13; y++) {
      for (let x = 22; x <= 26; x++) map[y][x] = T.FOREST;
    }
    // 聖なる泉
    for (let y = 5; y <= 7; y++) {
      for (let x = 12; x <= 16; x++) map[y][x] = T.WATER;
    }
    // 壁の島
    for (let y = 10; y <= 12; y++) {
      map[y][13] = T.WALL;
      map[y][15] = T.WALL;
    }
    // 入口（南）
    map[H - 2][14] = T.DOOR;
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

  for (let x = 1; x < W - 1; x++) map[7][x] = T.PATH;
  for (let y = 1; y < H - 1; y++) map[y][10] = T.PATH;

  for (let x = 3; x <= 8; x++) map[3][x] = T.WALL;
  for (let x = 3; x <= 8; x++) map[4][x] = T.WALL;
  map[4][6] = T.DOOR;

  for (let x = 12; x <= 17; x++) map[3][x] = T.WALL;
  for (let x = 12; x <= 17; x++) map[4][x] = T.WALL;

  for (let x = 18; x <= 23; x++) map[2][x] = T.WALL;
  for (let x = 18; x <= 23; x++) map[3][x] = T.WALL;
  for (let x = 18; x <= 23; x++) map[4][x] = T.WALL;
  map[4][20] = T.DOOR;

  for (let y = 8; y <= 10; y++) {
    for (let x = 8; x <= 12; x++) map[y][x] = T.PATH;
  }

  for (let y = 11; y <= 17; y++) {
    for (let x = 2; x <= 8; x++) map[y][x] = T.GRASS;
  }

  map[14][15] = T.WATER;
  map[14][16] = T.WATER;
  map[15][15] = T.WATER;
  map[15][16] = T.WATER;

  for (let y = 11; y <= 17; y++) map[y][9] = T.WALL;
  map[13][9] = T.GROUND;

  map[7][W - 1] = T.DOOR;

  mapDef.layout = map;
  return map;
}

export const MAP_FACILITY_MARKERS = {
  EMOJI_TOWN: [
    { x: 6, y: 3, emoji: "💖", label: "回復" },
    { x: 14, y: 3, emoji: "🛒", label: "ショップ" },
  ],
};

// ドア遷移先の定義
export const DOOR_TRANSITIONS = {
  EMOJI_TOWN: [
    { doorCheck: (x, y) => y === 4 && x === 6, target: "HOUSE1", startX: 6, startY: 8 },
    { doorCheck: (x, y) => y === 4 && x === 20, target: "LAB", startX: 7, startY: 8 },
    { doorCheck: (x, y) => x === 24, target: "FOREST", startX: 1, startY: 17 },
  ],
  HOUSE1: [
    { doorCheck: () => true, target: "EMOJI_TOWN", startX: 6, startY: 5 },
  ],
  LAB: [
    { doorCheck: () => true, target: "EMOJI_TOWN", startX: 20, startY: 5 },
  ],
  FOREST: [
    { doorCheck: (x, y) => x === 1 && y === 18, target: "EMOJI_TOWN", startX: 23, startY: 7 },
    { doorCheck: (x, y) => x === 12 && y === 1, target: "CRYSTAL_CAVE", startX: 12, startY: 17 },
  ],
  CRYSTAL_CAVE: [
    { doorCheck: (x, y) => x === 12 && y === 18, target: "FOREST", startX: 12, startY: 2 },
    { doorCheck: (x, y) => x === 20 && y === 1, target: "VOLCANIC_PASS", startX: 3, startY: 20 },
    { doorCheck: (x, y) => x === 1 && y === 10, target: "DARK_TOWER", startX: 11, startY: 16 },
  ],
  VOLCANIC_PASS: [
    { doorCheck: (x, y) => x === 3 && y === 20, target: "CRYSTAL_CAVE", startX: 20, startY: 2 },
    { doorCheck: (x, y) => x === 24 && y === 1, target: "FROZEN_PEAK", startX: 3, startY: 18 },
  ],
  DARK_TOWER: [
    { doorCheck: (x, y) => x === 11 && y === 16, target: "CRYSTAL_CAVE", startX: 2, startY: 10 },
  ],
  FROZEN_PEAK: [
    { doorCheck: (x, y) => x === 3 && y === 18, target: "VOLCANIC_PASS", startX: 24, startY: 2 },
    { doorCheck: (x, y) => x === 22 && y === 1, target: "SKY_RUINS", startX: 24, startY: 20 },
  ],
  SKY_RUINS: [
    { doorCheck: (x, y) => x === 24 && y === 20, target: "FROZEN_PEAK", startX: 22, startY: 2 },
    { doorCheck: (x, y) => x === 14 && y === 1, target: "CELESTIAL_GARDEN", startX: 14, startY: 18 },
  ],
  CELESTIAL_GARDEN: [
    { doorCheck: (x, y) => x === 14 && y === 18, target: "SKY_RUINS", startX: 14, startY: 2 },
  ],
};

export const SWIMMABLE_WATER_TILES = {
  FOREST: [
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 5, y: 12 },
    { x: 5, y: 13 },
  ],
};

export const FIRE_ICE_BLOCKS = {
  VOLCANIC_PASS: [
    { x: 17, y: 18, id: "volcano_ice_gate_1" },
    { x: 18, y: 18, id: "volcano_ice_gate_2" },
  ],
};

export const FIELD_HIDDEN_ITEMS = {
  FOREST: [
    {
      id: "forest_islet_cache",
      x: 5,
      y: 11,
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
      x: 18,
      y: 15,
      requiredType: "ELECTRIC",
      itemId: "ULTRA_BALL",
      quantity: 1,
      message: "⚡ ひかりで暗闇を照らした！ 見えない宝箱からエリートボールを見つけた！",
      flagKey: "caveHiddenItemFound",
      markerEmoji: "✨",
    },
  ],
};
