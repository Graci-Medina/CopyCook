/**
 * Logout helpers: clear session keys from localStorage but keep cuisine passport blobs
 * (cc_cuisine_passport_v1 + cc_cuisine_passport_v1:<uid>) so stamps return after re-login.
 */
(function (global) {
    'use strict';

    var LEGACY = 'cc_cuisine_passport_v1';
    var PREFIX = 'cc_cuisine_passport_v1:';

    function isPreservedPassportKey(k) {
        return k === LEGACY || k.indexOf(PREFIX) === 0;
    }

    /** Move legacy single-key passport onto the signed-in user before session keys are stripped. */
    function preparePassportStorageForLogout(uid) {
        if (!uid || typeof uid !== 'string') return;
        var nsKey = PREFIX + uid;
        try {
            if (!global.localStorage.getItem(nsKey)) {
                var leg = global.localStorage.getItem(LEGACY);
                if (leg) global.localStorage.setItem(nsKey, leg);
            }
            global.localStorage.removeItem(LEGACY);
        } catch (_) { /* quota / private mode */ }
    }

    function clearAuthLocalStoragePreservePassport() {
        var keys = [];
        var i;
        for (i = 0; i < global.localStorage.length; i++) {
            keys.push(global.localStorage.key(i));
        }
        keys.forEach(function (k) {
            if (k && !isPreservedPassportKey(k)) {
                global.localStorage.removeItem(k);
            }
        });
        try {
            global.sessionStorage.clear();
        } catch (_) {}
    }

    /** Read current uid, snapshot passport to per-user key, clear non-passport storage, redirect. */
    function logoutClearSessionKeepPassport(loginPath) {
        var uid = null;
        try {
            uid = global.localStorage.getItem('userUID');
        } catch (_) {}
        preparePassportStorageForLogout(uid);
        clearAuthLocalStoragePreservePassport();
        global.location.href = loginPath || '../login.html';
    }

    /**
     * Sidebar brand logo: signed-out users go to marketing `index.html`, signed-in to app home.
     * @param {string} signedInHref
     * @param {string} signedOutHref
     */
    function ccBrandLogoNavigate(signedInHref, signedOutHref) {
        var u = '';
        try {
            u = global.localStorage.getItem('userUID') || '';
        } catch (_) {}
        global.location.href = u ? signedInHref : signedOutHref;
    }

    global.preparePassportStorageForLogout = preparePassportStorageForLogout;
    global.clearAuthLocalStoragePreservePassport = clearAuthLocalStoragePreservePassport;
    global.logoutClearSessionKeepPassport = logoutClearSessionKeepPassport;
    global.ccBrandLogoNavigate = ccBrandLogoNavigate;
}(typeof window !== 'undefined' ? window : globalThis));
