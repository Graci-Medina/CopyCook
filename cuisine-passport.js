/**
 * Cuisine Passport — client-only progress by TheMealDB strArea (list.php?a=list).
 * Storage: localStorage cc_cuisine_passport_v1:<firebaseUID> (and legacy cc_cuisine_passport_v1 until migrated) →
 * { stamps: { [strArea]: isoDate }, recipesByArea: { [strArea]: [{ idMeal, strMeal, strMealThumb, savedAt }] } }
 */
(function (global) {
    'use strict';

    var STORAGE_KEY_BASE = 'cc_cuisine_passport_v1';

    function currentStorageKey() {
        try {
            var uid = localStorage.getItem('userUID');
            if (uid) return STORAGE_KEY_BASE + ':' + uid;
        } catch (_) {}
        return STORAGE_KEY_BASE;
    }

    function readRaw() {
        try {
            var key = currentStorageKey();
            var raw = localStorage.getItem(key);
            if (!raw && key !== STORAGE_KEY_BASE) {
                raw = localStorage.getItem(STORAGE_KEY_BASE);
                if (raw) {
                    try {
                        localStorage.setItem(key, raw);
                        localStorage.removeItem(STORAGE_KEY_BASE);
                    } catch (_) { /* quota */ }
                }
            }
            var o = raw ? JSON.parse(raw) : {};
            var stamps = o.stamps;
            if (typeof stamps !== 'object' || stamps === null) stamps = {};
            var recipesByArea = o.recipesByArea;
            if (typeof recipesByArea !== 'object' || recipesByArea === null) recipesByArea = {};
            return { stamps: stamps, recipesByArea: recipesByArea };
        } catch (_) {
            return { stamps: {}, recipesByArea: {} };
        }
    }

    function writeRaw(data) {
        try {
            var key = currentStorageKey();
            localStorage.setItem(key, JSON.stringify({
                stamps: data.stamps,
                recipesByArea: data.recipesByArea || {},
                updatedAt: Date.now()
            }));
        } catch (_) { /* quota */ }
    }

    function readStore() {
        return readRaw().stamps;
    }

    function normalizeArea(s) {
        var t = String(s || '').trim();
        return t;
    }

    /** Map MealDB strArea → world-region bucket (visual grouping) */
    function areaToRegion(area) {
        var a = area;
        var groups = {
            americas: ['American', 'Canadian', 'Jamaican', 'Mexican', 'Argentinian', 'Uruguayan',
                'Venezulan'],
            europe: ['British', 'Croatian', 'Dutch', 'French', 'Greek', 'Irish', 'Italian',
                'Polish', 'Portuguese', 'Spanish', 'Ukrainian', 'Norwegian', 'Slovakian'],
            mena: ['Egyptian', 'Moroccan', 'Tunisian', 'Turkish', 'Algerian', 'Syrian', 'Saudi Arabian'],
            asia: ['Chinese', 'Japanese', 'Indian', 'Malaysian', 'Thai', 'Vietnamese', 'Filipino'],
            oceania: ['Australian'],
            otherEurasia: ['Russian', 'Kenyan'],
            other: []
        };
        for (var gid in groups) {
            if (groups[gid].indexOf(a) !== -1) return gid === 'other' ? 'otherWorld' : gid;
        }
        return 'otherWorld';
    }

    /** API-only cuisines with no bucket are excluded from the passport grid (no “More cuisines” catch-all). */
    function isPassportListedArea(strArea) {
        return areaToRegion(strArea) !== 'otherWorld';
    }

    function countStampsInListed(stamps, listedAreas) {
        var n = 0;
        listedAreas.forEach(function (a) {
            if (stamps[a]) n++;
        });
        return n;
    }

    var REGION_META = {
        americas: { label: 'Americas & Caribbean', short: '🌎' },
        europe: { label: 'Europe', short: '🌍' },
        mena: { label: 'North Africa & Middle East', short: '🌅' },
        asia: { label: 'Asia & Pacific', short: '🌏' },
        oceania: { label: 'Oceania', short: '🌊' },
        otherEurasia: { label: 'Eastern Europe & Africa', short: '🗺️' }
    };

    var FLAG_HINT = {
        American: '🇺🇸', Canadian: '🇨🇦', Jamaican: '🇯🇲', Mexican: '🇲🇽', Argentinian: '🇦🇷', Uruguayan: '🇺🇾',
        Venezulan: '🇻🇪',
        British: '🇬🇧', Croatian: '🇭🇷', Dutch: '🇳🇱', French: '🇫🇷', Greek: '🇬🇷',
        Irish: '🇮🇪', Italian: '🇮🇹', Polish: '🇵🇱', Portuguese: '🇵🇹', Spanish: '🇪🇸', Ukrainian: '🇺🇦',
        Norwegian: '🇳🇴', Slovakian: '🇸🇰',
        Egyptian: '🇪🇬', Moroccan: '🇲🇦', Tunisian: '🇹🇳', Turkish: '🇹🇷', Algerian: '🇩🇿', Syrian: '🇸🇾', 'Saudi Arabian': '🇸🇦',
        Chinese: '🇨🇳', Japanese: '🇯🇵', Indian: '🇮🇳', Malaysian: '🇲🇾', Thai: '🇹🇭', Vietnamese: '🇻🇳', Filipino: '🇵🇭',
        Australian: '🇦🇺',
        Russian: '🇷🇺', Kenyan: '🇰🇪'
    };

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function getStampsMap() {
        return readStore();
    }

    function getPassportRecipesForArea(strArea) {
        var area = normalizeArea(strArea);
        var list = readRaw().recipesByArea[area];
        return Array.isArray(list) ? list.slice() : [];
    }

    /** True if this MealDB id appears under that cuisine’s passport recipes (recipe page button state). */
    function isRecipeInPassport(strArea, idMeal) {
        var area = normalizeArea(strArea);
        var id = String(idMeal != null ? idMeal : '').trim();
        if (!area || !id) return false;
        var list = readRaw().recipesByArea[area] || [];
        return list.some(function (x) {
            return String(x.idMeal || x.id) === id;
        });
    }

    function recipeHrefForPassport(mealId) {
        var id = encodeURIComponent(String(mealId || '').trim());
        var base = global.CUISINE_PASSPORT_RECIPE_BASE || '../Home page/recipe.html';
        return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'id=' + id;
    }

    /**
     * @param {string} strArea
     * @param {{ idMeal?: string, id?: string, strMeal?: string, name?: string, strMealThumb?: string, thumb?: string, savedAt?: string }=} mealOpt
     * @returns {boolean} true if this call created a new country stamp (first time for that cuisine)
     */
    function recordPassportStamp(strArea, mealOpt) {
        var area = normalizeArea(strArea);
        if (!area || /^unknown$/i.test(area)) return false;

        var raw = readRaw();
        var stamps = raw.stamps;
        var rba = raw.recipesByArea;
        var recipesByArea = {};
        Object.keys(rba).forEach(function (k) { recipesByArea[k] = [].slice.call(rba[k] || []); });

        var addedRecipe = false;
        if (mealOpt && (mealOpt.idMeal != null || mealOpt.id != null)) {
            var id = String(mealOpt.idMeal != null ? mealOpt.idMeal : mealOpt.id).trim();
            if (id) {
                var list = recipesByArea[area] ? recipesByArea[area].slice() : [];
                var dup = list.some(function (x) { return String(x.idMeal || x.id) === id; });
                if (!dup) {
                    list.push({
                        idMeal: id,
                        strMeal: mealOpt.strMeal || mealOpt.name || 'Recipe',
                        strMealThumb: mealOpt.strMealThumb || mealOpt.thumb || '',
                        savedAt: mealOpt.savedAt || new Date().toISOString()
                    });
                    recipesByArea[area] = list;
                    addedRecipe = true;
                }
            }
        }

        var wasNewCountryStamp = !stamps[area];
        if (wasNewCountryStamp) {
            stamps[area] = new Date().toISOString();
            writeRaw({ stamps: stamps, recipesByArea: recipesByArea });
            try {
                global.dispatchEvent(new CustomEvent('cc-passport-updated', { detail: { area: area } }));
            } catch (_) { /* IE */ }
            return true;
        }
        if (addedRecipe) {
            writeRaw({ stamps: stamps, recipesByArea: recipesByArea });
            try {
                global.dispatchEvent(new CustomEvent('cc-passport-updated', { detail: { area: area, recipesAdded: true } }));
            } catch (_) { /* IE */ }
            return true;
        }
        return false;
    }

    function isStamped(strArea) {
        var area = normalizeArea(strArea);
        return !!(readStore()[area]);
    }

    /**
     * @returns {Promise<string[]>}
     */
    function fetchMealDbAreas() {
        return fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var list = (data.meals || [])
                    .map(function (m) { return m.strArea; })
                    .filter(Boolean);
                // stable unique preserve order from API
                var seen = Object.create(null);
                var out = [];
                list.forEach(function (a) {
                    if (!seen[a]) { seen[a] = true; out.push(a); }
                });
                return out;
            })
            .catch(function () {
                return [
                    'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch', 'Egyptian',
                    'French', 'Filipino', 'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese',
                    'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian',
                    'Spanish', 'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Unknown', 'Vietnamese'
                ].filter(function (a) { return a !== 'Unknown'; });
            });
    }

    function stampCount(areasArr, stamps) {
        var n = 0;
        areasArr.forEach(function (a) {
            if (stamps[a]) n++;
        });
        return n;
    }

    function renderTilesForAreas(areas, stamps) {
        var html = '';
        areas.sort(function (a, b) { return a.localeCompare(b); });
        areas.forEach(function (area) {
            var stamped = !!stamps[area];
            var flag = FLAG_HINT[area] || '🍽️';
            var dateStr = stamped && stamps[area]
                ? new Date(stamps[area]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
            html += '<div class="passport-tile' + (stamped ? ' passport-tile--stamped passport-tile--open' : '') + '" title="' +
                escapeHtml(area + (stamped ? ' · tap to see recipes · ' + dateStr : ' · cook a MealDB recipe from this cuisine')) +
                '" data-area="' + escapeHtml(area) + '"' +
                (stamped ? ' role="button" tabindex="0" aria-label="' + escapeHtml('View recipes for ' + area) + '"' : '') +
                '>' +
                '<span class="passport-tile-flag" aria-hidden="true">' + flag + '</span>' +
                '<span class="passport-tile-name">' + escapeHtml(area) + '</span>' +
                (stamped
                    ? '<span class="passport-tile-check" aria-hidden="true">✓</span>'
                    : '<span class="passport-tile-empty">—</span>') +
                '</div>';
        });
        return html;
    }

    function renderByRegion(areaList, stamps) {
        var buckets = {};
        ['americas', 'europe', 'mena', 'asia', 'oceania', 'otherEurasia'].forEach(function (gid) {
            buckets[gid] = [];
        });

        areaList.forEach(function (a) {
            if (!a || /^unknown$/i.test(a)) return;
            var bid = areaToRegion(a);
            if (bid === 'otherWorld' || !buckets[bid]) return;
            buckets[bid].push(a);
        });

        var order = ['americas', 'europe', 'mena', 'asia', 'oceania', 'otherEurasia'];
        var out = '';

        order.forEach(function (gid) {
            var arr = buckets[gid] || [];
            if (!arr.length) return;
            var meta = REGION_META[gid] || { label: gid, short: '' };
            out += '<div class="passport-region" data-region="' + gid + '">' +
                '<div class="passport-region-head">' +
                '<span class="passport-region-emoji">' + meta.short + '</span>' +
                '<h4 class="passport-region-title">' + escapeHtml(meta.label) + '</h4>' +
                '<span class="passport-region-count">' +
                stampCount(arr, stamps) + ' / ' + arr.length +
                '</span>' +
                '</div>' +
                '<div class="passport-region-grid">' + renderTilesForAreas(arr, stamps) + '</div>' +
                '</div>';
        });

        return out;
    }

    /**
     * @param {HTMLElement | string} container - element or id
     */
    function initCuisinePassportSection(container) {
        var root = typeof container === 'string' ? document.getElementById(container) : container;
        if (!root) return;

        var stamps = readStore();
        var totalStamped = Object.keys(stamps).length;

        root.innerHTML = '<div class="passport-loading">Loading cuisines from TheMealDB…</div>';

        fetchMealDbAreas().then(function (areas) {
            var valid = areas.filter(function (a) { return a && !/^unknown$/i.test(a); })
                .filter(isPassportListedArea);
            var total = valid.length;

            stamps = readStore();
            totalStamped = countStampsInListed(stamps, valid);

            root.innerHTML =
                '<details class="passport-details">' +
                '<summary class="passport-summary">' +
                '<span class="passport-summary-title">📍 Cuisine Passport</span>' +
                '<span class="passport-summary-right">' +
                '<span class="passport-stats-badge">' +
                '<span class="passport-progress-num">' + totalStamped + '</span>' +
                '<span class="passport-progress-div">/</span>' +
                '<span class="passport-progress-den">' + total + '</span>' +
                '</span>' +
                '<span class="passport-chevron" aria-hidden="true">▼</span>' +
                '</span>' +
                '</summary>' +
                '<div class="passport-expand-body">' +
                '<p class="passport-sub">When you cook / save a recipe from that cuisine.</p>' +
                '<div class="passport-regions">' +
                renderByRegion(valid, stamps) +
                '</div>' +
                '</div>' +
                '</details>';

            global.__passportAreasCache = valid;
            bindPassportListeners(root);

            registerPassportExplorerRefresh();
        });
    }

    function registerPassportExplorerRefresh() {
        if (global.__ccPassportExplorerRefreshRegistered) return;
        global.__ccPassportExplorerRefreshRegistered = true;
        global.addEventListener('cc-passport-updated', function () {
            var mount = document.getElementById('explorePassportMount');
            if (mount && mount.querySelector('.passport-regions')) refreshPassportInto(mount);
        });
    }

    function closePassportRecipesModal() {
        var el = document.getElementById('passportRecipesModal');
        if (el) el.remove();
        document.removeEventListener('keydown', passportModalEsc);
    }

    function passportModalEsc(e) {
        if (e.key === 'Escape') closePassportRecipesModal();
    }

    function openPassportCuisineRecipesModal(strArea) {
        var area = normalizeArea(strArea);
        if (!area) return;
        closePassportRecipesModal();

        var recipes = getPassportRecipesForArea(area);
        var listHtml = '';
        recipes.forEach(function (r) {
            var id = String(r.idMeal || r.id || '');
            var name = r.strMeal || r.name || 'Recipe';
            var thumb = r.strMealThumb || r.thumb || '';
            var href = recipeHrefForPassport(id);
            listHtml +=
                '<a class="passport-modal-row" href="' + escapeHtml(href) + '">' +
                (thumb
                    ? '<span class="passport-modal-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></span>'
                    : '<span class="passport-modal-thumb passport-modal-thumb--empty">🍽️</span>') +
                '<span class="passport-modal-row-text">' + escapeHtml(name) + '</span>' +
                '<span class="passport-modal-row-go" aria-hidden="true">→</span>' +
                '</a>';
        });

        if (!listHtml) {
            listHtml =
                '<p class="passport-modal-empty">No recipe links stored for this cuisine yet. ' +
                'Open a recipe from <strong>' + escapeHtml(area) + '</strong> on the recipe page and save it to a folder, or use the stamp button — they will show up here.</p>';
        }

        var wrap = document.createElement('div');
        wrap.id = 'passportRecipesModal';
        wrap.className = 'passport-modal-backdrop';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'passportModalTitle');
        wrap.innerHTML =
            '<div class="passport-modal-panel">' +
            '<div class="passport-modal-head">' +
            '<h3 id="passportModalTitle" class="passport-modal-title">' + escapeHtml(area) + '</h3>' +
            '<button type="button" class="passport-modal-close" aria-label="Close">×</button>' +
            '</div>' +
            '<div class="passport-modal-body">' + listHtml + '</div>' +
            '</div>';

        wrap.addEventListener('click', function (e) {
            if (e.target === wrap) closePassportRecipesModal();
        });
        var closeBtn = wrap.querySelector('.passport-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closePassportRecipesModal);

        document.body.appendChild(wrap);
        document.addEventListener('keydown', passportModalEsc);
    }

    function bindPassportListeners(root) {
        if (!root || root.__passportTileClickBound) return;
        root.__passportTileClickBound = true;
        root.addEventListener('click', function (e) {
            var tile = e.target.closest('.passport-tile--open');
            if (!tile || !root.contains(tile)) return;
            e.preventDefault();
            var area = tile.getAttribute('data-area');
            if (area) openPassportCuisineRecipesModal(area);
        });
        root.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var tile = e.target.closest('.passport-tile--open');
            if (!tile || !root.contains(tile)) return;
            e.preventDefault();
            var area = tile.getAttribute('data-area');
            if (area) openPassportCuisineRecipesModal(area);
        });
    }

    function refreshPassportInto(root) {
        var stamps = readStore();
        var valid = global.__passportAreasCache;
        var total = valid ? valid.length : 0;
        var totalStamped = valid && valid.length ? countStampsInListed(stamps, valid) : Object.keys(stamps).length;

        var badge = root.querySelector('.passport-stats-badge');
        if (badge) {
            var n = badge.querySelector('.passport-progress-num');
            var d = badge.querySelector('.passport-progress-den');
            if (n) n.textContent = String(totalStamped);
            if (d) d.textContent = String(total || '—');
        }

        var regionsEl = root.querySelector('.passport-regions');
        if (regionsEl && valid && valid.length) {
            regionsEl.innerHTML = renderByRegion(valid, stamps);
        } else if (!valid) {
            initCuisinePassportSection(root);
            return;
        }
    }

    global.recordCuisinePassportStamp = recordPassportStamp;
    global.isCuisinePassportStamped = isStamped;
    global.isRecipeInPassport = isRecipeInPassport;
    global.getCuisinePassportStamps = getStampsMap;
    global.getPassportRecipesForArea = getPassportRecipesForArea;
    global.openPassportCuisineRecipesModal = openPassportCuisineRecipesModal;
    global.initCuisinePassportSection = initCuisinePassportSection;
    global.fetchMealDbAreasForPassport = fetchMealDbAreas;

}(typeof window !== 'undefined' ? window : globalThis));
