import { gameState } from "../../../state/gameState.ts";
import { FONT, drawPanel } from "../../../ui/UIHelper.ts";
import { SUB_PANEL_WIDTH_OFFSET } from "../menuViewsShared.ts";

function formatQuestLine(label, done) {
  return `${label} : ${done ? "✅ 完了" : "📋 進行中"}`;
}

function getQuestProgressHint(quest) {
  const steps = Array.isArray(quest.steps) ? quest.steps : [];
  if (steps.length === 0) {
    return {
      doneCount: quest.done ? 1 : 0,
      totalCount: 1,
      hint: quest.done ? "達成済み" : (quest.defaultHint || "手がかりを探そう"),
    };
  }

  const doneCount = steps.filter((step) => step.done).length;
  if (quest.done || doneCount >= steps.length) {
    return {
      doneCount: steps.length,
      totalCount: steps.length,
      hint: "達成済み",
    };
  }

  const nextStep = steps.find((step) => !step.done);
  return {
    doneCount,
    totalCount: steps.length,
    hint: nextStep?.hint || nextStep?.label || "手がかりを探そう",
  };
}

function isEliteFourCleared(storyFlags) {
  return !!(
    storyFlags?.eliteFourWind
    && storyFlags?.eliteFourFlame
    && storyFlags?.eliteFourTide
    && storyFlags?.eliteFourFrost
  );
}

export function renderQuestView(scene) {
  const { width, height } = scene.scale;
  const panelW = width - SUB_PANEL_WIDTH_OFFSET;
  const panelX = 10;
  const panelY = 10;

  const bg = scene.add.graphics();
  drawPanel(bg, panelX, panelY, panelW, height - 20, { radius: 12, headerHeight: 24 });
  scene.subPanel.add(bg);

  const sf = gameState.storyFlags;

  const storyQuests = [
    {
      label: "ライバル初戦",
      done: !!sf.townRivalBeaten,
      steps: [{ label: "えもじタウンのライバルに挑戦", done: !!sf.townRivalBeaten, hint: "えもじタウンでライバルに話しかけよう" }],
    },
    {
      label: "森ジム制覇",
      done: !!gameState.gymCleared,
      steps: [{ label: "森ジムをクリア", done: !!gameState.gymCleared, hint: "FOREST のジムに挑戦しよう" }],
    },
    {
      label: "ダークタワー制圧",
      done: !!sf.darkTowerVoidBeaten,
      steps: [{ label: "ダークタワーのボスを撃破", done: !!sf.darkTowerVoidBeaten, hint: "DARK_TOWER の最深部へ進もう" }],
    },
    {
      label: "氷峰ジム制覇",
      done: !!sf.frozenPeakGymCleared,
      steps: [{ label: "氷峰ジムをクリア", done: !!sf.frozenPeakGymCleared, hint: "FROZEN_PEAK のジムリーダーを倒そう" }],
    },
    {
      label: "空の遺跡最終決戦",
      done: !!sf.ruinsFinalDone,
      steps: [{ label: "遺跡の最終決戦に勝利", done: !!sf.ruinsFinalDone, hint: "SKY_RUINS の奥へ進もう" }],
    },
    {
      label: "星降り盆地 最終ライバル",
      done: !!sf.basinFinalRival,
      steps: [{ label: "最終ライバルに勝利", done: !!sf.basinFinalRival, hint: "STARFALL_BASIN の最終戦を突破しよう" }],
    },
    {
      label: "伝説討伐",
      done: !!sf.legendaryDefeated,
      steps: [{ label: "花園の伝説を制覇", done: !!sf.legendaryDefeated, hint: "CELESTIAL_GARDEN で伝説に挑戦しよう" }],
    },
  ];

  const regionalChainAllDone =
    !!sf.swampRemedyQuestDone
    && !!sf.coralArchivistQuestDone
    && !!sf.libraryRestorationQuestDone
    && !!sf.starResearchQuestDone;

  const swampQuestTriggered =
    gameState.hasVisitedMap("MISTY_SWAMP")
    || !!sf.swampTabletRead
    || !!sf.swampHerbFound
    || !!sf.swampRangerBeaten
    || !!sf.swampRemedyQuestDone;

  const coralQuestTriggered =
    gameState.hasVisitedMap("CORAL_REEF")
    || !!sf.coralLegendRead
    || !!sf.coralPearlFound
    || !!sf.coralWaterQuest
    || !!sf.coralArchivistQuestDone
    || !!sf.swampRemedyQuestDone;

  const libraryQuestTriggered =
    gameState.hasVisitedMap("ANCIENT_LIBRARY")
    || !!sf.libraryCodexRead
    || !!sf.shadowDataFound
    || !!sf.librarySecretArchiveFound
    || !!sf.libraryRestorationQuestDone
    || !!sf.coralArchivistQuestDone;

  const starResearchTriggered =
    gameState.hasVisitedMap("STARFALL_BASIN")
    || !!sf.basinLoreRead
    || !!sf.basinStarFound
    || !!sf.basinMeteorShardFound
    || !!sf.starResearchQuestDone
    || !!sf.libraryRestorationQuestDone;

  const sideQuests = [
    {
      label: "スターライト依頼",
      done: !!gameState.starQuestDone,
      revealed: !!sf.prologueDone || !!gameState.starQuestDone,
      steps: [{ label: "スターライトを手持ちに入れる", done: !!gameState.starQuestDone, hint: "依頼人に話しかけて条件を確認しよう" }],
    },
    {
      label: "氷峰アイスタイプ編成",
      done: !!sf.frozenPeakIceQuest,
      revealed: gameState.hasVisitedMap("FROZEN_PEAK") || !!sf.frozenPeakIceQuest,
      steps: [{ label: "こおりタイプを1体連れて報告", done: !!sf.frozenPeakIceQuest, hint: "FROZEN_PEAK の依頼人に話しかけよう" }],
    },
    {
      label: "珊瑚みずタイプ編成",
      done: !!sf.coralWaterQuest,
      revealed: gameState.hasVisitedMap("CORAL_REEF") || !!sf.coralWaterQuest,
      steps: [{ label: "みずタイプを3体連れて報告", done: !!sf.coralWaterQuest, hint: "CORAL_REEF で依頼人に再報告しよう" }],
    },
    {
      label: "湿地の調合依頼",
      done: !!sf.swampRemedyQuestDone,
      revealed: swampQuestTriggered,
      steps: [
        { label: "湿地石板を読む", done: !!sf.swampTabletRead, hint: "MISTY_SWAMP の石板を調べよう" },
        { label: "湿地の薬草を回収", done: !!sf.swampHerbFound, hint: "湿地の探索ポイントを探そう" },
        { label: "湿地レンジャー試験を突破", done: !!sf.swampRangerBeaten, hint: "湿地のトレーナーに挑戦しよう" },
      ],
    },
    {
      label: "珊瑚の記録復元",
      done: !!sf.coralArchivistQuestDone,
      revealed: coralQuestTriggered,
      steps: [
        { label: "連鎖1段階を完了", done: !!sf.swampRemedyQuestDone, hint: "湿地の調合依頼を終わらせよう" },
        { label: "珊瑚碑の伝承を読む", done: !!sf.coralLegendRead, hint: "CORAL_REEF の碑文を確認しよう" },
        { label: "真珠を回収", done: !!sf.coralPearlFound, hint: "珊瑚エリアの探索ポイントを探そう" },
        { label: "みずタイプ3体の証明", done: !!sf.coralWaterQuest, hint: "みずタイプ編成クエストを完了しよう" },
      ],
    },
    {
      label: "図書館文献復元",
      done: !!sf.libraryRestorationQuestDone,
      revealed: libraryQuestTriggered,
      steps: [
        { label: "連鎖2段階を完了", done: !!sf.coralArchivistQuestDone, hint: "珊瑚の記録復元を完了しよう" },
        { label: "古代写本を読む", done: !!sf.libraryCodexRead, hint: "ANCIENT_LIBRARY の写本を調べよう" },
        { label: "影の森データを回収", done: !!sf.shadowDataFound, hint: "SHADOW_GROVE の探索を進めよう" },
        { label: "図書館の封庫を発見", done: !!sf.librarySecretArchiveFound, hint: "図書館の隠し探索ポイントを探そう" },
      ],
    },
    {
      label: "星降り観測最終報告",
      done: !!sf.starResearchQuestDone,
      revealed: starResearchTriggered,
      steps: [
        { label: "連鎖3段階を完了", done: !!sf.libraryRestorationQuestDone, hint: "図書館文献復元を終わらせよう" },
        { label: "遺跡最終決戦を突破", done: !!sf.ruinsFinalDone, hint: "SKY_RUINS の最終決戦に勝とう" },
        { label: "星読碑を解析", done: !!sf.basinLoreRead, hint: "STARFALL_BASIN の石碑を調べよう" },
        { label: "星核サンプルを回収", done: !!sf.basinStarFound, hint: "盆地の探索ポイントを探そう" },
        { label: "隕石片サンプルを回収", done: !!sf.basinMeteorShardFound, hint: "盆地で追加素材を集めよう" },
      ],
    },
    {
      label: "地域連鎖・記念報酬",
      done: !!sf.regionalQuestChainBonusClaimed,
      revealed: !!sf.starResearchQuestDone || !!sf.regionalQuestChainBonusClaimed,
      steps: [
        { label: "湿地の調合依頼", done: !!sf.swampRemedyQuestDone, hint: "湿地の依頼を達成しよう" },
        { label: "珊瑚の記録復元", done: !!sf.coralArchivistQuestDone, hint: "珊瑚の依頼を達成しよう" },
        { label: "図書館文献復元", done: !!sf.libraryRestorationQuestDone, hint: "図書館の依頼を達成しよう" },
        { label: "星降り観測最終報告", done: !!sf.starResearchQuestDone, hint: "星降りの依頼を達成しよう" },
        {
          label: "記念報酬を受け取る",
          done: !!sf.regionalQuestChainBonusClaimed,
          hint: regionalChainAllDone ? "依頼NPCに報告して記念報酬を受け取ろう" : "4地域の連鎖依頼をすべて完了しよう",
        },
      ],
    },
  ];

  const eliteFourCleared = isEliteFourCleared(sf);
  const postgameGoals = [
    {
      label: "天空の花園の伝説を制覇",
      done: !!sf.legendaryDefeated,
      revealed: !!sf.ruinsFinalDone || !!sf.legendaryDefeated,
      steps: [
        { label: "遺跡最終決戦を突破", done: !!sf.ruinsFinalDone, hint: "まずは本編の最終決戦を突破しよう" },
        { label: "花園の伝説を制覇", done: !!sf.legendaryDefeated, hint: "CELESTIAL_GARDEN で伝説に挑戦しよう" },
      ],
    },
    {
      label: "星降り盆地で四天王を制覇",
      done: eliteFourCleared,
      revealed:
        !!sf.legendaryDefeated
        || !!sf.eliteFourWind
        || !!sf.eliteFourFlame
        || !!sf.eliteFourTide
        || !!sf.eliteFourFrost,
      steps: [
        { label: "風の四天王", done: !!sf.eliteFourWind, hint: "STARFALL_BASIN の四天王1人目に挑戦" },
        { label: "炎の四天王", done: !!sf.eliteFourFlame, hint: "四天王2人目を撃破しよう" },
        { label: "潮の四天王", done: !!sf.eliteFourTide, hint: "四天王3人目を撃破しよう" },
        { label: "氷の四天王", done: !!sf.eliteFourFrost, hint: "四天王4人目を撃破しよう" },
      ],
    },
    {
      label: "星降り盆地 最終ライバルに勝利",
      done: !!sf.basinFinalRival,
      revealed: eliteFourCleared || !!sf.basinFinalRival,
      steps: [
        { label: "四天王制覇", done: eliteFourCleared, hint: "先に四天王をすべて撃破しよう" },
        { label: "最終ライバルに勝利", done: !!sf.basinFinalRival, hint: "解放後に最終ライバルへ挑戦しよう" },
      ],
    },
  ];

  const visibleSideQuests = sideQuests.filter((entry) => entry.revealed ?? true);
  const visiblePostgameGoals = postgameGoals.filter((entry) => entry.revealed ?? true);

  const storyDone = storyQuests.filter((entry) => entry.done).length;
  const sideDone = visibleSideQuests.filter((entry) => entry.done).length;
  const totalDone = storyDone + sideDone;
  const totalCount = storyQuests.length + visibleSideQuests.length;

  const title = scene.add.text(panelX + 16, panelY + 10, `📜 クエスト  ${totalDone}/${totalCount}`, {
    fontFamily: FONT.UI,
    fontSize: 18,
    color: "#fbbf24",
  });
  scene.subPanel.add(title);

  const info = [
    `ストーリー進捗 : ${storyDone}/${storyQuests.length}`,
    `サブクエスト : ${sideDone}/${visibleSideQuests.length}`,
    "",
    "── ストーリークエスト ──",
    ...storyQuests.flatMap((entry) => {
      const progress = getQuestProgressHint(entry);
      return [
        formatQuestLine(entry.label, entry.done),
        `　進捗 ${progress.doneCount}/${progress.totalCount} ｜ ヒント: ${progress.hint}`,
      ];
    }),
    "",
    "── サブクエスト ──",
    ...(visibleSideQuests.length > 0
      ? visibleSideQuests.flatMap((entry) => {
        const progress = getQuestProgressHint(entry);
        return [
          formatQuestLine(entry.label, entry.done),
          `　進捗 ${progress.doneCount}/${progress.totalCount} ｜ ヒント: ${progress.hint}`,
        ];
      })
      : ["（条件を満たすと表示されます）"]),
    "",
    "── ポストゲーム目標 ──",
    ...(visiblePostgameGoals.length > 0
      ? visiblePostgameGoals.flatMap((entry) => {
        const progress = getQuestProgressHint(entry);
        return [
          formatQuestLine(entry.label, entry.done),
          `　進捗 ${progress.doneCount}/${progress.totalCount} ｜ ヒント: ${progress.hint}`,
        ];
      })
      : ["（条件を満たすと表示されます）"]),
  ];

  const lineH = 22;
  const listTop = panelY + 44;
  const listBottom = height - 52;
  const visibleCount = Math.max(1, Math.floor((listBottom - listTop) / lineH));
  const maxStart = Math.max(0, info.length - visibleCount);
  scene.subMenuIndex = Phaser.Math.Clamp(scene.subMenuIndex, 0, maxStart);

  for (let visibleIndex = 0; visibleIndex < visibleCount; visibleIndex++) {
    const lineIndex = scene.subMenuIndex + visibleIndex;
    if (lineIndex >= info.length) break;
    const line = info[lineIndex];
    const y = listTop + visibleIndex * lineH;
    const text = scene.add.text(panelX + 24, y, line, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: line.startsWith("──") ? "#fbbf24" : "#d1d5db",
      wordWrap: { width: panelW - 48 },
    });
    scene.subPanel.add(text);
  }

  if (maxStart > 0) {
    const hint = scene.add.text(panelX + 16, height - 30, "↑↓:スクロール  X:もどる", {
      fontFamily: FONT.UI,
      fontSize: 11,
      color: "#6b7280",
    });
    scene.subPanel.add(hint);
  }
}