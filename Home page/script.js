// ─── AVATAR SETUP ────────────────────────────────────────────────────────────
function loadAvatar() {
    const profileAvatar = document.getElementById('profileAvatar');
    if (!profileAvatar) return;

    const initial = localStorage.getItem('userInitial');
    const color   = localStorage.getItem('userAvatarColor');
    const name    = localStorage.getItem('userDisplayName');

    if (initial && color) {
        profileAvatar.innerHTML = initial;
        profileAvatar.style.cssText = `
            background-color:${color};
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:20px;font-weight:700;
            font-family:'Poppins',sans-serif;
        `;
        profileAvatar.title = name || '';
    }
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function openRecipe(mealId) {
    window.location.href = `recipe.html?id=${mealId}`;
}

function toggleLogoutPopup(event) {
    event.preventDefault();
    document.getElementById('logoutPopup').classList.toggle('active');
}

function closeLogoutPopup() {
    document.getElementById('logoutPopup').classList.remove('active');
}

function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../login.html';
}

// ─── AREAS LIST (fetched dynamically from MealDB) ─────────────────────────────
// knownAreas: Map of lowercase name → exact canonical string MealDB expects
let knownAreas = new Map();

// Common aliases people might type that differ from MealDB's canonical names
const AREA_ALIASES = {
    'america':      'American',
    'usa':          'American',
    'us':           'American',
    'uk':           'British',
    'england':      'British',
    'english':      'British',
    'britain':      'British',
    'france':       'French',
    'italy':        'Italian',
    'spain':        'Spanish',
    'greece':       'Greek',
    'japan':        'Japanese',
    'china':        'Chinese',
    'india':        'Indian',
    'mexico':       'Mexican',
    'thailand':     'Thai',
    'turkey':       'Turkish',
    'morocco':      'Moroccan',
    'egypt':        'Egyptian',
    'ireland':      'Irish',
    'portugal':     'Portuguese',
    'russia':       'Russian',
    'ukraine':      'Ukrainian',
    'poland':       'Polish',
    'jamaica':      'Jamaican',
    'kenya':        'Kenyan',
    'malaysia':     'Malaysian',
    'philippines':  'Filipino',
    'vietnam':      'Vietnamese',
    'croatia':      'Croatian',
    'netherlands':  'Dutch',
    'holland':      'Dutch',
    'canada':       'Canadian',
    'tunisia':      'Tunisian',
    'kiwi':         'New Zealand',
};

async function loadAreas() {
    try {
        const res  = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list');
        const data = await res.json();
        if (data.meals) {
            data.meals.forEach(item => {
                // item.strArea is the exact canonical string MealDB uses
                knownAreas.set(item.strArea.toLowerCase(), item.strArea);
            });
        }
    } catch (err) {
        console.warn('Could not fetch areas list:', err);
    }
}

/**
 * Returns the exact canonical area string if query matches a cuisine, else null.
 * Checks: aliases → exact area name (case-insensitive via the knownAreas map).
 */
function matchCuisine(query) {
    const q = query.trim().toLowerCase();
    if (AREA_ALIASES[q])   return AREA_ALIASES[q];
    if (knownAreas.has(q)) return knownAreas.get(q);
    return null;
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────
function createCard(meal) {
    const card = document.createElement('div');
    card.classList.add('food-card');
    card.onclick = () => openRecipe(meal.idMeal);
    card.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
        <div class="food-info"><h4>${meal.strMeal}</h4></div>
        <button class="save-btn" onclick="event.stopPropagation()">Save</button>
    `;
    return card;
}

function showMessage(grid, text) {
    grid.innerHTML = `<p>${text}</p>`;
}

// ─── ALL-RECIPES LOADER ───────────────────────────────────────────────────────
let allMealsCache   = [];
let allMealsLoaded  = false;
let allMealsLoading = false;

async function loadAllRecipes() {
    const grid = document.getElementById('foodGrid');
    if (!grid || allMealsLoading) return;
    allMealsLoading = true;

    showMessage(grid, 'Loading all recipes…');

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
                    if (seenIds.has(meal.idMeal)) return;
                    seenIds.add(meal.idMeal);
                    allMealsCache.push(meal);
                    grid.appendChild(createCard(meal));
                });
            } catch (_) {}
        }));

        allMealsLoaded  = true;
        allMealsLoading = false;

        if (grid.children.length === 0) {
            showMessage(grid, 'No recipes could be loaded. Please try again later.');
        }
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
        if (!seen.has(meal.idMeal)) {
            seen.add(meal.idMeal);
            grid.appendChild(createCard(meal));
        }
    });
}

// ─── SMART SEARCH ────────────────────────────────────────────────────────────
let searchDebounceTimer = null;
let isSearchActive      = false;

async function searchRecipes(query) {
    const grid = document.getElementById('foodGrid');
    if (!grid) return;

    showMessage(grid, 'Searching…');

    try {
        const cuisineMatch = matchCuisine(query);

        if (cuisineMatch) {
            // ── CUISINE / AREA SEARCH ──────────────────────────────────
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(cuisineMatch)}`);
            const data = await res.json();

            grid.innerHTML = '';

            if (!data.meals || data.meals.length === 0) {
                showMessage(grid, `No ${cuisineMatch} recipes found.`);
                return;
            }

            const header = document.createElement('p');
            header.textContent = `${cuisineMatch} cuisine — ${data.meals.length} recipes`;
            header.style.cssText = 'grid-column:1/-1;font-weight:600;color:#5A5A5A;padding:4px 0 8px;';
            grid.appendChild(header);

            data.meals.forEach(meal => grid.appendChild(createCard(meal)));

        } else {
            // ── DISH NAME SEARCH ───────────────────────────────────────
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await res.json();

            grid.innerHTML = '';

            if (!data.meals || data.meals.length === 0) {
                showMessage(grid, 'No recipes found. Try a cuisine (e.g. Indian, Mexican) or a dish name.');
                return;
            }

            data.meals.forEach(meal => grid.appendChild(createCard(meal)));
        }

    } catch (err) {
        showMessage(grid, 'Search failed. Please check your connection.');
        console.error('searchRecipes error:', err);
    }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

    loadAvatar();

    // Load the real area list from MealDB first, then start everything else
    await loadAreas();
    loadAllRecipes();

    const searchInput = document.querySelector('.search-bar input');
    const grid        = document.getElementById('foodGrid');

    if (searchInput && grid) {
        searchInput.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(searchDebounceTimer);

            if (query.length === 0) {
                isSearchActive = false;
                if (allMealsLoaded) {
                    restoreAllRecipes(grid);
                } else {
                    loadAllRecipes();
                }
                return;
            }

            isSearchActive = true;
            searchDebounceTimer = setTimeout(() => searchRecipes(query), 350);
        });
    }

    const popup = document.getElementById('logoutPopup');
    if (popup) {
        popup.addEventListener('click', e => {
            if (e.target === popup) closeLogoutPopup();
        });
    }
});