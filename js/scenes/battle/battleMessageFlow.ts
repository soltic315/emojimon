import { BattleState } from "./battleConstants.ts";
import { gameState } from "../../state/gameState.ts";

export function resolveBattleSpeedMultiplier(scene: any) {
  const speed = gameState.gameplaySettings?.battleSpeed;
  if (speed === "FAST") return 1.3;
  if (speed === "TURBO") return 1.65;
  return 1;
}

export function clearMessageAutoAdvanceEvent(scene: any) {
  if (scene.messageAutoAdvanceEvent) {
    scene.messageAutoAdvanceEvent.remove(false);
    scene.messageAutoAdvanceEvent = null;
  }
}

export function scheduleMessageAutoAdvance(scene: any, text: string) {
  if (!scene.autoAdvanceMessagesEnabled) return;
  clearMessageAutoAdvanceEvent(scene);
  const safeLength = Math.max(0, String(text || "").length);
  const baseDelay = Phaser.Math.Clamp(520 + safeLength * 20, 560, 1850);
  const adjustedDelay = Math.max(280, Math.floor(baseDelay / scene.battleSpeedMultiplier));
  scene.messageAutoAdvanceEvent = scene.time.delayedCall(adjustedDelay, () => {
    scene.messageAutoAdvanceEvent = null;
    if (!scene.currentMessage || scene.state === BattleState.ANIMATING) return;
    scene.showNextMessage();
  });
}

export function resetMessageFastForward(scene: any) {
  scene.messageFastForwardHoldMs = 0;
  scene.messageFastForwardCooldownMs = 0;
}

export function isFastForwardHeld(scene: any) {
  const keyboardHold = scene.keys?.Z?.isDown || scene.keys?.ENTER?.isDown || scene.keys?.SPACE?.isDown;
  const touchHold = scene.touchControls?.visible && scene.touchControls.isConfirmHeld();
  return !!(keyboardHold || touchHold);
}

export function updateMessageFastForward(scene: any, delta: number) {
  if (!scene.currentMessage || scene.state === BattleState.ANIMATING) {
    resetMessageFastForward(scene);
    return;
  }
  if (!isFastForwardHeld(scene)) {
    resetMessageFastForward(scene);
    return;
  }

  scene.messageFastForwardHoldMs += delta;
  if (scene.messageFastForwardHoldMs < 220) return;

  scene.messageFastForwardCooldownMs -= delta;
  if (scene.messageFastForwardCooldownMs > 0) return;

  clearMessageAutoAdvanceEvent(scene);
  scene.showNextMessage();
  scene.messageFastForwardCooldownMs = 65;
}

export function enqueueMessage(scene: any, text: string, options: Record<string, unknown> = {}) {
  scene.messageQueue.push({ text, options });
  if (!scene.currentMessage) scene.showNextMessage();
}

export function showNextMessage(scene: any) {
  clearMessageAutoAdvanceEvent(scene);
  if (scene.messageQueue.length === 0) {
    scene.currentMessage = null;
    scene.nextIndicator.setVisible(false);
    if (scene.state === BattleState.INTRO) {
      scene.showMainMenu(true);
    } else if (scene.state === BattleState.RESULT) {
      scene.endBattle();
    } else if (scene.state === BattleState.OPPONENT_TURN) {
      scene.startPlayerTurn();
    }
    return;
  }
  scene.currentMessage = scene.messageQueue.shift();
  scene.messageText.setText(scene.currentMessage.text);
  scene.nextIndicator.setVisible(true);
  scheduleMessageAutoAdvance(scene, scene.currentMessage.text);
}
