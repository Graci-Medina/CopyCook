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
function toggleLogoutPopup(event) { event.preventDefault(); document.getElementById('logoutPopup').classList.toggle('active'); }
function closeLogoutPopup() { document.getElementById('logoutPopup').classList.remove('active'); }
function handleLogout() { localStorage.clear(); sessionStorage.clear(); window.location.href = '../login.html'; }

window.openRecipe        = openRecipe;
window.toggleLogoutPopup = toggleLogoutPopup;
window.closeLogoutPopup  = closeLogoutPopup;
window.handleLogout      = handleLogout;

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
                    if (seenIds.has(meal.idMeal)) return;
                    seenIds.add(meal.idMeal);
                    allMealsCache.push(meal);
                    grid.appendChild(createCard(meal));
                });
            } catch (_) {}
        }));
        allMealsLoaded = true; allMealsLoading = false;
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
        if (!seen.has(meal.idMeal)) { seen.add(meal.idMeal); grid.appendChild(createCard(meal)); }
    });
}

// ─── SMART SEARCH ─────────────────────────────────────────────────────────────
let searchDebounceTimer = null, isSearchActive = false;

async function searchRecipes(query) {
    const grid = document.getElementById('foodGrid');
    if (!grid) return;
    showMessage(grid, 'Searching…');
    try {
        const cuisineMatch = matchCuisine(query);
        if (cuisineMatch) {
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(cuisineMatch)}`);
            const data = await res.json();
            grid.innerHTML = '';
            if (!data.meals || data.meals.length === 0) { showMessage(grid, `No ${cuisineMatch} recipes found.`); return; }
            const header = document.createElement('p');
            header.textContent = `${cuisineMatch} cuisine — ${data.meals.length} recipes`;
            header.style.cssText = 'grid-column:1/-1;font-weight:600;color:#5A5A5A;padding:4px 0 8px;';
            grid.appendChild(header);
            data.meals.forEach(meal => grid.appendChild(createCard(meal)));
        } else {
            const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await res.json();
            grid.innerHTML = '';
            if (!data.meals || data.meals.length === 0) { showMessage(grid, 'No recipes found. Try a cuisine (e.g. Indian, Mexican) or a dish name.'); return; }
            data.meals.forEach(meal => grid.appendChild(createCard(meal)));
        }
    } catch (err) {
        showMessage(grid, 'Search failed. Please check your connection.');
        console.error('searchRecipes error:', err);
    }
}

// ─── SAVE POPUP ───────────────────────────────────────────────────────────────
let currentSaveMeal = null, savePrivacy = 'private';

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
    currentSaveMeal = meal;
    document.getElementById('folderSearchInput').value = '';
    document.getElementById('savePopupOverlay').classList.add('active');
    const uid = localStorage.getItem('userUID');
    if (uid && window.fbGetFolders) {
        try { saveFoldersLocal(await window.fbGetFolders(uid)); }
        catch (err) { console.warn('Could not refresh folders:', err); }
    }
    renderSaveFolders('');
}

function closeSavePopup(e) {
    if (!e || e.target === document.getElementById('savePopupOverlay'))
        document.getElementById('savePopupOverlay').classList.remove('active');
}

function filterFolders(query) { renderSaveFolders(query.toLowerCase()); }

function renderSaveFolders(query) {
    const list    = document.getElementById('saveFoldersList');
    const folders = getFolders();
    const filtered = query ? folders.filter(f => f.name.toLowerCase().includes(query)) : folders;
    list.innerHTML = '';
    if (filtered.length === 0) { list.innerHTML = `<p style="font-size:13px;color:#9A9A9A;padding:8px 12px;">No folders found.</p>`; return; }

    filtered.forEach((folder, idx) => {
        const isSaved = currentSaveMeal && (folder.recipes || []).some(r => r.id === currentSaveMeal.id);
        const thumb   = folder.coverImage || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
        const lockSvg = folder.privacy === 'private'
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#5A5A5A" stroke-width="2" fill="none"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#5A5A5A" stroke-width="2" fill="none"/></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#9FB19F" stroke-width="2" fill="none"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9FB19F" stroke-width="2" fill="none"/></svg>`;
        const checkSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#9FB19F"/><path d="M7 12l4 4 6-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        const item = document.createElement('div');
        item.className = `save-folder-item${isSaved ? ' saved' : ''}`;
        item.innerHTML = `
            <div class="save-folder-thumb"><img src="${thumb}" alt="${folder.name}" loading="lazy"></div>
            <span class="save-folder-name">${folder.name}</span>
            <div class="save-folder-icon">
                <span class="checkmark">${checkSvg}</span>
                <span class="privacy-icon" style="${isSaved ? 'display:none' : ''}">${lockSvg}</span>
            </div>`;
        item.addEventListener('click', () => toggleSaveToFolder(folder.id));
        list.appendChild(item);
    });
}

async function toggleSaveToFolder(folderId) {
    if (!currentSaveMeal) return;
    const folders = getFolders();
    const folder  = folders.find(f => f.id === folderId);
    if (!folder) return;
    folder.recipes = folder.recipes || [];
    const idx   = folder.recipes.findIndex(r => r.id === currentSaveMeal.id);
    const uid   = localStorage.getItem('userUID');
    const mealObj = { id: currentSaveMeal.id, name: currentSaveMeal.name, thumb: currentSaveMeal.thumb };

    if (idx === -1) {
        folder.recipes.push(mealObj);
        if (!folder.coverImage) folder.coverImage = currentSaveMeal.thumb;
        if (uid && window.fbSaveRecipe) {
            try { await window.fbSaveRecipe(uid, folder.name, mealObj); console.log('✅ Saved:', folder.name); }
            catch (err) { console.error('❌ Save failed:', err); }
        }
    } else {
        folder.recipes.splice(idx, 1);
        if (uid && window.fbUnsaveRecipe) {
            try { await window.fbUnsaveRecipe(uid, folder.name, mealObj); console.log('✅ Removed:', folder.name); }
            catch (err) { console.error('❌ Remove failed:', err); }
        }
    }
    saveFoldersLocal(folders);
    renderSaveFolders(document.getElementById('folderSearchInput').value.toLowerCase());
}

function openSaveCreateFolder() {
    document.getElementById('newFolderNameInput').value = '';
    selectSavePrivacy('private');
    document.getElementById('createFolderPopup').classList.add('active');
    setTimeout(() => document.getElementById('newFolderNameInput').focus(), 80);
}

function closeCreateFolderPopup(e) {
    if (!e || e.target === document.getElementById('createFolderPopup'))
        document.getElementById('createFolderPopup').classList.remove('active');
}

function selectSavePrivacy(p) {
    savePrivacy = p;
    document.getElementById('privOptPrivate').className = `privacy-opt${p === 'private' ? ' selected' : ''}`;
    document.getElementById('privOptPublic').className  = `privacy-opt${p === 'public'  ? ' selected' : ''}`;
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
    folders.push({ id: safeName, name, privacy: savePrivacy, recipes: [], coverImage: null, createdAt: new Date().toISOString() });
    saveFoldersLocal(folders);
    const uid = localStorage.getItem('userUID');
    if (uid && window.fbCreateFolder) {
        try { await window.fbCreateFolder(uid, name, savePrivacy); console.log('✅ Folder created:', name); }
        catch (err) { console.error('❌ Folder create failed:', err); }
    }
    document.getElementById('createFolderPopup').classList.remove('active');
    renderSaveFolders(document.getElementById('folderSearchInput').value.toLowerCase());
}

window.openSavePopup          = openSavePopup;
window.closeSavePopup         = closeSavePopup;
window.filterFolders          = filterFolders;
window.openSaveCreateFolder   = openSaveCreateFolder;
window.closeCreateFolderPopup = closeCreateFolderPopup;
window.selectSavePrivacy      = selectSavePrivacy;
window.confirmCreateFolder    = confirmCreateFolder;

// ─── VOICE SEARCH ─────────────────────────────────────────────────────────────
function initVoiceSearch(micEl, inputEl, onResult) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !micEl) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let listening = false;

    micEl.style.cursor = 'pointer';
    micEl.title = 'Search by voice';

    micEl.addEventListener('click', () => {
        if (listening) { recognition.stop(); return; }
        recognition.start();
    });

    recognition.addEventListener('start', () => {
        listening = true;
        micEl.style.opacity = '0.5';
        micEl.style.transform = 'scale(1.2)';
        if (inputEl) inputEl.placeholder = 'Listening…';
    });

    recognition.addEventListener('result', (e) => {
        const transcript = e.results[0][0].transcript;
        if (inputEl) inputEl.value = transcript;
        if (onResult) onResult(transcript);
    });

    recognition.addEventListener('end', () => {
        listening = false;
        micEl.style.opacity = '1';
        micEl.style.transform = 'scale(1)';
        if (inputEl) inputEl.placeholder = 'Search restaurants or dishes';
    });

    recognition.addEventListener('error', () => {
        listening = false;
        micEl.style.opacity = '1';
        micEl.style.transform = 'scale(1)';
        if (inputEl) inputEl.placeholder = 'Search restaurants or dishes';
    });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    loadAvatar();
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
                allMealsLoaded ? restoreAllRecipes(grid) : loadAllRecipes();
                return;
            }
            isSearchActive = true;
            searchDebounceTimer = setTimeout(() => searchRecipes(query), 350);
        });

        // ── Pre-populate search from ?q= param (redirected from recipe.html) ──
        const urlQuery = new URLSearchParams(window.location.search).get('q');
        if (urlQuery) {
            searchInput.value = urlQuery;
            isSearchActive = true;
            searchRecipes(urlQuery);
        }
    }

    // ── Wire up mic icon for voice search ──
    const micIcon = document.querySelector('.mic-icon');
    initVoiceSearch(micIcon, searchInput, (transcript) => {
        isSearchActive = true;
        searchRecipes(transcript);
    });

    const nfi = document.getElementById('newFolderNameInput');
    if (nfi) nfi.addEventListener('keydown', e => { if (e.key === 'Enter') confirmCreateFolder(); });

    const popup = document.getElementById('logoutPopup');
    if (popup) popup.addEventListener('click', e => { if (e.target === popup) closeLogoutPopup(); });
});