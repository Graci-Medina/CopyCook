// ─── AVATAR SETUP ────────────────────────────────────────────────────────────
function loadAvatar() {
    const profileAvatar = document.getElementById('profileAvatar');
    if (!profileAvatar) return;
    const initial = localStorage.getItem('userInitial');
    const color   = localStorage.getItem('userAvatarColor');
    const name    = localStorage.getItem('userDisplayName');
    if (initial && color) {
        profileAvatar.innerHTML = initial;
        profileAvatar.style.cssText = `background-color:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:700;font-family:'Poppins',sans-serif;`;
        profileAvatar.title = name || '';
    }
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function openRecipe(mealId) { window.location.href = `recipe.html?id=${mealId}`; }

const MEALDB_RANDOM_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
/** Minimum time the wheel spins before navigating (ms), so the animation is visible. */
const ROULETTE_SPIN_MIN_MS = 2800;

/** True when signed-in user's "Made It" ids (Firestore) include this MealDB id. Guests: always false until set loads. */
function userMarkedMadeMeal(idMeal) {
    const set = window.ccMadeMealIdSet;
    if (!set || !(set instanceof Set) || set.size === 0) return false;
    return set.has(String(idMeal));
}

function delayMs(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/** End spin state — also used after bfcache restore when returning via Back. */
function resetSurpriseRecipeButton() {
    const b = document.getElementById('surpriseRecipeBtn');
    if (!b) return;
    b.dataset.loading = '0';
    b.removeAttribute('aria-busy');
    b.disabled = false;
    b.classList.remove('roulette-btn--spinning');
}

window.addEventListener('pageshow', function () {
    resetSurpriseRecipeButton();
});

/**
 * One MealDB random.php fetch; wheel spins at least ROULETTE_SPIN_MIN_MS, then navigate.
 */
async function surpriseRandomRecipe() {
    const btn = document.getElementById('surpriseRecipeBtn');
    if (btn && btn.dataset.loading === '1') return;

    if (btn) {
        btn.dataset.loading = '1';
        btn.setAttribute('aria-busy', 'true');
        btn.disabled = true;
        btn.classList.add('roulette-btn--spinning');
    }

    const t0 = Date.now();

    try {
        const res = await fetch(MEALDB_RANDOM_URL);
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        let meal = data.meals && data.meals[0];
        for (let attempts = 0; attempts < 25 && meal && userMarkedMadeMeal(meal.idMeal); attempts++) {
            const resR = await fetch(MEALDB_RANDOM_URL);
            if (!resR.ok) break;
            const dataR = await resR.json();
            meal = dataR.meals && dataR.meals[0];
        }
        if (!meal || !meal.idMeal) {
            window.alert('No recipe returned. Please try again.');
            resetSurpriseRecipeButton();
            return;
        }
        if (userMarkedMadeMeal(meal.idMeal)) {
            window.alert('Could not find a recipe you have not made yet. Try again or clear some "Made it" recipes.');
            resetSurpriseRecipeButton();
            return;
        }

        const elapsed = Date.now() - t0;
        const waitMore = ROULETTE_SPIN_MIN_MS - elapsed;
        if (waitMore > 0) await delayMs(waitMore);

        resetSurpriseRecipeButton();
        openRecipe(meal.idMeal);
    } catch (err) {
        console.warn('Random recipe roulette:', err);
        window.alert('Could not load a random recipe. Check your connection and try again.');
        resetSurpriseRecipeButton();
    }
}
function toggleLogoutPopup(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    document.getElementById('logoutPopup').classList.toggle('active');
}
function closeLogoutPopup() { document.getElementById('logoutPopup').classList.remove('active'); }
function handleLogout() {
    if (typeof logoutClearSessionKeepPassport === 'function') logoutClearSessionKeepPassport('../login.html');
    else { localStorage.clear(); sessionStorage.clear(); window.location.href = '../login.html'; }
}

window.openRecipe              = openRecipe;
window.surpriseRandomRecipe   = surpriseRandomRecipe;
window.toggleLogoutPopup = toggleLogoutPopup;
window.closeLogoutPopup  = closeLogoutPopup;
window.handleLogout      = handleLogout;

// ─── VOICE SEARCH (Web Speech API) ───────────────────────────────────────────
function initVoiceSearch() {
    const micBtn = document.querySelector('.mic-icon');
    if (!micBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.style.opacity = '0.4';
        micBtn.title = 'Voice search not supported in this browser';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let listening = false;

    micBtn.style.cursor = 'pointer';
    micBtn.title = 'Click to search by voice';

    micBtn.addEventListener('click', () => {
        if (listening) {
            recognition.stop();
            return;
        }
        recognition.start();
    });

    recognition.addEventListener('start', () => {
        listening = true;
        micBtn.style.opacity = '0.5';
        micBtn.title = 'Listening…';
    });

    recognition.addEventListener('result', (e) => {
        const transcript = e.results[0][0].transcript;
        const input = document.getElementById('mainSearchInput');
        if (input) {
            input.value = transcript;
            searchRecipes(transcript);
        }
    });

    recognition.addEventListener('end', () => {
        listening = false;
        micBtn.style.opacity = '1';
        micBtn.title = 'Click to search by voice';
    });

    recognition.addEventListener('error', (e) => {
        listening = false;
        micBtn.style.opacity = '1';
        console.warn('Voice search error:', e.error);
    });
}

// ─── AREAS LIST ───────────────────────────────────────────────────────────────
let knownAreas = new Map();
const AREA_ALIASES = {
    'america':'American','usa':'American','us':'American','uk':'British','england':'British',
    'english':'British','britain':'British','france':'French','italy':'Italian','spain':'Spanish',
    'greece':'Greek','japan':'Japanese','china':'Chinese','india':'Indian','mexico':'Mexican',
    'thailand':'Thai','turkey':'Turkish','morocco':'Moroccan','egypt':'Egyptian','ireland':'Irish',
    'portugal':'Portuguese','russia':'Russian','ukraine':'Ukrainian','poland':'Polish',
    'jamaica':'Jamaican','kenya':'Kenyan','malaysia':'Malaysian','philippines':'Filipino',
    'vietnam':'Vietnamese','croatia':'Croatian','netherlands':'Dutch','holland':'Dutch',
    'canada':'Canadian','tunisia':'Tunisian','kiwi':'New Zealand',
};
async function loadAreas() {
    try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list');
        const data = await res.json();
        if (data.meals) data.meals.forEach(item => knownAreas.set(item.strArea.toLowerCase(), item.strArea));
    } catch (err) { console.warn('Could not fetch areas list:', err); }
}
function matchCuisine(query) {
    const q = query.trim().toLowerCase();
    if (AREA_ALIASES[q]) return AREA_ALIASES[q];
    if (knownAreas.has(q)) return knownAreas.get(q);
    return null;
}

// ─── CARD FACTORY ─────────────────────────────────────────────────────────────
function createCard(meal) {
    const card = document.createElement('div');
    card.classList.add('food-card');
    card.addEventListener('click', () => openRecipe(meal.idMeal));

    const img = document.createElement('img');
    img.src = meal.strMealThumb; img.alt = meal.strMeal; img.loading = 'lazy';

    const info = document.createElement('div');
    info.classList.add('food-info');
    const h4 = document.createElement('h4');
    h4.textContent = meal.strMeal;
    info.appendChild(h4);

    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-btn');
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSavePopup({ id: meal.idMeal, name: meal.strMeal, thumb: meal.strMealThumb });
    });

    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(saveBtn);
    return card;
}
function showMessage(grid, text) { grid.innerHTML = `<p>${text}</p>`; }

// ── Load local copycat recipes ──────────────────────────────────────────────
async function loadCopycatRecipes() {
    try {
        const res  = await fetch('copycat-recipes.json');
        const data = await res.json();
        return data.meals || [];
    } catch (err) {
        console.warn('Could not load copycat-recipes.json:', err);
        return [];
    }
}

/** True if local copycat meal matches search text and/or resolved cuisine/area name. */
function copycatMatchesSearch(meal, query, cuisineMatch) {
    const q = (query || '').trim().toLowerCase();
    const hay = [
        meal.strMeal, meal.strTags, meal.strArea, meal.strCategory,
        meal.strDescription || '', meal.strRestaurant || '', meal.strAuthor || ''
    ].join(' ').toLowerCase();

    if (cuisineMatch) {
        const c = String(cuisineMatch).trim().toLowerCase();
        if (c && (meal.strCategory || '').toLowerCase() === c) return true;
        if (c && (meal.strArea || '').toLowerCase() === c) return true;
    }

    if (!q) return false;
    const words = q.split(/\s+/).filter(Boolean);
    return words.every(w => hay.includes(w));
}

/** Returns copycats that match and are not already in `seen` (mutates seen when includeInSeen). */
async function matchingCopycatsForSearch(query, cuisineMatch, seen, includeInSeen) {
    const copycats = await loadCopycatRecipes();
    const out = [];
    for (const meal of copycats) {
        if (userMarkedMadeMeal(meal.idMeal)) continue;
        if (seen.has(meal.idMeal)) continue;
        if (!copycatMatchesSearch(meal, query, cuisineMatch)) continue;
        if (includeInSeen) seen.add(meal.idMeal);
        out.push(meal);
    }
    return out;
}

// ─── ALL-RECIPES LOADER ───────────────────────────────────────────────────────
let allMealsCache = [], allMealsLoaded = false, allMealsLoading = false;

async function loadAllRecipes() {
    const grid = document.getElementById('foodGrid');
    if (!grid || allMealsLoading) return;
    allMealsLoading = true;
    showMessage(grid, 'Loading recipes…');
    try {
        const catRes  = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
        const catData = await catRes.json();
        const categories = catData.categories.map(c => c.strCategory);
        grid.innerHTML = '';
        const seenIds = new Set();
        await Promise.all(categories.map(async (cat) => {
            try {
                const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
                const data = await res.json();
                if (!data.meals) return;
                data.meals.forEach(meal => {
                    if (userMarkedMadeMeal(meal.idMeal)) return;
                    if (seenIds.has(meal.idMeal)) return;
                    seenIds.add(meal.idMeal);
                    allMealsCache.push(meal);
                    grid.appendChild(createCard(meal));
                });
            } catch (_) {}
        }));
        allMealsLoaded = true; allMealsLoading = false;
        // Merge copycat recipes into the feed
        const copycats = await loadCopycatRecipes();
        copycats.forEach(meal => {
            if (userMarkedMadeMeal(meal.idMeal)) return;
            if (!seenIds.has(meal.idMeal)) {
                seenIds.add(meal.idMeal);
                allMealsCache.push(meal);
                grid.appendChild(createCard(meal));
            }
        });
        if (grid.children.length === 0) showMessage(grid, 'No recipes could be loaded. Please try again later.');
    } catch (err) {
        allMealsLoading = false;
        showMessage(grid, 'Failed to load recipes. Please check your connection.');
        console.error('loadAllRecipes error:', err);
    }
}

function restoreAllRecipes(grid) {
    grid.innerHTML = '';
    const seen = new Set();
    allMealsCache.forEach(meal => {
        if (userMarkedMadeMeal(meal.idMeal)) return;
        if (!seen.has(meal.idMeal)) { seen.add(meal.idMeal); grid.appendChild(createCard(meal)); }
    });
}

// ─── ONBOARDING PREFERENCES → HOME FEED ───────────────────────────────────────
function normalizePrefsObject(p) {
    if (!p || typeof p !== 'object') return null;
    return {
        cuisines: Array.isArray(p.cuisines) ? p.cuisines : [],
        diet: Array.isArray(p.diet) ? p.diet : [],
        skill: p.skill || null,
        feed: Array.isArray(p.feed) ? p.feed : []
    };
}

function parseCcPrefs() {
    try {
        const raw = localStorage.getItem('cc_prefs');
        if (!raw) return null;
        return normalizePrefsObject(JSON.parse(raw));
    } catch (_) { return null; }
}

function prefsHaveSurveySignal(prefs) {
    if (!prefs) return false;
    const hasCuisines = prefs.cuisines.some(c => c && c !== 'Other');
    const hasFeed = prefs.feed.length > 0;
    const hasDiet = prefs.diet.some(d => d && d !== 'None');
    return hasCuisines || hasFeed || hasDiet || !!prefs.skill;
}

/** Use personalized home after onboarding, or when local prefs look like a survey (before cc_onboarded is set). */
function shouldUsePersonalizedFeed(prefs) {
    if (localStorage.getItem('cc_onboarded') === 'true') return true;
    return prefsHaveSurveySignal(prefs);
}

function prefsForHomeFeed() {
    const p = parseCcPrefs();
    if (p) return p;
    if (localStorage.getItem('cc_onboarded') === 'true') return normalizePrefsObject({});
    return null;
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

async function addMealsFromArea(area, seen, bucket) {
    if (!area || area === 'Other') return;
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`);
        const data = await res.json();
        (data.meals || []).forEach(m => {
            if (userMarkedMadeMeal(m.idMeal)) { seen.add(m.idMeal); return; }
            if (!seen.has(m.idMeal)) { seen.add(m.idMeal); bucket.push(m); }
        });
    } catch (_) {}
}

async function addMealsFromCategory(cat, seen, bucket) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
        const data = await res.json();
        (data.meals || []).forEach(m => {
            if (userMarkedMadeMeal(m.idMeal)) { seen.add(m.idMeal); return; }
            if (!seen.has(m.idMeal)) { seen.add(m.idMeal); bucket.push(m); }
        });
    } catch (_) {}
}

async function supplementalRecipeFill(seen, bucket, minCount) {
    try {
        const catRes = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
        const catData = await catRes.json();
        const categories = catData.categories.map(c => c.strCategory);
        for (const cat of categories) {
            if (bucket.length >= minCount) break;
            await addMealsFromCategory(cat, seen, bucket);
        }
    } catch (_) {}
}

const FEED_OPTION_CATEGORIES = {
    Quick: ['Chicken', 'Pasta', 'Seafood', 'Breakfast'],
    Healthy: ['Vegetarian', 'Vegan', 'Seafood'],
    Desserts: ['Dessert'],
    Trending: ['Chicken', 'Beef', 'Dessert', 'Pasta', 'Seafood'],
    World: []
};

async function loadPersonalizedRecipes(prefs) {
    const grid = document.getElementById('foodGrid');
    if (!grid) return;
    allMealsLoading = true;
    allMealsCache = [];
    const seen = new Set();
    showMessage(grid, 'Loading your personalized feed…');

    for (const area of prefs.cuisines || []) {
        await addMealsFromArea(area, seen, allMealsCache);
    }

    const dietCats = new Set();
    for (const d of prefs.diet || []) {
        if (d === 'Vegetarian') dietCats.add('Vegetarian');
        if (d === 'Vegan') dietCats.add('Vegan');
        if (d === 'Pescatarian') dietCats.add('Seafood');
    }
    for (const c of dietCats) {
        await addMealsFromCategory(c, seen, allMealsCache);
    }

    for (const f of prefs.feed || []) {
        const cats = FEED_OPTION_CATEGORIES[f];
        if (cats && cats.length) {
            for (const c of cats) {
                await addMealsFromCategory(c, seen, allMealsCache);
            }
        }
    }

    if (prefs.skill === 'Beginner') {
        for (const c of ['Chicken', 'Pasta']) {
            await addMealsFromCategory(c, seen, allMealsCache);
        }
    } else if (prefs.skill === 'Advanced') {
        for (const c of ['Beef', 'Lamb']) {
            await addMealsFromCategory(c, seen, allMealsCache);
        }
    }

    if (allMealsCache.length < 24) {
        await supplementalRecipeFill(seen, allMealsCache, 32);
    }

    shuffleInPlace(allMealsCache);
    allMealsCache = allMealsCache.filter(m => !userMarkedMadeMeal(m.idMeal));

    allMealsLoading = false;
    allMealsLoaded = true;

    if (allMealsCache.length === 0) {
        allMealsLoaded = false;
        loadAllRecipes();
        return;
    }

    grid.innerHTML = '';
    allMealsCache.forEach(meal => {
        if (!userMarkedMadeMeal(meal.idMeal)) grid.appendChild(createCard(meal));
    });
}

function applyFeedTabPreference(prefs) {
    if (localStorage.getItem('cc_justOnboarded')) {
        localStorage.removeItem('cc_justOnboarded');
    }
    if (!prefs || !prefs.feed || !prefs.feed.length) return;
    if (prefs.feed[0] === 'Community' && typeof window.switchTab === 'function') {
        requestAnimationFrame(() => window.switchTab('community'));
    }
}

function startHomeFeed() {
    const prefs = prefsForHomeFeed();
    if (shouldUsePersonalizedFeed(prefs)) {
        loadPersonalizedRecipes(prefs || normalizePrefsObject({}));
    } else {
        loadAllRecipes();
    }
    applyFeedTabPreference(prefs);
}

window.applyHomePersonalization = function () {
    const grid = document.getElementById('foodGrid');
    const input = document.getElementById('mainSearchInput');
    if (!grid) return;
    if (input && input.value.trim()) return;
    const prefs = prefsForHomeFeed();
    if (shouldUsePersonalizedFeed(prefs)) {
        loadPersonalizedRecipes(prefs || normalizePrefsObject({}));
    } else {
        loadAllRecipes();
    }
};

// ─── SMART SEARCH ─────────────────────────────────────────────────────────────
let searchDebounceTimer = null, isSearchActive = false;
const GENERIC_SEARCH_CATEGORY_MAP = {
    dessert: ['Dessert'],
    desserts: ['Dessert'],
    sweet: ['Dessert'],
    sweets: ['Dessert'],
    breakfast: ['Breakfast'],
    brunch: ['Breakfast'],
    dinner: ['Beef', 'Chicken', 'Lamb', 'Pasta', 'Seafood', 'Pork', 'Goat'],
    lunch: ['Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian'],
    savory: ['Beef', 'Chicken', 'Lamb', 'Seafood', 'Pork', 'Goat', 'Vegetarian'],
    healthy: ['Vegetarian', 'Vegan', 'Seafood'],
    quick: ['Breakfast', 'Chicken', 'Pasta', 'Seafood'],
    snack: ['Starter', 'Side'],
    snacks: ['Starter', 'Side']
};

function genericSearchCategories(query) {
    const normalized = (query || '').toLowerCase().trim();
    if (!normalized) return [];
    const categories = new Set();
    const terms = normalized.split(/\s+/).filter(Boolean);
    terms.forEach((term) => {
        const mapped = GENERIC_SEARCH_CATEGORY_MAP[term];
        if (mapped) mapped.forEach((c) => categories.add(c));
    });
    if (categories.size) return Array.from(categories);

    // Fallback: substring matching for phrases like "savory dinner ideas"
    Object.keys(GENERIC_SEARCH_CATEGORY_MAP).forEach((key) => {
        if (normalized.includes(key)) {
            GENERIC_SEARCH_CATEGORY_MAP[key].forEach((c) => categories.add(c));
        }
    });
    return Array.from(categories);
}

async function searchByGenericFoodTerm(query, grid) {
    const categories = genericSearchCategories(query);
    if (!categories.length) return false;

    const seen = new Set();
    const matches = [];
    await Promise.all(categories.map(async (cat) => {
        try {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
            const data = await res.json();
            (data.meals || []).forEach((meal) => {
                if (userMarkedMadeMeal(meal.idMeal)) return;
                if (seen.has(meal.idMeal)) return;
                seen.add(meal.idMeal);
                matches.push(meal);
            });
        } catch (_) {}
    }));

    const seenForCc = new Set(matches.map(m => m.idMeal));
    const ccMatches = await matchingCopycatsForSearch(query, null, seenForCc, true);

    grid.innerHTML = '';
    if (!matches.length && !ccMatches.length) {
        showMessage(grid, `No recipes found for "${query}".`);
        return true;
    }

    const total = matches.length + ccMatches.length;
    const header = document.createElement('p');
    header.textContent = `${query} — ${total} recipe${total !== 1 ? 's' : ''}`;
    header.style.cssText = 'grid-column:1/-1;font-weight:600;color:#5A5A5A;padding:4px 0 8px;';
    grid.appendChild(header);
    matches.forEach((meal) => grid.appendChild(createCard(meal)));
    ccMatches.forEach((meal) => grid.appendChild(createCard(meal)));
    return true;
}

async function searchRecipes(query) {
    const tabCommunity = document.getElementById('tabCommunity');
    if (tabCommunity && tabCommunity.classList.contains('active') && typeof window.searchCommunityPosts === 'function') {
        window.searchCommunityPosts(query);
        return;
    }

    const grid = document.getElementById('foodGrid');
    if (!grid) return;
    showMessage(grid, 'Searching…');
    try {
        const handledGeneric = await searchByGenericFoodTerm(query, grid);
        if (handledGeneric) return;

        const cuisineMatch = matchCuisine(query);
        if (cuisineMatch) {
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(cuisineMatch)}`);
            const data = await res.json();
            const meals = (data.meals || []).filter(m => !userMarkedMadeMeal(m.idMeal));
            const seen = new Set(meals.map(m => m.idMeal));
            const ccMatches = await matchingCopycatsForSearch(query, cuisineMatch, seen, true);

            grid.innerHTML = '';
            if (!meals.length && !ccMatches.length) {
                showMessage(grid, `No ${cuisineMatch} recipes found.`);
                return;
            }
            const total = meals.length + ccMatches.length;
            const header = document.createElement('p');
            header.textContent = `${cuisineMatch} cuisine — ${total} recipe${total !== 1 ? 's' : ''}`;
            header.style.cssText = 'grid-column:1/-1;font-weight:600;color:#5A5A5A;padding:4px 0 8px;';
            grid.appendChild(header);
            meals.forEach(meal => grid.appendChild(createCard(meal)));
            ccMatches.forEach(meal => grid.appendChild(createCard(meal)));
        } else {
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await res.json();
            const meals = (data.meals || []).filter(m => !userMarkedMadeMeal(m.idMeal));
            const seen = new Set(meals.map(m => m.idMeal));
            const ccMatches = await matchingCopycatsForSearch(query, null, seen, true);

            grid.innerHTML = '';
            if (!meals.length && !ccMatches.length) {
                showMessage(grid, 'No recipes found. Try a cuisine (e.g. Indian, Mexican) or a dish name.');
                return;
            }
            if (ccMatches.length) {
                const header = document.createElement('p');
                header.textContent = meals.length
                    ? `${query} — ${meals.length} from TheMealDB, ${ccMatches.length} CopyCook`
                    : `${query} — ${ccMatches.length} CopyCook recipe${ccMatches.length !== 1 ? 's' : ''}`;
                header.style.cssText = 'grid-column:1/-1;font-weight:600;color:#5A5A5A;padding:4px 0 8px;';
                grid.appendChild(header);
            }
            meals.forEach(meal => grid.appendChild(createCard(meal)));
            ccMatches.forEach(meal => grid.appendChild(createCard(meal)));
        }
    } catch (err) {
        showMessage(grid, 'Search failed. Please check your connection.');
        console.error('searchRecipes error:', err);
    }
}

// ─── SAVE POPUP ───────────────────────────────────────────────────────────────
let currentSaveMeal  = null;
let savePrivacy      = 'private';
let selectedFolderId = null;

const PLACEHOLDER_IMAGES = [
    'https://www.themealdb.com/images/media/meals/sytuqu1511553755.jpg',
    'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    'https://www.themealdb.com/images/media/meals/58oia61564916529.jpg',
    'https://www.themealdb.com/images/media/meals/wyrqqq1468233628.jpg',
    'https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg',
    'https://www.themealdb.com/images/media/meals/tkxquw1628771028.jpg',
];

function getFolders() { return JSON.parse(localStorage.getItem('ccFolders') || '[]'); }
function saveFoldersLocal(f) { localStorage.setItem('ccFolders', JSON.stringify(f)); }

async function openSavePopup(meal) {
    currentSaveMeal  = meal;
    selectedFolderId = null;
    document.getElementById('newFolderNameInput').value = '';
    selectSavePrivacy('private');
    document.getElementById('savePopupOverlay').classList.add('active');

    // Sync folders from Firestore into localStorage
    const uid = localStorage.getItem('userUID');
    if (uid && window.fbGetFolders) {
        try { saveFoldersLocal(await window.fbGetFolders(uid)); }
        catch (err) { console.warn('Could not refresh folders:', err); }
    }
    renderSaveFolders();
}

function closeSavePopup(e) {
    if (!e || e.target === document.getElementById('savePopupOverlay'))
        document.getElementById('savePopupOverlay').classList.remove('active');
}

function renderSaveFolders() {
    const list    = document.getElementById('saveFoldersList');
    const folders = getFolders();
    list.innerHTML = '';

    if (!folders.length) {
        list.innerHTML = '<p style="font-size:13px;color:#9A9A9A;padding:4px 0;">No folders yet — create one below!</p>';
        return;
    }

    folders.forEach((folder, idx) => {
        const thumb       = folder.coverImage || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
        const recipeCount = (folder.recipes || []).length;
        const countLabel  = `${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}`;
        const isSelected  = selectedFolderId === folder.id;

        const item = document.createElement('div');
        item.className = `save-folder-item${isSelected ? ' selected' : ''}`;
        item.innerHTML = `
            <div class="save-folder-thumb">
                <img src="${thumb}" alt="${folder.name}" loading="lazy">
            </div>
            <div class="save-folder-info">
                <div class="save-folder-name">${folder.name}</div>
                <div class="save-folder-count">${countLabel}</div>
            </div>
            <div class="save-folder-radio"></div>`;

        item.addEventListener('click', () => {
            selectedFolderId = folder.id;
            renderSaveFolders();
        });
        list.appendChild(item);
    });
}

function selectSavePrivacy(p) {
    savePrivacy = p;
    document.getElementById('privBtnPrivate').className = `privacy-btn${p === 'private' ? ' active' : ''}`;
    document.getElementById('privBtnPublic').className  = `privacy-btn${p === 'public'  ? ' active' : ''}`;
}

async function confirmCreateFolder() {
    const name = document.getElementById('newFolderNameInput').value.trim();
    if (!name) {
        document.getElementById('newFolderNameInput').style.borderColor = '#D4A5A5';
        setTimeout(() => document.getElementById('newFolderNameInput').style.borderColor = '', 1500);
        return;
    }
    const safeName = name.replace(/\//g, '_');
    const folders  = getFolders();
    const existedBefore = folders.some(f => f.id === safeName);
    if (!existedBefore) {
        folders.push({ id: safeName, name, privacy: savePrivacy, recipes: [], coverImage: null, createdAt: new Date().toISOString() });
        saveFoldersLocal(folders);
    }
    const uid = localStorage.getItem('userUID');
    if (uid && window.fbCreateFolder) {
        try { await window.fbCreateFolder(uid, name, savePrivacy); console.log('✅ Folder created:', name); }
        catch (err) { console.error('❌ Folder create failed:', err); }
    }
    document.getElementById('newFolderNameInput').value = '';
    renderSaveFolders();
    try {
        if (!existedBefore && window.UIFeedback) {
            window.UIFeedback.toggle();
            window.UIFeedback.hapticMedium();
        }
    } catch (_) {}
}

async function confirmSaveToFolder() {
    if (!selectedFolderId || !currentSaveMeal) return;

    const folders = getFolders();
    const folder  = folders.find(f => f.id === selectedFolderId);
    if (!folder) return;

    folder.recipes = folder.recipes || [];
    const already  = folder.recipes.some(r => r.id === currentSaveMeal.id);
    if (!already) {
        const mealObj = { id: currentSaveMeal.id, name: currentSaveMeal.name, thumb: currentSaveMeal.thumb };
        folder.recipes.push(mealObj);
        if (!folder.coverImage) folder.coverImage = currentSaveMeal.thumb;
        saveFoldersLocal(folders);

        const uid = localStorage.getItem('userUID');
        if (uid && window.fbSaveRecipe) {
            try { await window.fbSaveRecipe(uid, folder.id, mealObj); console.log('✅ Saved to:', folder.name); }
            catch (err) { console.error('❌ Save failed:', err); }
        }
    }
    document.getElementById('savePopupOverlay').classList.remove('active');
    try {
        if (!already && window.UIFeedback) {
            window.UIFeedback.success();
            window.UIFeedback.hapticSuccess();
        }
    } catch (_) {}
}

window.openSavePopup       = openSavePopup;
window.closeSavePopup      = closeSavePopup;
window.selectSavePrivacy   = selectSavePrivacy;
window.confirmCreateFolder = confirmCreateFolder;
window.confirmSaveToFolder = confirmSaveToFolder;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    loadAvatar();
    initVoiceSearch();
    await loadAreas();
    startHomeFeed();

    const searchInput = document.querySelector('.search-bar input');
    const grid        = document.getElementById('foodGrid');
    if (searchInput && grid) {
        searchInput.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(searchDebounceTimer);
            if (query.length === 0) {
                isSearchActive = false;
                if (allMealsLoaded && allMealsCache.length) {
                    restoreAllRecipes(grid);
                } else {
                    startHomeFeed();
                }
                return;
            }
            isSearchActive = true;
            searchDebounceTimer = setTimeout(() => searchRecipes(query), 350);
        });
    }

    const nfi = document.getElementById('newFolderNameInput');
    if (nfi) nfi.addEventListener('keydown', e => { if (e.key === 'Enter') confirmCreateFolder(); });

    const overlay = document.getElementById('savePopupOverlay');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

    const popup = document.getElementById('logoutPopup');
    if (popup) popup.addEventListener('click', e => { if (e.target === popup) closeLogoutPopup(); });
});