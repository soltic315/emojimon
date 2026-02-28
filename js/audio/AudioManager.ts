/**
 * AudioManager - Tone.js を使った高品質プロシージャルサウンドシステム
 * マルチレイヤーBGM（メロディ+ベース+パッド3声） + エフェクトチェーン（リバーブ/ディレイ/コーラス）
 * + FM合成による豊かな効果音を提供する
 */
import * as Tone from "tone";

// ── 音名定義ヘルパー ──
const N = (note: string, dur: string) => ({ note, dur });

/**
 * BGM定義: メロディ・ベース・パッドの3レイヤー構成
 * 各エリアのテーマに合わせた楽曲データ
 */
const BGM_DATA = {
  title: {
    bpm: 88,
    melody: [
      N("G4","4n"), N("A4","4n"), N("C5","4n"), N("E5","2n"),
      N("C5","4n"), N("A4","4n"), N("G4","2n"),
      N("A4","4n"), N("C5","4n"), N("E5","4n"), N("G5","2n"),
      N("E5","4n"), N("C5","4n"), N("A4","2n"),
    ],
    bass: [
      N("G2","2n"), N("C3","2n"), N("G2","2n"), N("D3","2n"),
      N("A2","2n"), N("E3","2n"), N("C3","2n"), N("G2","2n"),
    ],
    chords: [
      { notes: ["G3","B3","D4"], dur: "1n" },
      { notes: ["C3","E3","G3"], dur: "1n" },
      { notes: ["A3","C4","E4"], dur: "1n" },
      { notes: ["C3","E3","G3"], dur: "1n" },
    ],
  },
  field: {
    bpm: 100,
    melody: [
      N("E4","4n"), N("G4","4n"), N("A4","4n"), N("C5","2n"),
      N("A4","4n"), N("G4","4n"), N("E4","2n"),
      N("D4","4n"), N("E4","4n"), N("G4","4n"), N("A4","2n"),
      N("G4","4n"), N("E4","4n"), N("D4","2n"),
    ],
    bass: [
      N("C3","2n"), N("G2","2n"), N("A2","2n"), N("E2","2n"),
      N("F2","2n"), N("C3","2n"), N("G2","2n"), N("C3","2n"),
    ],
    chords: [
      { notes: ["C3","E3","G3"], dur: "1n" },
      { notes: ["A2","C3","E3"], dur: "1n" },
      { notes: ["F3","A3","C4"], dur: "1n" },
      { notes: ["G3","B3","D4"], dur: "1n" },
    ],
  },
  battle: {
    bpm: 140,
    melody: [
      N("E4","8n"), N("E4","8n"), N("A4","8n"), N("E4","8n"),
      N("C5","4n"), N("A4","8n"), N("G4","8n"),
      N("E4","8n"), N("E4","8n"), N("A4","8n"), N("C5","8n"),
      N("E5","4n"), N("C5","8n"), N("A4","8n"),
      N("G4","8n"), N("G4","8n"), N("C5","8n"), N("G4","8n"),
      N("E5","4n"), N("C5","8n"), N("A4","8n"),
      N("C5","8n"), N("A4","8n"), N("G4","8n"), N("E4","8n"),
      N("D4","4n"), N("E4","4n"),
    ],
    bass: [
      N("A2","4n"), N("A2","8n"), N("A2","8n"),
      N("C3","4n"), N("G2","4n"),
      N("A2","4n"), N("A2","8n"), N("A2","8n"),
      N("E3","4n"), N("C3","4n"),
      N("G2","4n"), N("G2","8n"), N("G2","8n"),
      N("E3","4n"), N("C3","4n"),
      N("A2","4n"), N("E2","4n"),
      N("D3","4n"), N("E3","4n"),
    ],
    chords: [
      { notes: ["A3","C4","E4"], dur: "2n" },
      { notes: ["C4","E4","G4"], dur: "2n" },
      { notes: ["A3","C4","E4"], dur: "2n" },
      { notes: ["E3","G3","B3"], dur: "2n" },
      { notes: ["G3","B3","D4"], dur: "2n" },
      { notes: ["E3","G3","B3"], dur: "2n" },
      { notes: ["A3","C4","E4"], dur: "2n" },
      { notes: ["D3","F3","A3"], dur: "2n" },
    ],
  },
  forest: {
    bpm: 92,
    melody: [
      N("C5","4n"), N("D5","8n"), N("E5","8n"), N("F5","2n"),
      N("E5","8n"), N("D5","8n"), N("C5","2n"),
      N("D5","8n"), N("E5","8n"), N("G5","8n"), N("A5","2n"),
      N("G5","8n"), N("E5","8n"), N("D5","2n."),
      N("B4","4n"), N("C5","8n"), N("D5","8n"), N("E5","2n"),
      N("D5","8n"), N("C5","8n"), N("B4","2n"),
    ],
    bass: [
      N("C3","2n"), N("F3","2n"), N("G2","2n"), N("C3","2n"),
      N("D3","2n"), N("A2","2n"), N("G2","2n"), N("C3","2n"),
    ],
    chords: [
      { notes: ["C3","E3","G3"], dur: "1n" },
      { notes: ["F3","A3","C4"], dur: "1n" },
      { notes: ["G3","B3","D4"], dur: "1n" },
      { notes: ["C3","E3","G3"], dur: "1n" },
    ],
  },
  cave: {
    bpm: 72,
    melody: [
      N("A3","2n"), N("G3","2n"), N("E3","2n"), N("A3","1n"),
      N("G3","2n"), N("E3","2n"), N("D3","2n"), N("G3","1n"),
      N("A3","4n"), N("B3","4n"), N("A3","4n"), N("G3","4n"),
      N("E3","2n."), N("D3","2n."),
    ],
    bass: [
      N("A1","1n"), N("G1","1n"), N("E1","1n"), N("A1","1n"),
    ],
    chords: [
      { notes: ["A2","C3","E3"], dur: "1n" },
      { notes: ["G2","B2","D3"], dur: "1n" },
      { notes: ["E2","G2","B2"], dur: "1n" },
      { notes: ["A2","C3","E3"], dur: "1n" },
    ],
  },
  dark: {
    bpm: 80,
    melody: [
      N("F#3","8n"), N("F#3","8n"), N("F#3","8n"), N("F3","8n"), N("F#3","4n"),
      N("G3","8n"), N("F#3","8n"), N("F3","8n"), N("E3","4n"),
      N("F3","8n"), N("F#3","8n"), N("G3","8n"), N("F#3","8n"), N("E3","4n"),
      N("D3","4n"), N("D#3","4n"), N("E3","4n"), N("D3","2n"),
    ],
    bass: [
      N("D2","2n"), N("D2","4n"), N("E2","4n"),
      N("F2","2n"), N("E2","2n"),
      N("D2","2n"), N("C2","2n"),
      N("D2","1n"),
    ],
    chords: [
      { notes: ["D3","F3","A3"], dur: "1n" },
      { notes: ["E3","G3","B3"], dur: "1n" },
      { notes: ["D3","F3","A3"], dur: "1n" },
      { notes: ["C3","E3","G3"], dur: "1n" },
    ],
  },
  volcano: {
    bpm: 132,
    melody: [
      N("E4","16n"), N("E4","16n"), N("B4","8n"), N("E4","16n"), N("G#4","16n"),
      N("A4","4n"), N("G#4","16n"), N("G4","8n."),
      N("F#4","16n"), N("F#4","16n"), N("B4","8n"), N("F#4","16n"), N("G#4","16n"),
      N("A4","8n"), N("G4","8n"), N("E4","4n"),
      N("G4","8n"), N("A4","8n"), N("B4","8n"), N("C5","4n"),
      N("B4","8n"), N("A4","8n"), N("G4","2n"),
    ],
    bass: [
      N("E2","4n"), N("E2","8n"), N("E2","8n"),
      N("A2","4n"), N("G#2","4n"),
      N("F#2","4n"), N("F#2","8n"), N("F#2","8n"),
      N("A2","4n"), N("E2","4n"),
      N("G2","4n"), N("A2","4n"),
      N("B2","4n"), N("G2","4n"),
    ],
    chords: [
      { notes: ["E3","G#3","B3"], dur: "2n" },
      { notes: ["A3","C4","E4"], dur: "2n" },
      { notes: ["F#3","A3","C#4"], dur: "2n" },
      { notes: ["A3","C4","E4"], dur: "2n" },
      { notes: ["G3","B3","D4"], dur: "2n" },
      { notes: ["B3","D4","F#4"], dur: "2n" },
    ],
  },
  ice: {
    bpm: 68,
    melody: [
      N("G5","4n."), N("F5","4n."), N("E5","4n."), N("G5","2n."),
      N("F5","4n."), N("Eb5","4n."), N("D5","2n."),
      N("E5","4n."), N("F5","4n."), N("G5","4n."), N("A5","2n."),
      N("G5","4n."), N("F5","4n."), N("E5","1n"),
    ],
    bass: [
      N("C3","1n"), N("F3","1n"), N("Bb2","1n"), N("G2","1n"),
      N("C3","1n"), N("F3","1n"), N("G2","1n"), N("C3","1n"),
    ],
    chords: [
      { notes: ["C4","E4","G4"], dur: "1n" },
      { notes: ["F3","A3","C4"], dur: "1n" },
      { notes: ["G3","Bb3","D4"], dur: "1n" },
      { notes: ["C4","E4","G4"], dur: "1n" },
    ],
  },
  ruins: {
    bpm: 78,
    melody: [
      N("A4","4n"), N("B4","8n"), N("C5","8n"), N("D5","2n"),
      N("C5","8n"), N("B4","8n"), N("A4","4n"), N("G#4","4n"),
      N("F#4","4n"), N("G#4","8n"), N("A4","8n"), N("B4","2n"),
      N("A4","8n"), N("G#4","8n"), N("F#4","2n"), N("E4","4n"),
      N("F#4","8n"), N("G#4","8n"), N("A4","8n"), N("B4","8n"),
      N("C5","2n"), N("B4","8n"), N("A4","2n"),
    ],
    bass: [
      N("A2","2n"), N("D3","2n"), N("A2","2n"), N("E2","2n"),
      N("F#2","2n"), N("D3","2n"), N("E2","2n"), N("A2","2n"),
      N("F#2","2n"), N("A2","2n"), N("C3","2n"), N("A2","2n"),
    ],
    chords: [
      { notes: ["A3","C#4","E4"], dur: "1n" },
      { notes: ["D3","F#3","A3"], dur: "1n" },
      { notes: ["F#3","A3","C#4"], dur: "1n" },
      { notes: ["E3","G#3","B3"], dur: "1n" },
      { notes: ["F#3","A3","C#4"], dur: "1n" },
      { notes: ["A3","C#4","E4"], dur: "1n" },
    ],
  },
};

// BGMデータの型定義
type BgmKey = keyof typeof BGM_DATA;
type BgmEntry = (typeof BGM_DATA)[BgmKey];

export class AudioManager {
  isMuted: boolean;
  bgmVolume: number;
  seVolume: number;
  _currentBgm: string | null;

  // Tone.js ノード群
  private _initialized: boolean;
  private _masterVol: Tone.Volume | null;
  private _bgmVol: Tone.Volume | null;
  private _seVol: Tone.Volume | null;
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
    this._masterVol = null;
    this._bgmVol = null;
    this._seVol = null;
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
    if (this._initialized) return;

    // Tone.start() は Promise を返すが、既存呼び出し側が同期的に呼んでいるため
    // 非同期で初期化を進め、完了後にフラグを立てる
    Tone.start().then(() => {
      this._setupSynths();
    }).catch((e) => {
      console.warn("AudioManager: Tone.js 初期化失敗", e);
    });

    // 初期化フラグを先に立てて二重呼び出しを防ぐ
    this._initialized = true;
    this.ctx = Tone.getContext();
  }

  /** 内部: シンセとエフェクトチェーンを構築 */
  private _setupSynths() {
    // ── マスターボリューム ──
    this._masterVol = new Tone.Volume(0).toDestination();

    // ── BGM エフェクトチェーン: コーラス → ディレイ → リバーブ → BGMVol → Master ──
    this._reverb = new Tone.Reverb({ decay: 2.5, wet: 0.22 });
    this._delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.12, wet: 0.1 });
    this._chorus = new Tone.Chorus({ frequency: 0.5, depth: 0.3, wet: 0.15 }).start();
    this._bgmVol = new Tone.Volume(this._dbFromLinear(this.bgmVolume));

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
    }).connect(this._chorus);

    this._bassSynth = new Tone.MonoSynth({
      oscillator: { type: "square4" as Tone.ToneOscillatorType },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.5 },
      filterEnvelope: {
        attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5,
        baseFrequency: 120, octaves: 2,
      },
      volume: -12,
    }).connect(this._chorus);

    this._padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine4" as Tone.ToneOscillatorType },
      envelope: { attack: 0.5, decay: 0.8, sustain: 0.6, release: 1.5 },
      volume: -18,
    }).connect(this._chorus);

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

  // ─── 効果音 ───

  /** メニュー選択音 - クリアなピンッ */
  playCursor() {
    this._safeTone(this._seSynth, "A5", "32n", undefined, 0.4);
  }

  /** 決定音 - 2音上昇 */
  playConfirm() {
    if (!this._initialized) return;
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
    this._safeNoise("64n", undefined, 0.15);
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
  stopBgm() {
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

  /** BGMデータからマルチレイヤーBGMを再生する（メロディ+ベース+パッド） */
  private _playBgm(key: string, data: BgmEntry) {
    if (this._currentBgm === key) return;
    if (!this._initialized || !this._masterVol) return;

    this.stopBgm();
    this._currentBgm = key;

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

  /**
   * マップキーに応じたフィールドBGMを再生する。
   * 同じBGMが既に流れている場合は何もしない。
   */
  playAreaBgm(mapKey: string) {
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
}

/** シングルトンインスタンス */
export const audioManager = new AudioManager();
