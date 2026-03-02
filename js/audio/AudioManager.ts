/**
 * AudioManager - Tone.js を使った高品質プロシージャルサウンドシステム
 * マルチレイヤーBGM（メロディ+ベース+パッド3声） + エフェクトチェーン（リバーブ/ディレイ/コーラス）
 * + FM合成による豊かな効果音を提供する
 */
import * as Tone from "tone";
import { BGM_DATA } from "./bgmData.ts";
import type { BgmEntry } from "./bgmData.ts";
import { resolveAreaBgmKey, type AreaBgmKey } from "./areaBgm.ts";

export class AudioManager {
  isMuted: boolean;
  bgmVolume: number;
  seVolume: number;
  _currentBgm: string | null;

  // Tone.js ノード群
  private _initialized: boolean;
  private _initializing: boolean;
  private _masterVol: Tone.Volume | null;
  private _masterCompressor: Tone.Compressor | null;
  private _bgmVol: Tone.Volume | null;
  private _seVol: Tone.Volume | null;
  private _bgmFilter: Tone.Filter | null;
  private _reverb: Tone.Reverb | null;
  private _delay: Tone.FeedbackDelay | null;
  private _chorus: Tone.Chorus | null;
  private _seReverb: Tone.Reverb | null;

  // BGM シンセ
  private _melodySynth: Tone.PolySynth | null;
  private _bassSynth: Tone.MonoSynth | null;
  private _padSynth: Tone.PolySynth | null;

  // SE シンセ
  private _seSynth: Tone.Synth | null;
  private _seMetalSynth: Tone.FMSynth | null;
  private _noiseSynth: Tone.NoiseSynth | null;
  private _membraneSynth: Tone.MembraneSynth | null;

  // BGM再生管理
  private _bgmParts: Tone.Part[];
  private _transportStarted: boolean;
  private _bgmSwitchTimer: number | null;
  private _bgmSwitchToken: number;
  private _queuedBgmKey: AreaBgmKey | null;
  private _queuedConfirmSe: boolean;

  // レガシー互換プロパティ（外部から参照される可能性を考慮）
  ctx: unknown;
  masterGain: null;
  bgmGain: null;
  seGain: null;
  bgmOscillators: unknown[];
  _bgmInterval: null;

  constructor() {
    this.isMuted = false;
    this.bgmVolume = 0.3;
    this.seVolume = 0.5;
    this._currentBgm = null;
    this._initialized = false;
    this._initializing = false;
    this._masterVol = null;
    this._masterCompressor = null;
    this._bgmVol = null;
    this._seVol = null;
    this._bgmFilter = null;
    this._reverb = null;
    this._delay = null;
    this._chorus = null;
    this._seReverb = null;
    this._melodySynth = null;
    this._bassSynth = null;
    this._padSynth = null;
    this._seSynth = null;
    this._seMetalSynth = null;
    this._noiseSynth = null;
    this._membraneSynth = null;
    this._bgmParts = [];
    this._transportStarted = false;
    this._bgmSwitchTimer = null;
    this._bgmSwitchToken = 0;
    this._queuedBgmKey = null;
    this._queuedConfirmSe = false;

    // レガシー互換
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.seGain = null;
    this.bgmOscillators = [];
    this._bgmInterval = null;
  }

  /** AudioContext を初期化（ユーザー操作後に呼ぶ） */
  init() {
    if (this._initialized || this._initializing) return;
    this._initializing = true;
    this.ctx = Tone.getContext();

    Tone.start().then(() => {
      this._setupSynths();
      this._initialized = true;
      this._initializing = false;

      if (this._queuedBgmKey) {
        const queued = this._queuedBgmKey;
        this._queuedBgmKey = null;
        this.playBgmByKey(queued);
      }
      if (this._queuedConfirmSe) {
        this._queuedConfirmSe = false;
        this.playConfirm();
      }
    }).catch((e) => {
      this._initializing = false;
      console.warn("AudioManager: Tone.js 初期化失敗", e);
    });
  }

  /** 内部: シンセとエフェクトチェーンを構築 */
  private _setupSynths() {
    // ── マスターボリューム ──
    this._masterVol = new Tone.Volume(0);
    this._masterCompressor = new Tone.Compressor({
      threshold: -18,
      ratio: 2.2,
      attack: 0.01,
      release: 0.25,
    }).toDestination();
    this._masterVol.connect(this._masterCompressor);

    // ── BGM エフェクトチェーン: コーラス → ディレイ → リバーブ → BGMVol → Master ──
    this._reverb = new Tone.Reverb({ decay: 2.5, wet: 0.22 });
    this._delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.12, wet: 0.1 });
    this._chorus = new Tone.Chorus({ frequency: 0.5, depth: 0.3, wet: 0.15 }).start();
    this._bgmFilter = new Tone.Filter({
      type: "lowpass",
      frequency: 15000,
      Q: 0.6,
      rolloff: -12,
    });
    this._bgmVol = new Tone.Volume(this._dbFromLinear(this.bgmVolume));

    this._bgmFilter.connect(this._chorus);
    this._chorus.connect(this._delay);
    this._delay.connect(this._reverb);
    this._reverb.connect(this._bgmVol);
    this._bgmVol.connect(this._masterVol);

    // ── SE エフェクトチェーン: SEリバーブ → SEVol → Master ──
    this._seReverb = new Tone.Reverb({ decay: 0.8, wet: 0.12 });
    this._seVol = new Tone.Volume(this._dbFromLinear(this.seVolume));
    this._seReverb.connect(this._seVol);
    this._seVol.connect(this._masterVol);

    // ── BGM シンセ ──
    this._melodySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" as Tone.ToneOscillatorType },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      volume: -6,
    }).connect(this._bgmFilter);

    this._bassSynth = new Tone.MonoSynth({
      oscillator: { type: "square4" as Tone.ToneOscillatorType },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.5 },
      filterEnvelope: {
        attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5,
        baseFrequency: 120, octaves: 2,
      },
      volume: -12,
    }).connect(this._bgmFilter);

    this._padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine4" as Tone.ToneOscillatorType },
      envelope: { attack: 0.5, decay: 0.8, sustain: 0.6, release: 1.5 },
      volume: -18,
    }).connect(this._bgmFilter);

    // ── SE シンセ ──
    this._seSynth = new Tone.Synth({
      oscillator: { type: "square4" as Tone.ToneOscillatorType },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -4,
    }).connect(this._seReverb);

    this._seMetalSynth = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: { type: "triangle" as Tone.ToneOscillatorType },
      modulation: { type: "square" as Tone.ToneOscillatorType },
      envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.4 },
      volume: -8,
    }).connect(this._seReverb);

    this._noiseSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.05 },
      volume: -8,
    }).connect(this._seReverb);

    this._membraneSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 4,
      oscillator: { type: "sine" as Tone.ToneOscillatorType },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
      volume: -10,
    }).connect(this._seReverb);

    // ミュート状態反映
    if (this.isMuted && this._masterVol) {
      this._masterVol.volume.value = -Infinity;
    }
  }

  /** リニア値(0〜1)をdB値に変換 */
  private _dbFromLinear(v: number): number {
    if (v <= 0) return -Infinity;
    return 20 * Math.log10(Math.max(0.001, v));
  }

  /** ミュート切替 */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this._masterVol) {
      this._masterVol.volume.value = this.isMuted ? -Infinity : 0;
    }
    return this.isMuted;
  }

  setMuted(muted: boolean | unknown) {
    this.isMuted = !!muted;
    if (this._masterVol) {
      this._masterVol.volume.value = this.isMuted ? -Infinity : 0;
    }
  }

  setVolumes(bgmVolume: number, seVolume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVolume));
    this.seVolume = Math.max(0, Math.min(1, seVolume));
    if (this._bgmVol) this._bgmVol.volume.value = this._dbFromLinear(this.bgmVolume);
    if (this._seVol) this._seVol.volume.value = this._dbFromLinear(this.seVolume);
  }

  applySettings(settings: Record<string, unknown> = {}) {
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

  // ─── SE ヘルパー（安全な発音ラッパー） ───

  private _safeTone(
    synth: Tone.Synth | Tone.FMSynth | Tone.MonoSynth | null,
    note: string, dur: string, time?: number, velocity = 0.8,
  ) {
    if (!this._initialized || !synth) return;
    try { synth.triggerAttackRelease(note, dur, time, velocity); } catch { /* 無視 */ }
  }

  private _safeNoise(dur: string, time?: number, velocity = 0.5) {
    if (!this._initialized || !this._noiseSynth) return;
    try { this._noiseSynth.triggerAttackRelease(dur, time, velocity); } catch { /* 無視 */ }
  }

  private _safeMembrane(note: string, dur: string, time?: number, velocity = 0.6) {
    if (!this._initialized || !this._membraneSynth) return;
    try { this._membraneSynth.triggerAttackRelease(note, dur, time, velocity); } catch { /* 無視 */ }
  }

  private _variedVelocity(base: number, jitter = 0.08): number {
    const spread = (Math.random() * 2 - 1) * jitter;
    return Math.max(0.05, Math.min(1, base + spread));
  }

  // ─── 効果音 ───

  /** メニュー選択音 - クリアなピンッ */
  playCursor() {
    const note = Math.random() < 0.5 ? "A5" : "B5";
    this._safeTone(this._seSynth, note, "32n", undefined, this._variedVelocity(0.4, 0.06));
  }

  /** 決定音 - 2音上昇 */
  playConfirm() {
    if (!this._initialized) {
      if (this._initializing) this._queuedConfirmSe = true;
      return;
    }
    const now = Tone.now();
    this._safeTone(this._seSynth, "C5", "16n", now, 0.5);
    this._safeTone(this._seSynth, "G5", "16n", now + 0.08, 0.6);
  }

  /** キャンセル音 - 下降FMサウンド */
  playCancel() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeTone(this._seMetalSynth, "A4", "16n", now, 0.4);
    this._safeTone(this._seMetalSynth, "E4", "16n", now + 0.08, 0.3);
  }

  /** 攻撃ヒット音 - インパクト（ノイズ+メンブレン+金属音） */
  playHit() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeNoise("32n", now, 0.7);
    this._safeMembrane("C2", "16n", now, 0.6);
    this._safeTone(this._seMetalSynth, "G3", "32n", now + 0.02, 0.5);
  }

  /** 効果バツグン！ - 3音上昇 + インパクト */
  playSuperEffective() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeMembrane("C2", "8n", now, 0.7);
    this._safeTone(this._seMetalSynth, "E4", "16n", now, 0.6);
    this._safeTone(this._seMetalSynth, "G4", "16n", now + 0.06, 0.7);
    this._safeTone(this._seMetalSynth, "C5", "8n", now + 0.12, 0.8);
  }

  /** いまいちな効果 */
  playNotEffective() {
    this._safeTone(this._seSynth, "D4", "8n", undefined, 0.3);
  }

  /** レベルアップ音 - ファンファーレ的4音上昇 */
  playLevelUp() {
    if (!this._initialized) return;
    const now = Tone.now();
    const notes = ["C5", "E5", "G5", "C6"];
    notes.forEach((note, i) => {
      this._safeTone(this._seSynth, note, "8n", now + i * 0.1, 0.6);
      this._safeTone(this._seMetalSynth, note, "16n", now + i * 0.1, 0.3);
    });
  }

  /** 捕獲成功 - きらめく上昇メロディ */
  playCatchSuccess() {
    if (!this._initialized) return;
    const now = Tone.now();
    const notes = ["A4", "C#5", "E5", "A5"];
    notes.forEach((note, i) => {
      this._safeTone(this._seSynth, note, "8n", now + i * 0.12, 0.5);
    });
    this._safeTone(this._seMetalSynth, "E6", "4n", now + 0.48, 0.3);
  }

  /** 捕獲失敗 */
  playCatchFail() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeTone(this._seMetalSynth, "A4", "16n", now, 0.4);
    this._safeTone(this._seMetalSynth, "E4", "4n", now + 0.1, 0.3);
  }

  /** 回復音 - 透明感のある3音上昇 */
  playHeal() {
    if (!this._initialized) return;
    const now = Tone.now();
    const notes = ["C5", "E5", "G5"];
    notes.forEach((note, i) => {
      this._safeTone(this._seSynth, note, "8n", now + i * 0.12, 0.4);
    });
  }

  /** 敵出現音 - 緊張感のある3音（メンブレン+FM） */
  playEncounter() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeMembrane("G2", "8n", now, 0.5);
    this._safeTone(this._seMetalSynth, "A3", "8n", now, 0.5);
    this._safeTone(this._seMetalSynth, "E4", "8n", now + 0.1, 0.6);
    this._safeTone(this._seMetalSynth, "A4", "4n", now + 0.2, 0.7);
  }

  /** 勝利ジングル - 華やかなファンファーレ */
  playVictory() {
    if (!this._initialized) return;
    const now = Tone.now();
    const melody = [
      { note: "C5", dur: "8n", t: 0 },
      { note: "E5", dur: "8n", t: 0.12 },
      { note: "G5", dur: "8n", t: 0.24 },
      { note: "C6", dur: "4n", t: 0.36 },
      { note: "G5", dur: "8n", t: 0.66 },
      { note: "C6", dur: "2n", t: 0.78 },
    ];
    melody.forEach((m) => {
      this._safeTone(this._seSynth, m.note, m.dur, now + m.t, 0.5);
      this._safeTone(this._seMetalSynth, m.note, m.dur, now + m.t, 0.25);
    });
    this._safeMembrane("C3", "4n", now, 0.4);
    this._safeMembrane("G3", "4n", now + 0.36, 0.3);
  }

  /** 敗北ジングル - 下降する暗いメロディ */
  playDefeat() {
    if (!this._initialized) return;
    const now = Tone.now();
    const melody = [
      { note: "A4", dur: "4n", t: 0 },
      { note: "Ab4", dur: "4n", t: 0.2 },
      { note: "G4", dur: "4n", t: 0.4 },
      { note: "F#4", dur: "2n", t: 0.6 },
    ];
    melody.forEach((m) => {
      this._safeTone(this._seMetalSynth, m.note, m.dur, now + m.t, 0.35);
    });
  }

  /** 逃走成功音 */
  playRunAway() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeTone(this._seSynth, "D5", "32n", now, 0.5);
    this._safeTone(this._seSynth, "E5", "32n", now + 0.06, 0.5);
    this._safeTone(this._seSynth, "A5", "16n", now + 0.12, 0.4);
  }

  /** 歩行音 - 軽いノイズ */
  playStep() {
    const now = Tone.now();
    this._safeNoise("64n", now, this._variedVelocity(0.15, 0.05));
    if (Math.random() < 0.14) {
      this._safeMembrane("C2", "128n", now, this._variedVelocity(0.12, 0.03));
    }
  }

  /** ドア通過音 */
  playDoor() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeTone(this._seSynth, "D5", "16n", now, 0.3);
    this._safeTone(this._seSynth, "F5", "8n", now + 0.1, 0.35);
  }

  /** ショップ購入音 */
  playBuy() {
    if (!this._initialized) return;
    const now = Tone.now();
    ["E5", "G5", "C6"].forEach((note, i) => {
      this._safeTone(this._seSynth, note, "16n", now + i * 0.06, 0.4);
    });
  }

  /** エラー音 */
  playError() {
    if (!this._initialized) return;
    const now = Tone.now();
    this._safeTone(this._seMetalSynth, "G3", "8n", now, 0.4);
    this._safeTone(this._seMetalSynth, "D3", "4n", now + 0.12, 0.35);
  }

  /** セーブ音 */
  playSave() {
    if (!this._initialized) return;
    const now = Tone.now();
    ["C5", "G5", "C6", "G5", "C6"].forEach((note, i) => {
      this._safeTone(this._seSynth, note, "16n", now + i * 0.08, 0.35);
    });
  }

  // ─── BGM ───

  /** 全BGM停止 */
  private _stopBgmNow() {
    this._bgmParts.forEach((part) => {
      try { part.stop(); part.dispose(); } catch { /* 無視 */ }
    });
    this._bgmParts = [];
    this._currentBgm = null;

    if (this._transportStarted) {
      try {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
      } catch { /* 無視 */ }
      this._transportStarted = false;
    }
  }

  /** 全BGM停止 */
  stopBgm() {
    if (this._bgmSwitchTimer !== null) {
      window.clearTimeout(this._bgmSwitchTimer);
      this._bgmSwitchTimer = null;
    }
    this._bgmSwitchToken += 1;
    this._stopBgmNow();
  }

  private _applyBgmTonePreset(key: string) {
    if (!this._bgmFilter) return;
    const now = Tone.now();
    const presets: Record<string, { freq: number; q: number }> = {
      cave: { freq: 5200, q: 1.3 },
      dark: { freq: 4400, q: 1.5 },
      battle: { freq: 11800, q: 0.9 },
      volcano: { freq: 9800, q: 1.1 },
      ice: { freq: 13200, q: 0.7 },
      ruins: { freq: 9000, q: 1.0 },
      forest: { freq: 11500, q: 0.8 },
      field: { freq: 12800, q: 0.75 },
      title: { freq: 12600, q: 0.7 },
    };
    const preset = presets[key] || presets.field;
    this._bgmFilter.frequency.cancelScheduledValues(now);
    this._bgmFilter.Q.cancelScheduledValues(now);
    this._bgmFilter.frequency.rampTo(preset.freq, 0.25);
    this._bgmFilter.Q.rampTo(preset.q, 0.25);
  }

  private _fadeInBgmVolume() {
    if (!this._bgmVol) return;
    const now = Tone.now();
    const targetDb = this._dbFromLinear(this.bgmVolume);
    this._bgmVol.volume.cancelScheduledValues(now);
    this._bgmVol.volume.value = -34;
    this._bgmVol.volume.rampTo(targetDb, 0.28);
  }

  /** BGMデータからマルチレイヤーBGMを再生する（メロディ+ベース+パッド） */
  private _playBgm(key: string, data: BgmEntry) {
    if (this._currentBgm === key) return;
    if (!this._initialized || !this._masterVol) {
      if (this._initializing) this._queuedBgmKey = key as AreaBgmKey;
      return;
    }

    const runToken = ++this._bgmSwitchToken;
    const switchDelayMs = this._currentBgm ? 170 : 0;
    if (this._bgmVol && this._currentBgm) {
      const now = Tone.now();
      this._bgmVol.volume.cancelScheduledValues(now);
      this._bgmVol.volume.rampTo(-34, switchDelayMs / 1000);
    }

    if (this._bgmSwitchTimer !== null) {
      window.clearTimeout(this._bgmSwitchTimer);
      this._bgmSwitchTimer = null;
    }

    this._bgmSwitchTimer = window.setTimeout(() => {
      if (runToken !== this._bgmSwitchToken) return;
      this._stopBgmNow();
      this._currentBgm = key;
      this._applyBgmTonePreset(key);

      const transport = Tone.getTransport();
      transport.bpm.value = data.bpm;

      // メロディパート
      if (this._melodySynth) {
        const events: Array<[number, { note: string; dur: string }]> = [];
        let t = 0;
        for (const n of data.melody) {
          events.push([t, { note: n.note, dur: n.dur }]);
          t += Tone.Time(n.dur).toSeconds();
        }
        const part = new Tone.Part((time, value) => {
          try { this._melodySynth?.triggerAttackRelease(value.note, value.dur, time, 0.7); } catch { /* 無視 */ }
        }, events);
        part.loop = true;
        part.loopEnd = t;
        part.start(0);
        this._bgmParts.push(part);
      }

      // ベースパート
      if (this._bassSynth) {
        const events: Array<[number, { note: string; dur: string }]> = [];
        let t = 0;
        for (const n of data.bass) {
          events.push([t, { note: n.note, dur: n.dur }]);
          t += Tone.Time(n.dur).toSeconds();
        }
        const part = new Tone.Part((time, value) => {
          try { this._bassSynth?.triggerAttackRelease(value.note, value.dur, time, 0.5); } catch { /* 無視 */ }
        }, events);
        part.loop = true;
        part.loopEnd = t;
        part.start(0);
        this._bgmParts.push(part);
      }

      // パッド（コード）パート
      if (this._padSynth) {
        const events: Array<[number, { notes: string[]; dur: string }]> = [];
        let t = 0;
        for (const c of data.chords) {
          events.push([t, { notes: c.notes, dur: c.dur }]);
          t += Tone.Time(c.dur).toSeconds();
        }
        const part = new Tone.Part((time, value) => {
          try { this._padSynth?.triggerAttackRelease(value.notes, value.dur, time, 0.3); } catch { /* 無視 */ }
        }, events);
        part.loop = true;
        part.loopEnd = t;
        part.start(0);
        this._bgmParts.push(part);
      }

      transport.start();
      this._transportStarted = true;
      this._fadeInBgmVolume();
    }, switchDelayMs);
  }

  /** タイトルBGM */
  playTitleBgm() { this._playBgm("title", BGM_DATA.title); }

  /** フィールドBGM */
  playFieldBgm() { this._playBgm("field", BGM_DATA.field); }

  /** バトルBGM */
  playBattleBgm() { this._playBgm("battle", BGM_DATA.battle); }

  /** 森BGM */
  playForestBgm() { this._playBgm("forest", BGM_DATA.forest); }

  /** 洞窟BGM */
  playCaveBgm() { this._playBgm("cave", BGM_DATA.cave); }

  /** ダークタワーBGM */
  playDarkBgm() { this._playBgm("dark", BGM_DATA.dark); }

  /** マグマ峠BGM */
  playVolcanoBgm() { this._playBgm("volcano", BGM_DATA.volcano); }

  /** 氷峰BGM */
  playIceBgm() { this._playBgm("ice", BGM_DATA.ice); }

  /** 遺跡・花園BGM */
  playRuinsBgm() { this._playBgm("ruins", BGM_DATA.ruins); }

  private playBgmByKey(key: AreaBgmKey) {
    switch (key) {
      case "title":
        this.playTitleBgm();
        break;
      case "field":
        this.playFieldBgm();
        break;
      case "battle":
        this.playBattleBgm();
        break;
      case "forest":
        this.playForestBgm();
        break;
      case "cave":
        this.playCaveBgm();
        break;
      case "dark":
        this.playDarkBgm();
        break;
      case "volcano":
        this.playVolcanoBgm();
        break;
      case "ice":
        this.playIceBgm();
        break;
      case "ruins":
        this.playRuinsBgm();
        break;
    }
  }

  /**
   * マップキーに応じたフィールドBGMを再生する。
   * 同じBGMが既に流れている場合は何もしない。
   */
  playAreaBgm(mapKey: string) {
    const resolved = resolveAreaBgmKey(mapKey);
    if (!this._initialized) {
      if (this._initializing) this._queuedBgmKey = resolved;
      return;
    }
    this.playBgmByKey(resolved);
  }
}

/** シングルトンインスタンス */
export const audioManager = new AudioManager();
