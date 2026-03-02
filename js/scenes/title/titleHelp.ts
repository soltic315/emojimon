import { FONT, drawPanel } from "../../ui/UIHelper.ts";

type TitleSceneLike = Phaser.Scene & Record<string, any>;

export function showHelp(scene: TitleSceneLike): void {
  scene.helpVisible = true;
  const { width, height } = scene.scale;

  scene.helpPanel = scene.add.container(0, 0);

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
  scene.helpPanel.add(overlay);

  const panelBg = scene.add.graphics();
  drawPanel(panelBg, 52, 34, width - 104, height - 68, { headerHeight: 42, glow: true });
  scene.helpPanel.add(panelBg);

  const helpTitle = scene.add.text(width / 2, 64, "あそびかた", {
    fontFamily: FONT.UI,
    fontSize: 22,
    color: "#fbbf24",
  }).setOrigin(0.5);
  scene.helpPanel.add(helpTitle);

  const helpContent = [
    "【タイトル/メニュー】",
    "  ↑↓   : えらぶ",
    "  Z/Enter/Space : けってい",
    "  X/ESC : もどる",
    "",
    "【フィールド】",
    "  ←↑→↓ : いどう",
    "  Z     : はなす / アクション",
    "  ↑↓ 長押し : リスト高速いどう",
    "",
    "【バトル】",
    "  ↑↓   : コマンド・わざをえらぶ",
    "  Z     : けってい",
    "  X     : キャンセル",
    "",
    "【タッチ】",
    "  画面ボタン: けってい / もどる / いどう",
    "",
    "【ヒント】",
    "  草むらを歩くとモンスターに出会うよ！",
    "  タイプ相性：🔥→🍃→💧→🔥",
  ];

  const helpSizer = scene.rexUI?.add.sizer({
    x: width / 2,
    y: height / 2 + 6,
    width: width - 150,
    height: height - 120,
    orientation: "y",
    space: {
      left: 20,
      right: 20,
      top: 14,
      bottom: 14,
      item: 8,
    },
  });

  if (helpSizer) {
    helpSizer.addBackground(
      scene.rexUI.add
        .roundRectangle(0, 0, 0, 0, 12, 0x0f172a, 0.72)
        .setStrokeStyle(1, 0x334155, 0.75)
    );

    const sectionTitle = scene.rexUI.add.label({
      background: scene.rexUI.add
        .roundRectangle(0, 0, 0, 0, 8, 0x111827, 0.8)
        .setStrokeStyle(1, 0x334155, 0.75),
      text: scene.add.text(0, 0, "ガイド", {
        fontFamily: FONT.UI,
        fontSize: 14,
        color: "#fde68a",
      }),
      align: "center",
      space: {
        left: 12,
        right: 12,
        top: 5,
        bottom: 5,
      },
    });

    const helpText = scene.add.text(0, 0, helpContent.join("\n"), {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#e2e8f0",
      lineSpacing: 6,
    });

    const closeHint = scene.add.text(0, 0, "X キーでとじる", {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: "#94a3b8",
    }).setOrigin(0.5, 0.5);

    helpSizer.add(sectionTitle, {
      proportion: 0,
      expand: true,
      align: "center",
      padding: { bottom: 4 },
    });
    helpSizer.add(helpText, {
      proportion: 1,
      expand: true,
      align: "left",
    });
    helpSizer.add(closeHint, {
      proportion: 0,
      align: "center",
    });

    helpSizer.layout();
    scene.helpPanel.add(helpSizer);
  }
}

export function hideHelp(scene: TitleSceneLike): void {
  scene.helpVisible = false;
  if (scene.helpPanel) {
    scene.helpPanel.destroy(true);
    scene.helpPanel = null;
  }
}
