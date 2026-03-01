import { gameState } from "../state/gameState.ts";
import { audioManager } from "../audio/AudioManager.ts";
import { FONT } from "../ui/UIHelper.ts";

export class PrologueScene extends Phaser.Scene {
  constructor() {
    super("PrologueScene");
  }

  create() {
    const { width, height } = this.scale;

    this.lines = [
      "── ここは『エモじワールド』。",
      "── 人とモンスターが共に暮らす、不思議な世界。",
      "── モンスターたちは『エモじ』と呼ばれる絵文字の姿をしており、",
      "── それぞれが 炎、水、草…さまざまな力を宿している。",
      "── この世界の秩序は 5つの『エモじクリスタル』によって保たれてきた。",
      "── しかし今、悪の組織『ダーク団』がクリスタルを狙い 暗躍を始めている…。",
      "── クリスタルは 森、洞窟、塔、火山、遺跡の各地に封じられているという。",
      "── すべての結晶が揃うと、天空の花園に古い門が開くと伝えられている。",
      `── そんな中、${gameState.playerName}は ハカセからの手紙を受け取り、`,
      "── エモじタウンの研究所を訪れることになった。",
      "▶ Z/Enter/Space で次へ ・ X/ESC でスキップ",
    ];
    this.lineIndex = 0;

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 1);

    this.titleText = this.add.text(width / 2, 58, "プロローグ", {
      fontFamily: FONT.UI,
      fontSize: 22,
      color: "#fde68a",
      fontStyle: "700",
    }).setOrigin(0.5);

    const bodyBg = this.add.graphics();
    bodyBg.fillStyle(0x0f172a, 0.88);
    bodyBg.fillRoundedRect(44, 106, width - 88, height - 186, 14);
    bodyBg.lineStyle(2, 0x334155, 0.9);
    bodyBg.strokeRoundedRect(44, 106, width - 88, height - 186, 14);

    this.bodyText = this.add.text(72, 136, "", {
      fontFamily: FONT.UI,
      fontSize: 20,
      color: "#e5e7eb",
      wordWrap: { width: width - 144 },
      lineSpacing: 8,
    });

    this.hintText = this.add.text(width / 2, height - 36, "Z/Enter/Space: 次へ  X/ESC: スキップ", {
      fontFamily: FONT.UI,
      fontSize: 14,
      color: "#94a3b8",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.hintText,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.input.keyboard.on("keydown-Z", () => this.nextLine());
    this.input.keyboard.on("keydown-ENTER", () => this.nextLine());
    this.input.keyboard.on("keydown-SPACE", () => this.nextLine());
    this.input.keyboard.on("keydown-X", () => this.finishPrologue());
    this.input.keyboard.on("keydown-ESC", () => this.finishPrologue());

    this.cameras.main.fadeIn(280, 0, 0, 0);
    this.renderCurrentLine();
  }

  nextLine() {
    audioManager.playCursor();
    this.lineIndex += 1;
    if (this.lineIndex >= this.lines.length) {
      this.finishPrologue();
      return;
    }
    this.renderCurrentLine();
  }

  renderCurrentLine() {
    const line = this.lines[this.lineIndex] || "";
    this.bodyText.setText(line);
  }

  finishPrologue() {
    if (this._prologueFinished) return;
    this._prologueFinished = true;
    gameState.storyFlags.introNarrationDone = true;
    audioManager.playConfirm();
    this.cameras.main.fadeOut(380, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("WorldScene", { mapKey: "LAB", startX: 7, startY: 8 });
    });
  }
}
