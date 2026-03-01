import { audioManager } from "../../audio/AudioManager.ts";

type MenuSceneLike = Phaser.Scene & Record<string, any>;

type VerticalRepeatInputArgs = {
  isUpDown: boolean;
  isDownDown: boolean;
  isUpHeld: boolean;
  isDownHeld: boolean;
  holdDirectionKey: string;
  nextRepeatAtKey: string;
  onUp: () => void;
  onDown: () => void;
};

export function handleVerticalRepeatInput(scene: MenuSceneLike, {
  isUpDown,
  isDownDown,
  isUpHeld,
  isDownHeld,
  holdDirectionKey,
  nextRepeatAtKey,
  onUp,
  onDown,
}: VerticalRepeatInputArgs) {
  const now = scene.time.now;

  if (isUpDown) {
    scene[holdDirectionKey] = -1;
    scene[nextRepeatAtKey] = now + scene.navRepeatDelayMs;
    audioManager.playCursor();
    onUp();
    return;
  }

  if (isDownDown) {
    scene[holdDirectionKey] = 1;
    scene[nextRepeatAtKey] = now + scene.navRepeatDelayMs;
    audioManager.playCursor();
    onDown();
    return;
  }

  const holdDirection = isUpHeld ? -1 : isDownHeld ? 1 : 0;
  if (holdDirection === 0) {
    scene[holdDirectionKey] = 0;
    return;
  }

  if (scene[holdDirectionKey] !== holdDirection) {
    scene[holdDirectionKey] = holdDirection;
    scene[nextRepeatAtKey] = now + scene.navRepeatDelayMs;
    return;
  }

  if (now >= scene[nextRepeatAtKey]) {
    scene[nextRepeatAtKey] = now + scene.navRepeatIntervalMs;
    audioManager.playCursor();
    if (holdDirection < 0) onUp();
    else onDown();
  }
}
