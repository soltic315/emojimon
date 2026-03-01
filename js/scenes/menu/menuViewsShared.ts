// メニュービュー共通定数・ヘルパー

/** メインメニューパネル幅 */
export const MAIN_MENU_PANEL_WIDTH = 220;
/** メインメニュー右マージン */
export const MAIN_MENU_RIGHT_MARGIN = 10;
/** サブパネル左マージン */
export const SUB_PANEL_LEFT_MARGIN = 10;
/** メイン–サブパネル間ギャップ */
export const MAIN_SUB_PANEL_GAP = 10;
/** サブパネル左端オフセット（＝メイン幅+各マージン合計） */
export const SUB_PANEL_WIDTH_OFFSET =
  MAIN_MENU_PANEL_WIDTH + MAIN_MENU_RIGHT_MARGIN + SUB_PANEL_LEFT_MARGIN + MAIN_SUB_PANEL_GAP;

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
