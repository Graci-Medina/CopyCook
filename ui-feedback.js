/**
 * Global light UI feedback: short Web Audio tones + navigator.vibrate where supported.
 * - Opt out: put data-no-ui-feedback on an ancestor, or class cc-no-ui-feedback
 * - prefers-reduced-motion: haptics suppressed; sounds stay quiet
 */
(function () {
    'use strict';

    var w = typeof window !== 'undefined' ? window : {};
    var audioCtx = null;
    var lastFire = 0;
    var DEBOUNCE_MS = 38;

    function reducedMotion() {
        try {
            return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (_) {
            return false;
        }
    }

    function getCtx() {
        if (audioCtx) return audioCtx;
        var AC = w.AudioContext || w.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
        return audioCtx;
    }

    function withCtx(fn) {
        var ctx = getCtx();
        if (!ctx) return;
        var run = function () {
            try {
                fn(ctx);
            } catch (_) {}
        };
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
            ctx.resume().then(run).catch(run);
        } else {
            run();
        }
    }

    function tone(ctx, freq, t0, dur, peak, type) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.03);
    }

    function tap() {
        withCtx(function (ctx) {
            var t = ctx.currentTime;
            tone(ctx, 698, t, 0.04, 0.034, 'sine');
        });
    }

    function togglePitch() {
        withCtx(function (ctx) {
            var t = ctx.currentTime;
            tone(ctx, 540, t, 0.042, 0.03, 'sine');
            tone(ctx, 680, t + 0.045, 0.045, 0.026, 'sine');
        });
    }

    function success() {
        withCtx(function (ctx) {
            var t = ctx.currentTime;
            tone(ctx, 523.25, t, 0.078, 0.052, 'sine');
            tone(ctx, 659.25, t + 0.075, 0.095, 0.042, 'sine');
            tone(ctx, 783.99, t + 0.155, 0.11, 0.036, 'sine');
        });
    }

    function warning() {
        withCtx(function (ctx) {
            var t = ctx.currentTime;
            tone(ctx, 320, t, 0.1, 0.055, 'triangle');
            tone(ctx, 240, t + 0.11, 0.12, 0.048, 'triangle');
        });
    }

    function error() {
        withCtx(function (ctx) {
            var t = ctx.currentTime;
            tone(ctx, 165, t, 0.14, 0.065, 'triangle');
        });
    }

    function hapticLight() {
        if (reducedMotion()) return;
        try {
            if (w.navigator && w.navigator.vibrate) w.navigator.vibrate(9);
        } catch (_) {}
    }

    function hapticMedium() {
        if (reducedMotion()) return;
        try {
            if (w.navigator && w.navigator.vibrate) w.navigator.vibrate([11, 38, 16]);
        } catch (_) {}
    }

    function hapticSuccess() {
        if (reducedMotion()) return;
        try {
            if (w.navigator && w.navigator.vibrate) w.navigator.vibrate([10, 28, 12, 28, 18]);
        } catch (_) {}
    }

    function fireDebounced(soundFn, hapticFn) {
        var now = Date.now();
        if (now - lastFire < DEBOUNCE_MS) return;
        lastFire = now;
        soundFn();
        if (hapticFn) hapticFn();
    }

    function fireTap() {
        fireDebounced(tap, hapticLight);
    }

    function fireToggle() {
        fireDebounced(togglePitch, hapticLight);
    }

    var DELEGATE =
        'button:not([disabled]),' +
        'a.nav-icon,' +
        '[role="button"]:not([aria-disabled="true"]),' +
        '.filter-tab,.tab-btn,.roulette-tab-btn,' +
        '.privacy-btn,.made-it-btn,.recipe-star-btn,' +
        '.find-stores-btn,.see-all-btn,' +
        '.category-pill,.ingredient-tag,' +
        '.food-card,.featured-card,.restaurant-card,.folder-card,.trending-card,' +
        '.conv-item,.store-chip.ingredient-search-chip,' +
        '.privacy-folder-btn,.privacy-switch-btn,' +
        '.passport-tile--open,.passport-modal-close,.modal-close,.modal-close-btn,' +
        '.new-message-btn';

    var ACTION_DEFER_SOUND =
        '.send-btn,#postBtn,.btn-post,.sp-save-btn,.comment-send,.made-it-btn,input[type="file"]';

    var TOGGLE_HINT =
        '.filter-tab,.tab-btn,.privacy-btn,.recipe-star-btn,.category-pill,' +
        '.roulette-tab-btn';

    function delegatedClick(ev) {
        var t = ev.target;
        if (!t || !(t.closest)) return;
        if (t.closest('[data-no-ui-feedback], .cc-no-ui-feedback')) return;
        var tag = (t.tagName || '').toLowerCase();
        if (tag === 'textarea' || tag === 'input' || tag === 'select' || tag === 'option') return;

        var host = t.closest(DELEGATE);
        if (!host) return;
        if (t.closest(ACTION_DEFER_SOUND)) return;

        if (host.closest(ACTION_DEFER_SOUND)) return;

        if (host.matches(TOGGLE_HINT)) {
            fireToggle();
        } else {
            fireTap();
        }
    }

    w.UIFeedback = {
        tap: tap,
        toggle: togglePitch,
        success: success,
        warning: warning,
        error: error,
        hapticLight: hapticLight,
        hapticMedium: hapticMedium,
        hapticSuccess: hapticSuccess,
        fireTap: fireTap,
        fireToggle: fireToggle
    };

    document.addEventListener('click', delegatedClick, true);
})();
