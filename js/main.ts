import { BootScene } from "./scenes/BootScene.ts";
import { TitleScene } from "./scenes/TitleScene.ts";
import { WorldScene } from "./scenes/WorldScene.ts";
import { BattleScene } from "./scenes/BattleScene.ts";
import { MenuScene } from "./scenes/MenuScene.ts";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-frame",
  pixelArt: true,
  backgroundColor: "#000000",
  input: {
    activePointers: 3,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  plugins: {
    scene: [
      {
        key: "rexUI",
        plugin: RexUIPlugin,
        mapping: "rexUI",
      },
    ],
  },
  scene: [BootScene, TitleScene, WorldScene, BattleScene, MenuScene],
};

window.addEventListener("load", () => {
  new Phaser.Game(config);
});

