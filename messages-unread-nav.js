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
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let convsUnsub = null;

function setNavUnreadVisible(visible) {
    document.querySelectorAll('.messages-unread-dot').forEach((el) => {
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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (convsUnsub) {
            convsUnsub();
            convsUnsub = null;
        }
        setNavUnreadVisible(false);
        return;
    }
    try {
        await pruneConversationsWithDeletedParticipants(user.uid);
    } catch (e) {
        console.warn('prune orphaned conversations (nav):', e);
    }
    attachUnreadListener(user.uid);
});
