// This file lives in ./Home page/ so imports need ../ to reach root files
import {
    saveRecipe,
    unsaveRecipe,
    createFolder,
    getFolders,
    getPosts
} from '../firebase-functions.js';

// Expose Firebase functions globally so script.js (plain <script> tag) can call them
window.fbSaveRecipe   = saveRecipe;
window.fbUnsaveRecipe = unsaveRecipe;
window.fbCreateFolder = createFolder;
window.fbGetFolders   = getFolders;

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
            <div class="empty-emoji">⏳</div>
            <p>Loading recipes…</p>
        </div>`;

    try {
        const posts = await getPosts();

        if (!posts.length) {
            feed.innerHTML = `
                <div class="community-empty">
                    <div class="empty-emoji">🍳</div>
                    <p>No community recipes yet.<br>
                    <a href="../post page/post.html" style="color:#D4A5A5;font-weight:600;">Be the first to post!</a></p>
                </div>`;
            return;
        }

        feed.innerHTML = '';
        posts.forEach(post => {
            const initials   = (post.displayName || 'C').charAt(0).toUpperCase();
            const ingPreview = Array.isArray(post.ingredients)
                ? post.ingredients.slice(0, 4).join(', ') + (post.ingredients.length > 4 ? '…' : '')
                : '';

            const card = document.createElement('div');
            card.className = 'community-card';
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = `community-recipe.html?id=${post.id}`;
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
            feed.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to load community posts:', err);
        feed.innerHTML = `
            <div class="community-empty">
                <div class="empty-emoji">😕</div>
                <p>Couldn't load posts right now.</p>
            </div>`;
    }
}