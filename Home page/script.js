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

// ─── SAVE MODAL (home.html) ───────────────────────────────────────────────────
let currentSaveMeal = null, createPrivacy = 'private', selectedFolderId = null;

function getFolders() { return JSON.parse(localStorage.getItem('ccFolders') || '[]'); }
function saveFoldersLocal(f) { localStorage.setItem('ccFolders', JSON.stringify(f)); }

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

async function openSavePopup(meal) {
    currentSaveMeal = meal;
    selectedFolderId = null;
    const saveBtn = document.getElementById('btnSaveToFolder');
    if (saveBtn) saveBtn.disabled = true;

    const modal = document.getElementById('saveModal');
    if (!modal) return;
    modal.classList.add('active');

    // Reset new-folder input
    const nfi = document.getElementById('newFolderInput');
    if (nfi) nfi.value = '';
    setCreatePrivacy('private');

    // Refresh folders from Firebase if possible
    const uid = localStorage.getItem('userUID');
    if (uid && window.fbGetFolders) {
        try { saveFoldersLocal(await window.fbGetFolders(uid)); }
        catch (err) { console.warn('Could not refresh folders:', err); }
    }
    renderFolderList();
}

function closeSaveModal() {
    const modal = document.getElementById('saveModal');
    if (modal) modal.classList.remove('active');
    selectedFolderId = null;
}

function handleSaveOverlayClick(e) {
    if (e.target === document.getElementById('saveModal')) closeSaveModal();
}

const FOLDER_PLACEHOLDER_IMAGES = [
    'https://www.themealdb.com/images/media/meals/sytuqu1511553755.jpg',
    'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    'https://www.themealdb.com/images/media/meals/58oia61564916529.jpg',
    'https://www.themealdb.com/images/media/meals/wyrqqq1468233628.jpg',
    'https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg',
    'https://www.themealdb.com/images/media/meals/tkxquw1628771028.jpg',
];

function renderFolderList() {
    const list = document.getElementById('folderList');
    if (!list) return;
    const folders = getFolders();
    if (folders.length === 0) {
        list.innerHTML = '<p class="no-folders-msg">No folders yet — create one below!</p>';
        return;
    }
    list.innerHTML = '';
    folders.forEach((folder, idx) => {
        const isSelected   = folder.id === selectedFolderId;
        const alreadySaved = currentSaveMeal && (folder.recipes || []).some(
            r => (r.idMeal || r.id) === currentSaveMeal.id
        );
        const thumb    = folder.coverImage || FOLDER_PLACEHOLDER_IMAGES[idx % FOLDER_PLACEHOLDER_IMAGES.length];
        const count    = (folder.recipes || []).length;
        const subtitle = alreadySaved ? 'Already saved' : `${count} recipe${count !== 1 ? 's' : ''}`;

        const item = document.createElement('div');
        item.className = 'folder-list-item' +
            (isSelected   ? ' selected'      : '') +
            (alreadySaved ? ' already-saved' : '');
        item.dataset.folderId = folder.id;
        item.innerHTML = `
            <img class="folder-item-thumb" src="${thumb}" alt="${folder.name}" loading="lazy">
            <div class="folder-item-info">
                <div class="folder-item-name">${folder.name}</div>
                <div class="folder-item-count">${subtitle}</div>
            </div>
            <div class="folder-item-check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>`;

        if (!alreadySaved) {
            item.addEventListener('click', () => {
                selectedFolderId = folder.id;
                const saveBtn = document.getElementById('btnSaveToFolder');
                if (saveBtn) saveBtn.disabled = false;
                renderFolderList();
            });
        }
        list.appendChild(item);
    });
}
function setCreatePrivacy(p) {
    createPrivacy = p;
    const btnPriv = document.getElementById('cpBtnPrivate');
    const btnPub  = document.getElementById('cpBtnPublic');
    if (btnPriv) btnPriv.classList.toggle('selected', p === 'private');
    if (btnPub)  btnPub.classList.toggle('selected',  p === 'public');
}

async function createAndSelect() {
    const nfi  = document.getElementById('newFolderInput');
    const name = nfi ? nfi.value.trim() : '';
    if (!name) {
        if (nfi) { nfi.style.borderColor = '#D4A5A5'; setTimeout(() => nfi.style.borderColor = '', 1500); }
        return;
    }
    const safeName = name.replace(/\//g, '_');
    const folders  = getFolders();
    if (folders.find(f => f.id === safeName)) {
        // folder already exists — just select it
        selectedFolderId = safeName;
    } else {
        folders.push({ id: safeName, name, privacy: createPrivacy, recipes: [], coverImage: null, createdAt: new Date().toISOString() });
        saveFoldersLocal(folders);
        const uid = localStorage.getItem('userUID');
        if (uid && window.fbCreateFolder) {
            try { await window.fbCreateFolder(uid, name, createPrivacy); }
            catch (err) { console.error('❌ Folder create failed:', err); }
        }
        selectedFolderId = safeName;
    }
    if (nfi) nfi.value = '';
    const saveBtn = document.getElementById('btnSaveToFolder');
    if (saveBtn) saveBtn.disabled = false;
    renderFolderList();
}

async function confirmSave() {
    if (!currentSaveMeal || !selectedFolderId) return;
    const folders = getFolders();
    const folder  = folders.find(f => f.id === selectedFolderId);
    if (!folder) return;

    folder.recipes = folder.recipes || [];
    const alreadySaved = folder.recipes.some(r => r.id === currentSaveMeal.id);
    if (alreadySaved) { showToast('Already saved to this folder!'); closeSaveModal(); return; }

    const mealObj = { id: currentSaveMeal.id, name: currentSaveMeal.name, thumb: currentSaveMeal.thumb };
    folder.recipes.push(mealObj);
    if (!folder.coverImage) folder.coverImage = currentSaveMeal.thumb;
    saveFoldersLocal(folders);

    const uid = localStorage.getItem('userUID');
    if (uid && window.fbSaveRecipe) {
        try { await window.fbSaveRecipe(uid, folder.name, mealObj); }
        catch (err) { console.error('❌ Save failed:', err); }
    }
    showToast(`Saved to "${folder.name}"!`);
    closeSaveModal();
}

window.openSavePopup          = openSavePopup;
window.closeSaveModal         = closeSaveModal;
window.handleSaveOverlayClick = handleSaveOverlayClick;
window.setCreatePrivacy       = setCreatePrivacy;
window.createAndSelect        = createAndSelect;
window.confirmSave            = confirmSave;

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
    }

    // ── Pre-populate search from ?q= param (voice redirect from other pages) ──
    const urlQuery = new URLSearchParams(window.location.search).get('q');
    if (urlQuery && searchInput) {
        searchInput.value = urlQuery;
        isSearchActive = true;
        searchRecipes(urlQuery);
    }

    // ── Wire up mic icon for voice search ──
    const micIcon = document.querySelector('.mic-icon');
    initVoiceSearch(micIcon, searchInput, (transcript) => {
        isSearchActive = true;
        searchRecipes(transcript);
    });

    const popup = document.getElementById('logoutPopup');
    if (popup) popup.addEventListener('click', e => { if (e.target === popup) closeLogoutPopup(); });
});