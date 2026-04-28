/**
 * Shows a pink dot on .messages-unread-dot when the signed-in user has
 * unread messages (sum of conversations.unreadCount[uid]). Hides when zero.
 */
import { auth, db } from './firebase-config.js';
import { pruneConversationsWithDeletedParticipants } from './firebase-functions.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    getDocs,
    doc,
    getDoc,
    collectionGroup,
    limit
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let convsUnsub = null;
let currentUid = null;
let notifOpen = false;

function setNavUnreadVisible(visible) {
    document.querySelectorAll('.messages-unread-dot').forEach((el) => {
        el.classList.toggle('is-visible', visible);
        el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
    document.querySelectorAll('.notifications-unread-dot').forEach((el) => {
        el.classList.toggle('is-visible', visible);
        el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
}

function sumUnread(conversations, uid) {
    let t = 0;
    for (const c of conversations) {
        t += c.unreadCount?.[uid] || 0;
    }
    return t;
}

function attachUnreadListener(uid) {
    if (convsUnsub) {
        convsUnsub();
        convsUnsub = null;
    }

    const qPrimary = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc')
    );

    function applySnapshot(snapshot) {
        const convs = snapshot.docs.map((d) => d.data());
        setNavUnreadVisible(sumUnread(convs, uid) > 0);
    }

    convsUnsub = onSnapshot(
        qPrimary,
        applySnapshot,
        () => {
            if (convsUnsub) {
                convsUnsub();
                convsUnsub = null;
            }
            const qFb = query(
                collection(db, 'conversations'),
                where('participants', 'array-contains', uid)
            );
            convsUnsub = onSnapshot(qFb, applySnapshot);
        }
    );
}

function ensureNotificationsUi() {
    const btn = document.getElementById('navNotificationsBtn');
    if (btn && !btn.dataset.notificationsBound) {
        btn.dataset.notificationsBound = '1';
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await toggleNotifications();
        });
    }

    if (!document.getElementById('notificationsOverlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'notifications-drawer-overlay';
        overlay.id = 'notificationsOverlay';
        overlay.addEventListener('click', closeNotifications);
        document.body.appendChild(overlay);
    }

    if (!document.getElementById('notificationsDrawer')) {
        const drawer = document.createElement('aside');
        drawer.className = 'notifications-drawer';
        drawer.id = 'notificationsDrawer';
        drawer.innerHTML =
            '<div class="notifications-header">' +
            '<div class="notifications-title">Notifications</div>' +
            '<button class="notifications-close" type="button" aria-label="Close notifications">&times;</button>' +
            '</div>' +
            '<div class="notifications-list" id="notificationsList">' +
            '<div class="notifications-empty">Open notifications after signing in.</div>' +
            '</div>';
        drawer.querySelector('.notifications-close')?.addEventListener('click', closeNotifications);
        document.body.appendChild(drawer);
    }
}

function openNotifications() {
    notifOpen = true;
    document.getElementById('notificationsOverlay')?.classList.add('open');
    document.getElementById('notificationsDrawer')?.classList.add('open');
    document.getElementById('navNotificationsBtn')?.classList.add('active');
}

function closeNotifications() {
    notifOpen = false;
    document.getElementById('notificationsOverlay')?.classList.remove('open');
    document.getElementById('notificationsDrawer')?.classList.remove('open');
    document.getElementById('navNotificationsBtn')?.classList.remove('active');
}

function formatRelativeTime(ms) {
    if (!ms) return 'just now';
    const d = Date.now() - ms;
    if (d < 60 * 1000) return 'just now';
    if (d < 60 * 60 * 1000) return `${Math.floor(d / (60 * 1000))}m ago`;
    if (d < 24 * 60 * 60 * 1000) return `${Math.floor(d / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(d / (24 * 60 * 60 * 1000))}d ago`;
}

function tsToMs(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value === 'string') {
        const t = Date.parse(value);
        return Number.isNaN(t) ? 0 : t;
    }
    return 0;
}

function chunk(arr, n) {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
}

function mealIdFromRefPath(path) {
    const parts = String(path || '').split('/');
    const idx = parts.indexOf('recipes');
    return idx >= 0 ? parts[idx + 1] : '';
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadUserNames(uids) {
    const m = new Map();
    const unique = [...new Set((uids || []).filter(Boolean))];
    await Promise.all(unique.map(async (uid) => {
        try {
            const snap = await getDoc(doc(db, 'users', uid));
            m.set(uid, snap.exists() ? (snap.data().displayName || 'Someone') : 'Someone');
        } catch (_) {
            m.set(uid, 'Someone');
        }
    }));
    return m;
}

async function fetchSocialNotifications(followingUids, nameMap) {
    if (!followingUids.length) return [];
    const out = [];
    const chunks = chunk(followingUids.slice(0, 30), 10);

    for (const ids of chunks) {
        const [commentSnap, ratingSnap, madeSnap] = await Promise.all([
            getDocs(query(collectionGroup(db, 'comments'), where('uid', 'in', ids), orderBy('createdAt', 'desc'), limit(20))).catch(() => null),
            getDocs(query(collectionGroup(db, 'ratings'), where('uid', 'in', ids), orderBy('createdAt', 'desc'), limit(20))).catch(() => null),
            getDocs(query(collectionGroup(db, 'mades'), where('uid', 'in', ids), orderBy('createdAt', 'desc'), limit(20))).catch(() => null),
        ]);

        (commentSnap?.docs || []).forEach((d) => {
            const mealId = mealIdFromRefPath(d.ref.path);
            const uid = d.data().uid;
            out.push({
                timeMs: tsToMs(d.data().createdAt),
                href: mealId ? `../Home page/recipe.html?id=${encodeURIComponent(mealId)}` : '#',
                title: `${nameMap.get(uid) || 'Someone'} commented on a recipe`,
                meta: formatRelativeTime(tsToMs(d.data().createdAt)),
            });
        });
        (ratingSnap?.docs || []).forEach((d) => {
            const mealId = mealIdFromRefPath(d.ref.path);
            const uid = d.data().uid;
            const stars = Number(d.data().stars || 0);
            out.push({
                timeMs: tsToMs(d.data().createdAt),
                href: mealId ? `../Home page/recipe.html?id=${encodeURIComponent(mealId)}` : '#',
                title: `${nameMap.get(uid) || 'Someone'} rated a recipe${stars ? ` (${stars}/5)` : ''}`,
                meta: formatRelativeTime(tsToMs(d.data().createdAt)),
            });
        });
        (madeSnap?.docs || []).forEach((d) => {
            const mealId = mealIdFromRefPath(d.ref.path);
            const uid = d.data().uid;
            out.push({
                timeMs: tsToMs(d.data().createdAt),
                href: mealId ? `../Home page/recipe.html?id=${encodeURIComponent(mealId)}` : '#',
                title: `${nameMap.get(uid) || 'Someone'} made a recipe`,
                meta: formatRelativeTime(tsToMs(d.data().createdAt)),
            });
        });
    }

    await Promise.all(followingUids.slice(0, 20).map(async (fid) => {
        try {
            const likesSnap = await getDocs(query(
                collection(db, 'users', fid, 'likes'),
                orderBy('likedAt', 'desc'),
                limit(3)
            ));
            likesSnap.docs.forEach((d) => {
                const data = d.data();
                const mealId = data.idMeal || d.id;
                const t = tsToMs(data.likedAt);
                out.push({
                    timeMs: t,
                    href: mealId ? `../Home page/recipe.html?id=${encodeURIComponent(String(mealId))}` : '#',
                    title: `${nameMap.get(fid) || 'Someone'} liked ${data.strMeal || 'a recipe'}`,
                    meta: formatRelativeTime(t),
                });
            });
        } catch (_) {
            // ignore per-user likes failures
        }
    }));

    return out;
}

async function fetchMessageNotifications(uid) {
    const items = [];
    try {
        let snap;
        try {
            snap = await getDocs(query(
                collection(db, 'conversations'),
                where('participants', 'array-contains', uid),
                orderBy('lastMessageAt', 'desc'),
                limit(25)
            ));
        } catch (_) {
            snap = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', uid)));
        }
        snap.docs.forEach((d) => {
            const conv = d.data();
            const unread = conv.unreadCount?.[uid] || 0;
            if (!unread) return;
            const others = (conv.participants || []).filter((id) => id !== uid);
            const other = others[0] || '';
            const otherName = conv.participantNames?.[other] || 'Someone';
            const t = tsToMs(conv.lastMessageAt);
            items.push({
                timeMs: t,
                href: '../Messages page/Messages.html',
                title: `${otherName} sent ${unread} new message${unread === 1 ? '' : 's'}`,
                meta: `${conv.lastMessage || 'Open messages'} · ${formatRelativeTime(t)}`
            });
        });
    } catch (e) {
        console.warn('fetchMessageNotifications:', e);
    }
    return items;
}

async function fetchFollowerNotifications(uid) {
    const items = [];
    try {
        let snap;
        try {
            snap = await getDocs(query(
                collection(db, 'users', uid, 'followers'),
                orderBy('followedAt', 'desc'),
                limit(30)
            ));
        } catch (_) {
            snap = await getDocs(query(
                collection(db, 'users', uid, 'followers')
            ));
        }
        snap.docs.forEach((d) => {
            const row = d.data() || {};
            const followerUid = row.uid || d.id || '';
            if (!followerUid || followerUid === uid) return;
            const t = tsToMs(row.followedAt);
            items.push({
                timeMs: t,
                href: `../Saved page/profile.html?uid=${encodeURIComponent(followerUid)}`,
                title: `${row.displayName || 'Someone'} started following you`,
                meta: formatRelativeTime(t)
            });
        });
        if (items.length) return items;

        // Legacy fallback for pre-followers mirror docs.
        let legacySnap;
        try {
            legacySnap = await getDocs(query(
                collectionGroup(db, 'following'),
                where('targetUid', '==', uid),
                orderBy('followedAt', 'desc'),
                limit(20)
            ));
        } catch (_) {
            legacySnap = await getDocs(query(
                collectionGroup(db, 'following'),
                where('targetUid', '==', uid)
            ));
        }
        legacySnap.docs.forEach((d) => {
            const row = d.data() || {};
            const followerUid = row.uid || '';
            if (!followerUid || followerUid === uid) return;
            const t = tsToMs(row.followedAt);
            items.push({
                timeMs: t,
                href: `../Saved page/profile.html?uid=${encodeURIComponent(followerUid)}`,
                title: `${row.displayName || 'Someone'} started following you`,
                meta: formatRelativeTime(t)
            });
        });
    } catch (e) {
        console.warn('fetchFollowerNotifications:', e);
    }
    return items;
}

async function renderNotifications(uid) {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    if (!uid) {
        list.innerHTML = '<div class="notifications-empty">Sign in to view notifications.</div>';
        return;
    }
    list.innerHTML = '<div class="notifications-empty">Loading updates...</div>';
    try {
        const followingSnap = await getDocs(collection(db, 'users', uid, 'following'));
        const followingUids = [...new Set(followingSnap.docs
            .map((d) => d.data()?.targetUid || d.id)
            .filter(Boolean))];

        const nameMap = await loadUserNames(followingUids);
        const [messageItems, socialItems, followerItems] = await Promise.all([
            fetchMessageNotifications(uid),
            fetchSocialNotifications(followingUids, nameMap),
            fetchFollowerNotifications(uid)
        ]);
        const items = [...messageItems, ...socialItems, ...followerItems]
            .sort((a, b) => b.timeMs - a.timeMs)
            .slice(0, 70);

        if (!items.length) {
            list.innerHTML = '<div class="notifications-empty">No updates yet. You will see new followers, messages, likes, comments, ratings, and Made It activity here.</div>';
            return;
        }
        list.innerHTML = items.map((i) => (
            `<a class="notifications-item" href="${escapeHtml(i.href)}">` +
            `<div class="notifications-item-title">${escapeHtml(i.title)}</div>` +
            `<div class="notifications-item-meta">${escapeHtml(i.meta)}</div>` +
            '</a>'
        )).join('');
    } catch (e) {
        console.warn('renderNotifications:', e);
        list.innerHTML = '<div class="notifications-empty">Could not load notifications right now.</div>';
    }
}

async function toggleNotifications() {
    ensureNotificationsUi();
    if (notifOpen) {
        closeNotifications();
        return;
    }
    openNotifications();
    await renderNotifications(currentUid);
}

onAuthStateChanged(auth, async (user) => {
    ensureNotificationsUi();
    currentUid = user?.uid || null;
    if (!user) {
        if (convsUnsub) {
            convsUnsub();
            convsUnsub = null;
        }
        setNavUnreadVisible(false);
        renderNotifications(null);
        return;
    }
    try {
        await pruneConversationsWithDeletedParticipants(user.uid);
    } catch (e) {
        console.warn('prune orphaned conversations (nav):', e);
    }
    attachUnreadListener(user.uid);
});
