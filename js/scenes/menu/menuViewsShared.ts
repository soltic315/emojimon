// メニュービュー共通定数・ヘルパー
import { FONT } from "../../ui/UIHelper.ts";

/** メインメニューパネル幅 */
export const MAIN_MENU_PANEL_WIDTH = 236;
/** メインメニュー右マージン */
export const MAIN_MENU_RIGHT_MARGIN = 14;
/** メインメニュー上マージン */
export const MAIN_MENU_TOP_MARGIN = 14;
/** サブパネル左マージン */
export const SUB_PANEL_LEFT_MARGIN = 14;
/** メイン–サブパネル間ギャップ */
export const MAIN_SUB_PANEL_GAP = 12;
/** サブパネルを全画面表示するための左右オフセット（10px + 10px） */
export const SUB_PANEL_WIDTH_OFFSET = 20;

/**
 * テキストオブジェクトを maxWidth に収まるよう末尾を「…」で切り詰める。
 */
export function fitLabelToWidth(textObj, original: string, maxWidth: number): void {
  if (!textObj || typeof original !== "string") return;
  if (textObj.width <= maxWidth) return;

  const chars = [...original];
  let cut = chars.length;
  while (cut > 1) {
    const candidate = `${chars.slice(0, cut - 1).join("")}…`;
    textObj.setText(candidate);
    if (textObj.width <= maxWidth) return;
    cut -= 1;
  }
}

export function showTransientMenuMessage(scene, text, xOffset = -130) {
  const { width, height } = scene.scale;
  const msg = scene.add.text(width / 2 + xOffset, height / 2, text, {
    fontFamily: FONT.UI,
    fontSize: 14,
    color: "#fde68a",
    backgroundColor: "#0f172a",
    padding: { x: 12, y: 8 },
  }).setDepth(100);
  msg.setStroke("#000000", 2);
  scene.time.delayedCall(1200, () => msg.destroy());
}
