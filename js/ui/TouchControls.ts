/**
 * TouchControls - モバイル向け仮想コントローラー
 * D-pad（十字キー）と A/B ボタンをタッチ操作で提供する
 */
export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.container = null;
    // 仮想入力状態
    this.virtualInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      confirm: false,
      cancel: false,
    };
    this._lastConfirm = false;
    this._lastCancel = false;
    this._isTouchDevice = this.detectTouch();
    this._activePointerIds = {
      up: new Set(),
      down: new Set(),
      left: new Set(),
      right: new Set(),
      confirm: new Set(),
      cancel: new Set(),
    };
    this._globalPointerUpHandler = null;
    this._globalGameOutHandler = null;
  }

  /** タッチデバイスかどうかを検出 */
  detectTouch() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  /** コントローラーを作成・表示 */
  create() {
    if (!this._isTouchDevice) return;
    this.visible = true;
    const { width, height } = this.scene.scale;

    this.container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(9999);

    // ── D-pad ──
    const dpadX = 80;
    const dpadY = height - 90;
    const btnSize = 44;
    const gap = 4;

    // D-pad 背景円
    const dpadBg = this.scene.rexUI?.add?.roundRectangle
      ? this.scene.rexUI.add.roundRectangle(dpadX, dpadY, 136, 136, 68, 0x000000, 0.25)
      : this.scene.add.circle(dpadX, dpadY, 68, 0x000000, 0.25);
    this.container.add(dpadBg);

    // 上ボタン
    this._createDpadButton(dpadX, dpadY - btnSize - gap, btnSize, "▲", "up");
    // 下ボタン
    this._createDpadButton(dpadX, dpadY + btnSize + gap, btnSize, "▼", "down");
    // 左ボタン
    this._createDpadButton(dpadX - btnSize - gap, dpadY, btnSize, "◀", "left");
    // 右ボタン
    this._createDpadButton(dpadX + btnSize + gap, dpadY, btnSize, "▶", "right");

    // ── アクションボタン ──
    const actionX = width - 70;
    const actionY = height - 90;

    // Aボタン（決定 / Z）
    this._createActionButton(actionX + 20, actionY - 30, 32, "A", "confirm", 0xfbbf24);
    // Bボタン（キャンセル / X）
    this._createActionButton(actionX - 30, actionY + 20, 28, "B", "cancel", 0x6b7280);

    this._bindGlobalPointerHandlers();
  }

  _setVirtualInputByPointer(action, pointerId, pressed) {
    const pointerSet = this._activePointerIds[action];
    if (!pointerSet) return;

    if (pressed) {
      pointerSet.add(pointerId);
    } else {
      pointerSet.delete(pointerId);
    }
    this.virtualInput[action] = pointerSet.size > 0;
  }

  _releasePointer(pointerId) {
    Object.keys(this._activePointerIds).forEach((action) => {
      this._setVirtualInputByPointer(action, pointerId, false);
    });
  }

  _releaseAllPointers() {
    Object.keys(this._activePointerIds).forEach((action) => {
      this._activePointerIds[action].clear();
      this.virtualInput[action] = false;
    });
    this._lastConfirm = false;
    this._lastCancel = false;
  }

  _bindGlobalPointerHandlers() {
    if (!this.scene?.input) return;
    this._globalPointerUpHandler = (pointer) => {
      this._releasePointer(pointer.id);
    };
    this._globalGameOutHandler = () => {
      this._releaseAllPointers();
    };
    this.scene.input.on("pointerup", this._globalPointerUpHandler);
    this.scene.input.on("gameout", this._globalGameOutHandler);
  }

  _createDpadButton(x, y, size, label, direction) {
    const btn = this.scene.rexUI?.add?.roundRectangle
      ? this.scene.rexUI.add.roundRectangle(x, y, size, size, 8, 0x1f2937, 0.7)
      : this.scene.add.rectangle(x, y, size, size, 0x1f2937, 0.7);
    btn.setInteractive().setOrigin(0.5);
    btn.setStrokeStyle(1.5, 0x374151, 0.8);

    const text = this.scene.rexUI?.add?.label
      ? this.scene.rexUI.add.label({
        x,
        y,
        text: this.scene.add.text(0, 0, label, {
          fontSize: 16,
          color: "#9ca3af",
        }).setOrigin(0.5),
        align: "center",
      }).layout()
      : this.scene.add.text(x, y, label, {
        fontSize: 16,
        color: "#9ca3af",
      }).setOrigin(0.5);

    btn.on("pointerdown", (pointer) => {
      this._setVirtualInputByPointer(direction, pointer.id, true);
      btn.setFillStyle(0x374151, 0.9);
    });
    btn.on("pointerup", (pointer) => {
      this._setVirtualInputByPointer(direction, pointer.id, false);
      btn.setFillStyle(0x1f2937, 0.7);
    });
    btn.on("pointerout", (pointer) => {
      this._setVirtualInputByPointer(direction, pointer.id, false);
      btn.setFillStyle(0x1f2937, 0.7);
    });
    btn.on("pointerupoutside", (pointer) => {
      this._setVirtualInputByPointer(direction, pointer.id, false);
      btn.setFillStyle(0x1f2937, 0.7);
    });
    btn.on("pointercancel", (pointer) => {
      this._setVirtualInputByPointer(direction, pointer.id, false);
      btn.setFillStyle(0x1f2937, 0.7);
    });

    this.container.add(btn);
    this.container.add(text);
  }

  _createActionButton(x, y, radius, label, action, color) {
    const btn = this.scene.rexUI?.add?.roundRectangle
      ? this.scene.rexUI.add.roundRectangle(x, y, radius * 2, radius * 2, radius, color, 0.7)
      : this.scene.add.circle(x, y, radius, color, 0.7);
    btn.setInteractive().setOrigin(0.5);
    btn.setStrokeStyle(2, 0xffffff, 0.3);

    const text = this.scene.rexUI?.add?.label
      ? this.scene.rexUI.add.label({
        x,
        y,
        text: this.scene.add.text(0, 0, label, {
          fontSize: 18,
          fontFamily: "'M PLUS Rounded 1c', 'Segoe UI', system-ui, sans-serif",
          color: "#ffffff",
          fontStyle: "bold",
        }).setOrigin(0.5),
        align: "center",
      }).layout()
      : this.scene.add.text(x, y, label, {
        fontSize: 18,
        fontFamily: "'M PLUS Rounded 1c', 'Segoe UI', system-ui, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);

    btn.on("pointerdown", (pointer) => {
      this._setVirtualInputByPointer(action, pointer.id, true);
      btn.setAlpha(1);
    });
    btn.on("pointerup", (pointer) => {
      this._setVirtualInputByPointer(action, pointer.id, false);
      btn.setAlpha(0.7);
    });
    btn.on("pointerout", (pointer) => {
      this._setVirtualInputByPointer(action, pointer.id, false);
      btn.setAlpha(0.7);
    });
    btn.on("pointerupoutside", (pointer) => {
      this._setVirtualInputByPointer(action, pointer.id, false);
      btn.setAlpha(0.7);
    });
    btn.on("pointercancel", (pointer) => {
      this._setVirtualInputByPointer(action, pointer.id, false);
      btn.setAlpha(0.7);
    });

    this.container.add(btn);
    this.container.add(text);
  }

  /** 決定ボタンが「今フレームで押された」かどうか */
  justPressedConfirm() {
    const pressed = this.virtualInput.confirm && !this._lastConfirm;
    this._lastConfirm = this.virtualInput.confirm;
    return pressed;
  }

  /** キャンセルボタンが「今フレームで押された」かどうか */
  justPressedCancel() {
    const pressed = this.virtualInput.cancel && !this._lastCancel;
    this._lastCancel = this.virtualInput.cancel;
    return pressed;
  }

  /** 決定ボタンが押下中か */
  isConfirmHeld() {
    return !!this.virtualInput.confirm;
  }

  /** 方向入力状態を返す */
  getDirection() {
    if (this.virtualInput.up) return { dx: 0, dy: -1 };
    if (this.virtualInput.down) return { dx: 0, dy: 1 };
    if (this.virtualInput.left) return { dx: -1, dy: 0 };
    if (this.virtualInput.right) return { dx: 1, dy: 0 };
    return null;
  }

  /** ナビゲーション上が押されているか */
  isNavUp() {
    return this.virtualInput.up;
  }

  /** ナビゲーション下が押されているか */
  isNavDown() {
    return this.virtualInput.down;
  }

  /** デバイスがタッチ対応か */
  isTouchDevice() {
    return this._isTouchDevice;
  }

  /** コンテナを破棄 */
  destroy() {
    if (this.scene?.input) {
      if (this._globalPointerUpHandler) {
        this.scene.input.off("pointerup", this._globalPointerUpHandler);
      }
      if (this._globalGameOutHandler) {
        this.scene.input.off("gameout", this._globalGameOutHandler);
      }
    }
    this._releaseAllPointers();
    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
  }
}
