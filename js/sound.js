/**
 * Web Audio API によるシンセ効果音モジュール（外部音声ファイル不要）
 */
const SOUND_FX = (() => {
    'use strict';

    const STORAGE_KEY = 'mitosis-master-muted';
    let audioCtx = null;
    let muted = localStorage.getItem(STORAGE_KEY) === 'true';

    // コンボ数に応じて音程が上がるメジャースケール周波数 (C5 〜 E6)
    const COMBO_SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51];

    function getContext() {
        if (muted) return null;
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playTone(ctx, freq, startTime, duration, type = 'sine', peakGain = 0.14) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    function playTap() {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        playTone(ctx, 660, now, 0.055, 'triangle', 0.08);
    }

    function playCorrect(combo = 1) {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const idx = Math.min(Math.max(combo - 1, 0), COMBO_SCALE.length - 1);
        const baseFreq = COMBO_SCALE[idx];
        playTone(ctx, baseFreq, now, 0.11, 'triangle', 0.14);
        playTone(ctx, baseFreq * 1.25, now + 0.065, 0.16, 'sine', 0.15);
    }

    function playBonus() {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
            playTone(ctx, freq, now + i * 0.055, 0.18, 'triangle', 0.15);
        });
    }

    function playWrong() {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        playTone(ctx, 195, now, 0.14, 'sawtooth', 0.11);
        playTone(ctx, 155, now + 0.09, 0.2, 'sawtooth', 0.11);
    }

    function playTick() {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        playTone(ctx, 980, now, 0.04, 'sine', 0.06);
    }

    function playClear(isSecretUnlock = false) {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (isSecretUnlock) {
            // 秘密の扉が開く神秘的なアルペジオ
            [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((freq, i) => {
                playTone(ctx, freq, now + i * 0.08, 0.32, 'triangle', 0.15);
            });
            return;
        }

        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            playTone(ctx, freq, now + i * 0.075, 0.28, 'triangle', 0.14);
        });
    }

    function playTimeUp(isHighRank = false) {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = isHighRank
            ? [523.25, 659.25, 783.99, 1046.5]
            : [587.33, 523.25, 440.0];
        notes.forEach((freq, i) => {
            playTone(ctx, freq, now + i * 0.09, 0.24, 'triangle', 0.13);
        });
    }

    function isMuted() {
        return muted;
    }

    function toggleMute() {
        muted = !muted;
        localStorage.setItem(STORAGE_KEY, String(muted));
        if (!muted) {
            playTap();
        }
        return muted;
    }

    return {
        playTap,
        playCorrect,
        playBonus,
        playWrong,
        playTick,
        playClear,
        playTimeUp,
        isMuted,
        toggleMute
    };
})();
