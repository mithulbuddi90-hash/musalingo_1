/* ============================================================
   Musalingo — sounds.js
   Centralized sound engine for the whole app.

   - Synthesized SFX via Web Audio API (no audio files needed)
   - Text-to-speech via Google TTS with Web Speech API fallback
   - One shared AudioContext, unlocked on first user gesture
   - Respects localStorage "sound" setting

   Include on every page:
       <script src="sounds.js" defer></script>

   API (window.SFX):
       SFX.correct()                    -- ding for correct answers
       SFX.wrong()                      -- buzz for wrong answers
       SFX.complete()                   -- lesson-complete fanfare
       SFX.move()                       -- chess piece move
       SFX.capture()                    -- chess piece capture
       SFX.check()                      -- chess check alert
       SFX.win()                        -- chess win fanfare
       SFX.lose()                       -- chess lose sound
       SFX.error()                      -- generic error
       SFX.click()                      -- generic UI click
       SFX.heartsLost()                 -- heart lost "aww"
       SFX.gemEarned()                  -- diamond earned "chime"

       SFX.pronounce(text, opts)        -- speak text aloud
           opts: { lang: 'Japanese'|'es-ES'|etc, rate: 0.5..1.5 }
       SFX.cancelSpeech()               -- cancel ongoing speech
       SFX.unlock()                     -- manually resume audio context

   Utility:
       SFX.isEnabled()                  -- true if user hasn't muted
   ============================================================ */

(function bootstrapSounds() {
    'use strict';

    /* ============ AUDIO CONTEXT ============ */

    let audioCtx = null;
    let unlocked = false;
    let unlockListenersAttached = false;

    function ctx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('[sounds] AudioContext unavailable:', e);
                return null;
            }
        }
        return audioCtx;
    }

    function unlock() {
        const c = ctx();
        if (!c) return;
        if (c.state === 'suspended') c.resume().catch(() => { });
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
            } catch (e) { /* ignore */ }
        }
        unlocked = true;
    }

    function attachUnlockListeners() {
        if (unlockListenersAttached) return;
        unlockListenersAttached = true;
        const handler = () => {
            unlock();
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
        };
        document.addEventListener('touchstart', handler, { passive: true, once: true });
        document.addEventListener('click', handler, { passive: true, once: true });
        document.addEventListener('keydown', handler, { passive: true, once: true });
    }

    /* ============ MUTE CHECK ============ */

    function isEnabled() {
        try {
            // Check both keys — settings.html historically wrote to
            // MusalingoSettings, lesson.js historically read from
            // MusalingoAppSettings. Support both.
            const app = JSON.parse(localStorage.getItem('MusalingoAppSettings') || '{}');
            if (app && app.sound === false) return false;
            const main = JSON.parse(localStorage.getItem('MusalingoSettings') || '{}');
            if (main && main.sound === false) return false;
        } catch (e) { /* ignore */ }
        return true;
    }

    /* ============ SYNTH HELPERS ============ */

    /**
     * Play one synthesized note.
     * @param {number} freq      Frequency in Hz
     * @param {number} duration  Seconds
     * @param {string} type      'sine' | 'square' | 'sawtooth' | 'triangle'
     * @param {number} volume    0..1
     * @param {number} delay     Seconds before starting
     * @param {number} slideTo   Optional end frequency for a glide
     */
    function note(freq, duration, type, volume, delay, slideTo) {
        const c = ctx();
        if (!c) return;
        try {
            const start = c.currentTime + (delay || 0);
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain);
            gain.connect(c.destination);
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, start);
            if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(volume || 0.2, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.start(start);
            osc.stop(start + duration + 0.02);
        } catch (e) { /* silent */ }
    }

    function sequence(notes, gap) {
        // notes: [{freq, dur, type, vol}, ...]
        notes.forEach((n, i) => {
            note(n.freq, n.dur, n.type || 'sine', n.vol != null ? n.vol : 0.22, i * (gap || 0.1));
        });
    }

    /* ============ SFX DEFINITIONS ============ */

    const SFX = {};

    SFX.isEnabled = isEnabled;
    SFX.unlock = unlock;

    // Correct answer — two-note ascending chime (C5 → E5)
    SFX.correct = function () {
        if (!isEnabled()) return;
        note(523.25, 0.15, 'sine', 0.28, 0);
        note(659.25, 0.15, 'sine', 0.25, 0.1);
    };

    // Wrong answer — sawtooth buzz gliding down (300 → 200 Hz)
    SFX.wrong = function () {
        if (!isEnabled()) return;
        note(300, 0.15, 'sawtooth', 0.18, 0, 200);
    };

    // Lesson complete — four-note ascending arpeggio
    SFX.complete = function () {
        if (!isEnabled()) return;
        sequence([
            { freq: 523.25, dur: 0.18, vol: 0.22 },
            { freq: 659.25, dur: 0.18, vol: 0.22 },
            { freq: 783.99, dur: 0.18, vol: 0.22 },
            { freq: 1046.50, dur: 0.28, vol: 0.25 }
        ], 0.11);
    };

    // Chess: piece move — short soft triangle click
    SFX.move = function () {
        if (!isEnabled()) return;
        note(440, 0.05, 'triangle', 0.14, 0);
    };

    // Chess: tap — short soft triangle click
    SFX.tap = function () {
        if (!isEnabled()) return;
        note(600, 0.03, 'sine', 0.08, 0);
    };
    
    /* ============ OPPONENT MOVE SOUNDS (reversed/lower) ============ */

    // Opponent piece moved — lower, softer, slightly longer than your own move
    SFX.moveOpponent = function () {
        if (!isEnabled()) return;
        note(311.13, 0.06, 'triangle', 0.12, 0);   // Eb4 — down a perfect fourth from 440
    };

    // Opponent captures — reverse-direction slide, softer
    SFX.captureOpponent = function (piece) {
        if (!isEnabled()) return;
        const p = String(piece || '').toUpperCase();
        let freq;
        if (p === 'P') freq = 220;        // A3
        else if (p === 'N' || p === 'B') freq = 293.66; // D4
        else if (p === 'R') freq = 392;    // G4
        else if (p === 'Q') freq = 523.25; // C5
        else freq = 293.66;

        // Short downward slide — "you lost a piece" feel
        note(freq, 0.09, 'triangle', 0.16, 0, freq * 0.85);
    };

    /* ============ CHESS CAPTURES (4 pitch tiers by piece value) ============ */

    // Tier 1 — Pawn capture — low pitch beep
    SFX.capturePawn = function () {
        if (!isEnabled()) return;
        note(330, 0.10, 'triangle', 0.20, 0);
    };

    // Tier 2 — Knight / Bishop capture — slightly higher, crisper
    SFX.captureMinor = function () {
        if (!isEnabled()) return;
        note(440, 0.11, 'triangle', 0.22, 0);
    };

    // Tier 3 — Rook capture — higher still, sharper
    SFX.captureRook = function () {
        if (!isEnabled()) return;
        note(587.33, 0.12, 'triangle', 0.24, 0);   // D5
    };

    // Tier 4 — Queen capture — highest, sharpest beep
    SFX.captureQueen = function () {
        if (!isEnabled()) return;
        note(783.99, 0.13, 'triangle', 0.26, 0);   // G5
    };
    // SFX.capturePawn = () => note(330, 0.10, 'triangle', 0.20, 0);
    // SFX.captureMinor = () => note(440, 0.11, 'triangle', 0.22, 0);
    // SFX.captureRook = () => note(587.33, 0.12, 'triangle', 0.24, 0);
    // SFX.captureQueen = () => note(783.99, 0.13, 'triangle', 0.26, 0);

    // Router — pick the tier based on which piece was captured
    SFX.capture = function (piece) {
        if (!isEnabled()) return;
        const p = String(piece || '').toUpperCase();
        if (p === 'P') return SFX.capturePawn();
        if (p === 'N' || p === 'B') return SFX.captureMinor();
        if (p === 'R') return SFX.captureRook();
        if (p === 'Q') return SFX.captureQueen();
        // Fallback (king or unknown) — use the mid tier
        return SFX.captureMinor();
    };

    // Chess: check — sharp double beep
    SFX.check = function () {
        if (!isEnabled()) return;
        note(880, 0.08, 'sine', 0.24, 0);
        note(660, 0.12, 'sine', 0.2, 0.1);
    };

    // Chess: win fanfare — rising major triad
    SFX.win = function () {
        if (!isEnabled()) return;
        sequence([
            { freq: 523.25, dur: 0.14, vol: 0.22 },
            { freq: 659.25, dur: 0.14, vol: 0.22 },
            { freq: 783.99, dur: 0.14, vol: 0.22 },
            { freq: 1046.50, dur: 0.35, vol: 0.26 }
        ], 0.1);
    };

    // Chess: lose sound — descending minor third
    SFX.lose = function () {
        if (!isEnabled()) return;
        note(330, 0.25, 'sawtooth', 0.16, 0);
        note(220, 0.35, 'sawtooth', 0.16, 0.22);
    };
    

    // Generic error
    SFX.error = function () {
        if (!isEnabled()) return;
        note(300, 0.2, 'sawtooth', 0.16, 0);
    };

    // Generic UI click
    SFX.click = function () {
        if (!isEnabled()) return;
        note(600, 0.03, 'sine', 0.08, 0);
    };

    // Hearts lost — descending two-note "aww"
    SFX.heartsLost = function () {
        if (!isEnabled()) return;
        note(440, 0.12, 'sine', 0.15, 0);
        note(330, 0.2, 'sine', 0.15, 0.12);
    };

    // Diamond earned — sparkly high chime
    SFX.gemEarned = function () {
        if (!isEnabled()) return;
        note(1200, 0.08, 'sine', 0.16, 0);
        note(1600, 0.1, 'sine', 0.14, 0.06);
        note(2000, 0.15, 'sine', 0.12, 0.12);
    };

    /* ============ TEXT-TO-SPEECH ============ */

    const LANG_TO_BCP47 = {
        Japanese: 'ja-JP',
        Spanish: 'es-ES',
        French: 'fr-FR',
        Hindi: 'hi-IN',
        German: 'de-DE',
        Italian: 'it-IT',
        Arabic: 'ar-SA',
        English: 'en-US',
        Korean: 'ko-KR',
        Chinese: 'zh-CN',
        Portuguese: 'pt-PT',
        Russian: 'ru-RU',
        Turkish: 'tr-TR',
        Telugu: 'te-IN'
    };

    const LANG_TO_REMOTE = {
        Japanese: 'ja',
        Spanish: 'es',
        French: 'fr',
        Hindi: 'hi',
        German: 'de',
        Italian: 'it',
        Arabic: 'ar',
        English: 'en',
        Korean: 'ko',
        Chinese: 'zh-CN',
        Portuguese: 'pt',
        Russian: 'ru',
        Turkish: 'tr',
        Telugu: 'te'
    };

    let currentAudio = null;

    function cancelSpeech() {
        try {
            if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        } catch (e) { /* ignore */ }
        try {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        } catch (e) { /* ignore */ }
    }

    function speakLocal(text, lang, rate) {
        if (!('speechSynthesis' in window)) return false;
        try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang;
            u.rate = rate;
            window.speechSynthesis.speak(u);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Speak text aloud.
     * @param {string} text
     * @param {object} opts  { lang: 'Japanese' | 'ja-JP', rate: 0.5..1.5 }
     */
    SFX.pronounce = function (text, opts) {
        const clean = String(text || '').trim();
        if (!clean) return false;

        // Sound off means don't play pronunciation either
        if (!isEnabled()) return false;

        const options = opts || {};
        const langName = options.lang || 'English';
        const bcp47 = LANG_TO_BCP47[langName] || langName || 'en-US';
        const remoteLang = LANG_TO_REMOTE[langName] || null;
        const rate = typeof options.rate === 'number' ? options.rate : 0.85;

        cancelSpeech();

        // Try remote Google TTS first for natural voice
        if (remoteLang && navigator.onLine !== false) {
            try {
                const audio = new Audio(
                    'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='
                    + encodeURIComponent(remoteLang)
                    + '&q=' + encodeURIComponent(clean)
                );
                audio.playbackRate = rate;
                currentAudio = audio;
                const p = audio.play();
                if (p && p.catch) {
                    p.catch(() => speakLocal(clean, bcp47, rate));
                }
                return true;
            } catch (e) {
                // fall through to local
            }
        }

        return speakLocal(clean, bcp47, rate);
    };

    SFX.cancelSpeech = cancelSpeech;

    /* ============ AUTO-INSTALL ============ */

    // Attach unlock on first user gesture
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachUnlockListeners, { once: true });
    } else {
        attachUnlockListeners();
    }

    // Re-lock on pagehide so we don't play after navigation
    window.addEventListener('pagehide', () => {
        cancelSpeech();
    });

    // Expose globally
    window.SFX = SFX;
})();