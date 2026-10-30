// ------------------------------------------------------------
// ✨ MIKA'S PROCEDURAL WEBAUDIO SYNTHESIZER ✨
// Zero external audio assets — pure Web Audio API oscillator synthesis
// for MIKA Proxy's sighs, holographic hacker terminal, headpats, and alerts.
// ------------------------------------------------------------

const STORAGE_KEY_MUTED = 'mika_engine_audio_muted';

class MikaAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        let savedMute = false;
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEY_MUTED);
                if (stored !== null) savedMute = stored === 'true';
            }
        } catch (e) {}
        this.isMuted = savedMute;
        this.sfxVolume = 0.55;
    }

    initContext() {
        if (typeof window === 'undefined') return null;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            if (!window._mikaGlobalAudioCtx || window._mikaGlobalAudioCtx.state === 'closed') {
                window._mikaGlobalAudioCtx = new AudioCtx();
            }
            this.ctx = window._mikaGlobalAudioCtx;
            if (!this.masterGain && this.ctx) {
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
            return this.ctx;
        } catch (e) {
            return null;
        }
    }

    resume() {
        const ctx = this.initContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }

    setMuted(muted) {
        this.isMuted = Boolean(muted);
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_MUTED, String(this.isMuted));
            }
        } catch (e) {}
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    playClick() {
        if (this.isMuted) return;
        const ctx = this.initContext();
        if (!ctx) return;
        this.resume();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.035);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.045);
    }

    playMikaSigh() {
        if (this.isMuted) return;
        const ctx = this.initContext();
        if (!ctx) return;
        this.resume();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.42);
        gain.gain.setValueAtTime(0.038, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.46);
    }

    playMikaHolo() {
        if (this.isMuted) return;
        const ctx = this.initContext();
        if (!ctx) return;
        this.resume();
        const t = ctx.currentTime;
        [740, 987.77, 1318.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const st = t + i * 0.035;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, st);
            gain.gain.setValueAtTime(0.028, st);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.09);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(st);
            osc.stop(st + 0.1);
        });
    }

    playPet() {
        if (this.isMuted) return;
        const ctx = this.initContext();
        if (!ctx) return;
        this.resume();
        const t = ctx.currentTime;
        [659.25, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const st = t + i * 0.06;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, st);
            gain.gain.setValueAtTime(0.03, st);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.11);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(st);
            osc.stop(st + 0.12);
        });
    }

    playBite() {
        if (this.isMuted) return;
        const ctx = this.initContext();
        if (!ctx) return;
        this.resume();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.16);
    }
}

export const matrixAudio = new MikaAudioEngine();
export const playClick = () => matrixAudio.playClick();
export const playMikaSigh = () => matrixAudio.playMikaSigh();
export const playMikaHolo = () => matrixAudio.playMikaHolo();
export const playPet = () => matrixAudio.playPet();
export const playBite = () => matrixAudio.playBite();
