/**
 * AudioManager - Web Audio API を使ったプロシージャルサウンドシステム
 * 外部ファイル不要で効果音・簡易BGMを生成する
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.seGain = null;
    this.bgmOscillators = [];
    this._bgmInterval = null;
    this.isMuted = false;
    this.bgmVolume = 0.3;
    this.seVolume = 0.5;
    this._currentBgm = null;
  }

  /** AudioContext を初期化（ユーザー操作後に呼ぶ） */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this.bgmVolume;
    this.bgmGain.connect(this.masterGain);

    this.seGain = this.ctx.createGain();
    this.seGain.gain.value = this.seVolume;
    this.seGain.connect(this.masterGain);
  }

  /** ミュート切替 */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
    }
  }

  setVolumes(bgmVolume, seVolume) {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVolume));
    this.seVolume = Math.max(0, Math.min(1, seVolume));

    if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolume;
    if (this.seGain) this.seGain.gain.value = this.seVolume;
  }

  applySettings(settings = {}) {
    const bgmVol = typeof settings.bgmVolume === "number" ? settings.bgmVolume : this.bgmVolume;
    const seVol = typeof settings.seVolume === "number" ? settings.seVolume : this.seVolume;
    this.setVolumes(bgmVol, seVol);
    this.setMuted(!!settings.muted);
  }

  getSettings() {
    return {
      muted: this.isMuted,
      bgmVolume: this.bgmVolume,
      seVolume: this.seVolume,
    };
  }

  // ─── 効果音 ───

  /** メニュー選択音 */
  playCursor() {
    this._playTone(880, 0.06, "square", 0.15);
  }

  /** 決定音 */
  playConfirm() {
    this._playTone(523, 0.08, "square", 0.2);
    this._playTone(784, 0.08, "square", 0.2, 0.08);
  }

  /** キャンセル音 */
  playCancel() {
    this._playTone(440, 0.1, "sawtooth", 0.15);
    this._playTone(330, 0.1, "sawtooth", 0.15, 0.08);
  }

  /** 攻撃ヒット音 */
  playHit() {
    this._playNoise(0.08, 0.4);
    this._playTone(200, 0.06, "square", 0.3);
  }

  /** 効果バツグン！ */
  playSuperEffective() {
    this._playTone(600, 0.06, "square", 0.3);
    this._playTone(800, 0.06, "square", 0.3, 0.06);
    this._playTone(1000, 0.1, "square", 0.25, 0.12);
  }

  /** いまいちな効果 */
  playNotEffective() {
    this._playTone(300, 0.15, "triangle", 0.15);
  }

  /** レベルアップ音 */
  playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.12, "square", 0.25, i * 0.1);
    });
  }

  /** 捕獲成功 */
  playCatchSuccess() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.15, "triangle", 0.3, i * 0.12);
    });
  }

  /** 捕獲失敗 */
  playCatchFail() {
    this._playTone(440, 0.12, "sawtooth", 0.2);
    this._playTone(330, 0.2, "sawtooth", 0.2, 0.1);
  }

  /** 回復音 */
  playHeal() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.15, "sine", 0.2, i * 0.12);
    });
  }

  /** 敵出現音 */
  playEncounter() {
    this._playTone(220, 0.1, "square", 0.3);
    this._playTone(330, 0.1, "square", 0.3, 0.1);
    this._playTone(440, 0.15, "square", 0.25, 0.2);
  }

  /** 勝利ジングル */
  playVictory() {
    const melody = [
      [523, 0.12], [659, 0.12], [784, 0.12],
      [1047, 0.3],
      [784, 0.12], [1047, 0.4],
    ];
    let offset = 0;
    melody.forEach(([freq, dur]) => {
      this._playTone(freq, dur, "square", 0.2, offset);
      this._playTone(freq * 0.5, dur, "triangle", 0.1, offset);
      offset += dur + 0.02;
    });
  }

  /** 敗北ジングル */
  playDefeat() {
    const melody = [
      [440, 0.2], [415, 0.2], [392, 0.2], [370, 0.5],
    ];
    let offset = 0;
    melody.forEach(([freq, dur]) => {
      this._playTone(freq, dur, "sawtooth", 0.15, offset);
      offset += dur;
    });
  }

  /** 逃走成功音 */
  playRunAway() {
    this._playTone(600, 0.06, "square", 0.2);
    this._playTone(700, 0.06, "square", 0.2, 0.06);
    this._playTone(900, 0.1, "square", 0.15, 0.12);
  }

  /** 歩行音 */
  playStep() {
    this._playTone(150, 0.04, "triangle", 0.08);
  }

  /** ドア通過音 */
  playDoor() {
    this._playTone(300, 0.1, "sine", 0.2);
    this._playTone(450, 0.15, "sine", 0.2, 0.1);
  }

  /** ショップ購入音 */
  playBuy() {
    const notes = [659, 784, 1047];
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.08, "triangle", 0.2, i * 0.06);
    });
  }

  /** エラー音 */
  playError() {
    this._playTone(200, 0.15, "square", 0.2);
    this._playTone(150, 0.2, "square", 0.2, 0.12);
  }

  /** セーブ音 */
  playSave() {
    const notes = [523, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.1, "sine", 0.15, i * 0.08);
    });
  }

  // ─── BGM ───

  /** 全BGM停止 */
  stopBgm() {
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = null;
    }
    this._currentBgm = null;
    this.bgmOscillators.forEach((osc) => {
      try { osc.stop(); } catch (e) { /* 無視 */ }
    });
    this.bgmOscillators = [];
  }

  /** タイトルBGM */
  playTitleBgm() {
    if (this._currentBgm === "title") return;
    this.stopBgm();
    this._currentBgm = "title";
    this._loopMelody(
      [
        [392, 0.3], [440, 0.3], [523, 0.3], [659, 0.6],
        [523, 0.3], [440, 0.3], [392, 0.6],
        [440, 0.3], [523, 0.3], [659, 0.3], [784, 0.6],
        [659, 0.3], [523, 0.3], [440, 0.6],
      ],
      "triangle",
      0.12,
    );
  }

  /** フィールドBGM */
  playFieldBgm() {
    if (this._currentBgm === "field") return;
    this.stopBgm();
    this._currentBgm = "field";
    this._loopMelody(
      [
        [330, 0.25], [392, 0.25], [440, 0.25], [523, 0.5],
        [440, 0.25], [392, 0.25], [330, 0.5],
        [294, 0.25], [330, 0.25], [392, 0.25], [440, 0.5],
        [392, 0.25], [330, 0.25], [294, 0.5],
      ],
      "triangle",
      0.08,
    );
  }

  /** バトルBGM */
  playBattleBgm() {
    if (this._currentBgm === "battle") return;
    this.stopBgm();
    this._currentBgm = "battle";
    this._loopMelody(
      [
        [330, 0.15], [330, 0.15], [440, 0.15], [330, 0.15],
        [523, 0.3], [440, 0.15], [392, 0.15],
        [330, 0.15], [330, 0.15], [440, 0.15], [523, 0.15],
        [659, 0.3], [523, 0.15], [440, 0.15],
        [392, 0.15], [392, 0.15], [523, 0.15], [392, 0.15],
        [659, 0.3], [523, 0.15], [440, 0.15],
        [523, 0.15], [440, 0.15], [392, 0.15], [330, 0.15],
        [294, 0.3], [330, 0.3],
      ],
      "square",
      0.06,
    );
  }

  /** 森BGM：明るく自然な音色 */
  playForestBgm() {
    if (this._currentBgm === "forest") return;
    this.stopBgm();
    this._currentBgm = "forest";
    this._loopMelody(
      [
        [523, 0.3], [587, 0.2], [659, 0.2], [698, 0.4],
        [659, 0.2], [587, 0.2], [523, 0.4],
        [587, 0.2], [659, 0.2], [784, 0.2], [880, 0.4],
        [784, 0.2], [659, 0.2], [587, 0.6],
        [494, 0.3], [523, 0.2], [587, 0.2], [659, 0.4],
        [587, 0.2], [523, 0.2], [494, 0.5],
      ],
      "sine",
      0.09,
    );
  }

  /** 洞窟BGM：低く不気味なトーン */
  playCaveBgm() {
    if (this._currentBgm === "cave") return;
    this.stopBgm();
    this._currentBgm = "cave";
    this._loopMelody(
      [
        [220, 0.4], [196, 0.4], [165, 0.4], [220, 0.8],
        [196, 0.4], [165, 0.4], [147, 0.4], [196, 0.8],
        [220, 0.3], [247, 0.3], [220, 0.3], [196, 0.3],
        [165, 0.6], [147, 0.6],
      ],
      "triangle",
      0.07,
    );
  }

  /** ダークタワーBGM：緊迫感のある暗いトーン */
  playDarkBgm() {
    if (this._currentBgm === "dark") return;
    this.stopBgm();
    this._currentBgm = "dark";
    this._loopMelody(
      [
        [185, 0.2], [185, 0.2], [185, 0.2], [175, 0.2], [185, 0.4],
        [196, 0.2], [185, 0.2], [175, 0.2], [165, 0.4],
        [175, 0.2], [185, 0.2], [196, 0.2], [185, 0.2], [165, 0.4],
        [147, 0.3], [155, 0.3], [165, 0.3], [147, 0.6],
      ],
      "sawtooth",
      0.05,
    );
  }

  /** マグマ峠BGM：激しく力強い */
  playVolcanoBgm() {
    if (this._currentBgm === "volcano") return;
    this.stopBgm();
    this._currentBgm = "volcano";
    this._loopMelody(
      [
        [330, 0.1], [330, 0.1], [494, 0.2], [330, 0.1], [415, 0.1],
        [440, 0.3], [415, 0.1], [392, 0.2],
        [370, 0.1], [370, 0.1], [494, 0.2], [370, 0.1], [415, 0.1],
        [440, 0.2], [392, 0.2], [330, 0.3],
        [392, 0.15], [440, 0.15], [494, 0.15], [523, 0.3],
        [494, 0.15], [440, 0.15], [392, 0.4],
      ],
      "square",
      0.07,
    );
  }

  /** 氷峰BGM：静かで澄んだ音色 */
  playIceBgm() {
    if (this._currentBgm === "ice") return;
    this.stopBgm();
    this._currentBgm = "ice";
    this._loopMelody(
      [
        [784, 0.35], [698, 0.35], [659, 0.35], [784, 0.7],
        [698, 0.35], [622, 0.35], [587, 0.7],
        [659, 0.35], [698, 0.35], [784, 0.35], [880, 0.7],
        [784, 0.35], [698, 0.35], [659, 0.8],
      ],
      "sine",
      0.08,
    );
  }

  /** 遺跡・花園BGM：神秘的な古代の音楽 */
  playRuinsBgm() {
    if (this._currentBgm === "ruins") return;
    this.stopBgm();
    this._currentBgm = "ruins";
    this._loopMelody(
      [
        [440, 0.4], [494, 0.2], [523, 0.2], [587, 0.6],
        [523, 0.2], [494, 0.2], [440, 0.4], [415, 0.4],
        [370, 0.4], [415, 0.2], [440, 0.2], [494, 0.6],
        [440, 0.2], [415, 0.2], [370, 0.6], [330, 0.4],
        [370, 0.2], [415, 0.2], [440, 0.2], [494, 0.2],
        [523, 0.6], [494, 0.2], [440, 0.6],
      ],
      "sine",
      0.08,
    );
  }

  /**
   * マップキーに応じたフィールドBGMを再生する。
   * 同じBGMが既に流れている場合は何もしない。
   */
  playAreaBgm(mapKey) {
    switch (mapKey) {
      case "EMOJI_FOREST":
        this.playForestBgm();
        break;
      case "CAVE":
        this.playCaveBgm();
        break;
      case "DARK_TOWER":
        this.playDarkBgm();
        break;
      case "MAGMA_PASS":
        this.playVolcanoBgm();
        break;
      case "FROZEN_PEAK":
        this.playIceBgm();
        break;
      case "RUINS":
      case "GARDEN":
        this.playRuinsBgm();
        break;
      default:
        // タウン・おうち・研究所 → 通常フィールドBGM
        this.playFieldBgm();
        break;
    }
  }

  // ─── 内部メソッド ───

  _playTone(freq, duration, type = "sine", volume = 0.2, delay = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.seGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  _playNoise(duration, volume = 0.2) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.seGain);
    source.start();
  }

  _loopMelody(melody, waveType, volume) {
    if (!this.ctx) return;
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = null;
    }
    const totalDuration = melody.reduce((acc, [, dur]) => acc + dur, 0);

    const playOnce = (startOffset) => {
      let offset = startOffset;
      melody.forEach(([freq, dur]) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = waveType;
        osc.frequency.value = freq;

        const attackTime = 0.01;
        const releaseTime = Math.min(0.05, dur * 0.3);

        gain.gain.setValueAtTime(0.001, offset);
        gain.gain.linearRampToValueAtTime(volume, offset + attackTime);
        gain.gain.setValueAtTime(volume, offset + dur - releaseTime);
        gain.gain.linearRampToValueAtTime(0.001, offset + dur);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(offset);
        osc._stopTime = offset + dur + 0.01;
        osc.stop(osc._stopTime);
        this.bgmOscillators.push(osc);
        offset += dur;
      });
    };

    // 何ループか先まで予約し、定期的に追加予約する
    const loopsAhead = 3;
    let nextStart = this.ctx.currentTime + 0.1;
    for (let i = 0; i < loopsAhead; i++) {
      playOnce(nextStart);
      nextStart += totalDuration;
    }

    // 定期的にループを追加
    this._bgmInterval = setInterval(() => {
      if (this._currentBgm === null) {
        clearInterval(this._bgmInterval);
        return;
      }
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 残り1ループ分を切ったら追加
      if (nextStart - now < totalDuration * 1.5) {
        playOnce(nextStart);
        nextStart += totalDuration;
        // 古いオシレーターを掃除
        this.bgmOscillators = this.bgmOscillators.filter((osc) => {
          try {
            return osc._stopTime !== undefined && osc.context.currentTime < osc._stopTime + 1;
          } catch {
            return false;
          }
        });
      }
    }, 500);
  }
}

/** シングルトンインスタンス */
export const audioManager = new AudioManager();
