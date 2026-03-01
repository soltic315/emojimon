import { FONT, drawSelection } from "../../ui/UIHelper.ts";
import { addCameraBloom, addGlow, addShine } from "../../ui/FXHelper.ts";
import { gsap } from "gsap";

type TitleSceneLike = Phaser.Scene & Record<string, any>;

const FLOATING_EMOJIS = ["🧸", "💧", "🍃", "⭐", "🔥", "🐢", "💎", "🐾", "🌙", "🌋", "🦭", "🌵"];

export function createTitleVisuals(scene: TitleSceneLike): void {
  const { width, height } = scene.scale;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x0b1222, 0x1e293b, 0x020617, 0x0a1020, 1);
  bg.fillRect(0, 0, width, height);

  const deco = scene.add.graphics();
  deco.lineStyle(1, 0x1e293b, 0.3);
  for (let i = 0; i < 12; i++) {
    deco.lineBetween(0, height * 0.1 + i * 40, width, height * 0.05 + i * 40);
  }

  const shine = scene.add.rectangle(-120, height * 0.28, 170, height * 0.9, 0xf8fafc, 0.05)
    .setAngle(-24)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: shine,
    x: width + 160,
    duration: 6800,
    repeat: -1,
    ease: "sine.inOut",
  });

  scene.floatingEmojis = [];
  for (let i = 0; i < 20; i++) {
    const emoji = FLOATING_EMOJIS[i % FLOATING_EMOJIS.length];
    const x = Math.random() * width;
    const y = Math.random() * height;
    const text = scene.add.text(x, y, emoji, {
      fontSize: 14 + Math.random() * 18,
    }).setAlpha(0.1 + Math.random() * 0.15);
    scene.floatingEmojis.push({
      text,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.15 - Math.random() * 0.25,
    });
  }

  const glow = scene.add.circle(width / 2, height * 0.22, 100, 0xfbbf24, 0.06);
  scene.tweens.add({
    targets: glow,
    radius: 120,
    alpha: 0.03,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  const titleShadow = scene.add.text(width / 2 + 3, height * 0.22 + 3, "EMOJIMON", {
    fontFamily: FONT.TITLE,
    fontSize: 64,
    fontStyle: "800",
    color: "#000000",
  }).setOrigin(0.5).setAlpha(0.5);

  const title = scene.add.text(width / 2, height * 0.22, "EMOJIMON", {
    fontFamily: FONT.TITLE,
    fontSize: 64,
    fontStyle: "800",
    color: "#fde68a",
    stroke: "#92400e",
    strokeThickness: 6,
    shadow: { offsetX: 0, offsetY: 4, color: "#000000", blur: 16, fill: true },
  }).setOrigin(0.5);

  addGlow(title, { color: 0xfbbf24, outerStrength: 6, innerStrength: 2 });
  addShine(title, { speed: 0.3, lineWidth: 0.4, gradient: 4 });
  addCameraBloom(scene.cameras.main, { strength: 1.0, blurStrength: 0.6, steps: 3 });

  scene.tweens.add({
    targets: [title, titleShadow],
    y: "-=6",
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  const subtitle = scene.add.text(width / 2, height * 0.35, "〜 絵文字モンスターの世界へようこそ 〜", {
    fontFamily: FONT.UI,
    fontSize: 15,
    fontStyle: "500",
    color: "#94a3b8",
    align: "center",
  }).setOrigin(0.5);
  scene.tweens.add({
    targets: subtitle,
    alpha: 0.5,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  scene.add.text(width - 16, 8, `v${__APP_VERSION__}`, {
    fontFamily: FONT.MONO,
    fontSize: 11,
    color: "#374151",
  }).setOrigin(1, 0);

  scene.menuOptions = [];
  if (scene.hasSave) {
    scene.menuOptions.push({ label: "つづきから", action: "continue" });
  }
  scene.menuOptions.push({ label: "はじめから", action: "new" });
  scene.menuOptions.push({ label: "設定", action: "settings" });

  scene.menuTexts = [];
  scene.menuBgs = [];
  scene.menuCards = [];
  const menuStartY = height * 0.5;
  const menuSpacing = 44;

  scene.menuOptions.forEach((opt: { label: string }, i: number) => {
    const y = menuStartY + i * menuSpacing;

    const menuCard = scene.rexUI?.add
      .roundRectangle(width / 2, y, 320, 40, 12, 0x0f172a, 0.62)
      .setStrokeStyle(1, 0x334155, 0.75);
    if (menuCard) {
      scene.menuCards.push(menuCard);
    }

    const menuBg = scene.add.graphics();
    scene.menuBgs.push(menuBg);

    const text = scene.add.text(width / 2, y, opt.label, {
      fontFamily: FONT.UI,
      fontSize: 21,
      fontStyle: "700",
      color: "#e5e7eb",
      padding: { x: 24, y: 8 },
    }).setOrigin(0.5);
    scene.menuTexts.push(text);
  });

  updateTitleMenuDisplay(scene);

  scene.hintText = scene.add.text(width / 2, height - 62, "↑↓：えらぶ  Z/Enter：けってい", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#94a3b8",
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: scene.hintText,
    alpha: 0.3,
    duration: 1200,
    yoyo: true,
    repeat: -1,
  });

  scene.add.text(width / 2, height - 22, "© 2026 EMOJIMON Project", {
    fontFamily: "system-ui, sans-serif",
    fontSize: 11,
    color: "#64748b",
  }).setOrigin(0.5);
}

export function updateFloatingEmojis(scene: TitleSceneLike): void {
  const { width, height } = scene.scale;
  scene.floatingEmojis.forEach((e: { text: Phaser.GameObjects.Text; speedX: number; speedY: number }) => {
    e.text.x += e.speedX;
    e.text.y += e.speedY;
    if (e.text.y < -30) {
      e.text.y = height + 20;
      e.text.x = Math.random() * width;
    }
    if (e.text.x < -30) e.text.x = width + 20;
    if (e.text.x > width + 30) e.text.x = -20;
  });
}

export function updateTitleMenuDisplay(scene: TitleSceneLike): void {
  const { width } = scene.scale;
  scene.menuTexts.forEach((text: Phaser.GameObjects.Text, i: number) => {
    const selected = i === scene.selectedIndex;
    text.setColor(selected ? "#fde68a" : "#e5e7eb");
    text.setFontSize(selected ? 23 : 21);

    const label = scene.menuOptions[i].label;
    text.setText(selected ? `▶ ${label}` : `  ${label}`);

    gsap.killTweensOf(text);
    gsap.to(text, {
      x: selected ? width / 2 + 4 : width / 2,
      duration: 0.18,
      ease: "power2.out",
    });

    const menuCard = scene.menuCards?.[i];
    if (menuCard) {
      menuCard.setFillStyle(selected ? 0x1f2937 : 0x0f172a, selected ? 0.92 : 0.62);
      menuCard.setStrokeStyle(selected ? 2 : 1, selected ? 0xfbbf24 : 0x334155, selected ? 0.95 : 0.75);
      gsap.killTweensOf(menuCard);
      gsap.to(menuCard, {
        scaleX: selected ? 1.03 : 1,
        scaleY: selected ? 1.03 : 1,
        duration: 0.18,
        ease: "power2.out",
      });
    }

    scene.menuBgs[i].clear();
    if (selected) {
      drawSelection(scene.menuBgs[i], width / 2 - 156, text.y - 18, 312, 40, { radius: 10 });
    }
  });
}
