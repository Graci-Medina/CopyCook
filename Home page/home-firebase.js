// This file lives in ./Home page/ so imports need ../ to reach root files
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    saveRecipe,
    unsaveRecipe,
    createFolder,
    getFolders,
    getPosts,
    pruneMyFollowingWithDeletedUsers,
    getMadeMealIdsForUser
} from '../firebase-functions.js';
import '../account-delete.js';

// Expose Firebase functions globally so script.js (plain <script> tag) can call them
window.fbSaveRecipe   = saveRecipe;
window.fbUnsaveRecipe = unsaveRecipe;
window.fbCreateFolder = createFolder;
window.fbGetFolders   = getFolders;
window.communityPostsCache = [];
window.communityFollowingUidSet = new Set();

function normalizePrefsFromFirestore(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        cuisines: Array.isArray(raw.cuisines) ? raw.cuisines : [],
        diet: Array.isArray(raw.diet) ? raw.diet : [],
        skill: raw.skill || null,
        feed: Array.isArray(raw.feed) ? raw.feed : []
    };
}

// Write userUID to localStorage as soon as auth resolves
// so script.js can read it for all save/folder operations
let ccHomeFirebaseLastUid = undefined;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        ccHomeFirebaseLastUid = user.uid;
        localStorage.setItem('userUID', user.uid);
        console.log('✅ userUID set in localStorage:', user.uid);
        try {
            await pruneMyFollowingWithDeletedUsers(user.uid);
        } catch (e) {
            console.warn('Could not prune following list:', e);
        }
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                const d = snap.data();
                const normalized = d.preferences ? normalizePrefsFromFirestore(d.preferences) : null;
                if (normalized) {
                    localStorage.setItem('cc_prefs', JSON.stringify(normalized));
                    localStorage.setItem('cc_onboarded', 'true');
                } else if (d.onboardingComplete === true) {
                    localStorage.setItem('cc_onboarded', 'true');
                }
            }
        } catch (e) {
            console.warn('Could not load user preferences:', e);
        }
        try {
            window.ccMadeMealIdSet = await getMadeMealIdsForUser(user.uid);
        } catch (e) {
            console.warn('Could not load made recipes:', e);
            window.ccMadeMealIdSet = new Set();
        }
        if (typeof window.applyHomePersonalization === 'function') {
            window.applyHomePersonalization();
        }
    } else {
        localStorage.removeItem('userUID');
        window.ccMadeMealIdSet = new Set();
        // Avoid double-loading the feed on first paint (guest); only refresh after sign-out.
        const wasSignedIn = ccHomeFirebaseLastUid !== undefined;
        ccHomeFirebaseLastUid = undefined;
        if (wasSignedIn && typeof window.applyHomePersonalization === 'function') {
            window.applyHomePersonalization();
        }
    }
});

// ── Tab switching ─────────────────────────────────────────────────────────────
window.switchTab = function(tab) {
    const homeContent      = document.getElementById('tabContentHome');
    const communityContent = document.getElementById('tabContentCommunity');
    const tabHome          = document.getElementById('tabHome');
    const tabCommunity     = document.getElementById('tabCommunity');

    if (tab === 'home') {
        homeContent.style.display      = 'flex';
        communityContent.style.display = 'none';
        tabHome.classList.add('active');
        tabCommunity.classList.remove('active');
    } else {
        homeContent.style.display      = 'none';
        communityContent.style.display = 'flex';
        tabCommunity.classList.add('active');
        tabHome.classList.remove('active');
        // Load posts the first time the tab is opened
        if (!window._communityLoaded) {
            loadCommunityPosts();
            window._communityLoaded = true;
        }
    }
};

// ── Load community posts ──────────────────────────────────────────────────────
async function loadCommunityPosts() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;

    feed.innerHTML = `
        <div class="community-empty">
            <div class="empty-emoji"></div>
            <p>Loading recipes…</p>
        </div>`;

    try {
        const myUid = localStorage.getItem('userUID');
        if (myUid) {
            const followingSnap = await getDocs(collection(db, 'users', myUid, 'following'));
            window.communityFollowingUidSet = new Set(followingSnap.docs.map((d) => d.id));
        } else {
            window.communityFollowingUidSet = new Set();
        }

        const posts = (await getPosts()).filter((post) => {
            const mealName = (post?.mealName || '').trim().toLowerCase();
            return mealName !== 'awesome pancakes';
        });
        window.communityPostsCache = posts;

        renderCommunityPosts(posts);
    } catch (err) {
        console.error('Failed to load community posts:', err);
        feed.innerHTML = `
            <div class="community-empty">
                <div class="empty-emoji">😕</div>
                <p>Couldn't load posts right now.</p>
            </div>`;
    }
}

function renderCommunityPosts(posts) {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    const followingSet = window.communityFollowingUidSet instanceof Set
        ? window.communityFollowingUidSet
        : new Set();

    if (!posts.length) {
        feed.innerHTML = `
            <div class="community-empty">
                <div class="empty-emoji">🍳</div>
                <p>No community recipes found.</p>
            </div>`;
        return;
    }

    feed.innerHTML = '';
    const followingPosts = posts.filter((p) => p.uid && followingSet.has(p.uid));
    const otherPosts = posts.filter((p) => !(p.uid && followingSet.has(p.uid)));

    const renderSection = (title, sectionPosts, emptyText) => {
        const section = document.createElement('section');
        section.className = 'community-section';
        section.innerHTML = `<h3 class="community-section-title">${title}</h3>`;

        if (!sectionPosts.length) {
            const empty = document.createElement('div');
            empty.className = 'community-empty community-empty-inline';
            empty.innerHTML = `<p>${emptyText}</p>`;
            section.appendChild(empty);
            feed.appendChild(section);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'community-section-grid';
        sectionPosts.forEach((post) => grid.appendChild(createCommunityCard(post)));
        section.appendChild(grid);
        feed.appendChild(section);
    };

    renderSection('From people you follow', followingPosts, 'Follow more cooks to personalize this section.');
    renderSection('All community posts', otherPosts, 'No other community posts found.');
}

function createCommunityCard(post) {
    const initials   = (post.displayName || 'C').charAt(0).toUpperCase();
    const ingPreview = Array.isArray(post.ingredients)
        ? post.ingredients.slice(0, 4).join(', ') + (post.ingredients.length > 4 ? '…' : '')
        : '';
    const saveThumb  = post.postImg || 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg';

    const card = document.createElement('div');
    card.className = 'community-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        window.location.href = `community-recipe.html?id=${post.id}`;
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'community-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openSavePopup({
            id: `post-${post.id}`,
            name: post.mealName || 'Community Recipe',
            thumb: saveThumb
        });
    });

    card.innerHTML = `
        ${post.postImg
            ? `<img class="community-card-img" src="${post.postImg}" alt="${post.mealName}">`
            : `<div class="community-card-img-placeholder">🍽️</div>`
        }
        <div class="community-card-body">
            <div class="community-card-title">${post.mealName}</div>
            <div class="community-card-author">
                <div class="community-avatar" style="background:${post.avatarColor || '#9FB19F'}">${initials}</div>
                <span>${post.displayName || 'Anonymous'}</span>
            </div>
            ${ingPreview ? `<div class="community-card-ingredients">${ingPreview}</div>` : ''}
        </div>
    `;
    card.appendChild(saveBtn);
    return card;
}

window.searchCommunityPosts = function(query) {
    const q = (query || '').trim().toLowerCase();
    if (!Array.isArray(window.communityPostsCache)) window.communityPostsCache = [];
    if (!q) {
        renderCommunityPosts(window.communityPostsCache);
        return;
    }
    const filtered = window.communityPostsCache.filter((post) => {
        const mealName = (post.mealName || '').toLowerCase();
        const displayName = (post.displayName || '').toLowerCase();
        const ingredients = Array.isArray(post.ingredients) ? post.ingredients.join(' ').toLowerCase() : '';
        return mealName.includes(q) || displayName.includes(q) || ingredients.includes(q);
    });
    renderCommunityPosts(filtered);
};