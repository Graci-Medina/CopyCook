import { db } from './firebase-config.js';

import {
    doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection,
    arrayUnion, arrayRemove, addDoc, query, where, orderBy, serverTimestamp, collectionGroup,
    increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────────
// Firestore structure:
//   users/{uid}/folders/{safeName}  →  { name, privacy, savedRecipes, coverImage, createdAt }
//   recipes/{mealId}/comments/{commentId}  →  { uid, displayName, text, createdAt }
//   recipes/{mealId}/ratings/{uid}         →  { uid, stars, createdAt }
//   recipes/{mealId}                       →  { ratingCount, ratingSum }  (aggregate)
//   posts/{postId}  →  { uid, displayName, avatarColor, mealName, ingredients, instructions, postImg, createdAt }
//   conversations/{convId}  →  participants[], messages in subcollection
//   conversations/{convId}/messages/{msgId}
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_MAX = 400;

/** Delete one conversation document and all messages in its subcollection. */
export async function deleteConversationCompletely(convId) {
    if (!convId) return;
    const msgSnap = await getDocs(collection(db, 'conversations', convId, 'messages'));
    let batch = writeBatch(db);
    let n = 0;
    for (const m of msgSnap.docs) {
        batch.delete(m.ref);
        n++;
        if (n >= BATCH_MAX) {
            await batch.commit();
            batch = writeBatch(db);
            n = 0;
        }
    }
    if (n > 0) await batch.commit();
    await deleteDoc(doc(db, 'conversations', convId));
}

/**
 * Removes conversations where any participant no longer has a users/{uid} doc.
 * Fixes orphaned threads when Auth (or user doc) was removed without deleting the conversation
 * (e.g. Cloud Functions not deployed).
 */
export async function pruneConversationsWithDeletedParticipants(myUid) {
    if (!myUid) return;
    let convSnap;
    try {
        convSnap = await getDocs(
            query(collection(db, 'conversations'), where('participants', 'array-contains', myUid))
        );
    } catch (e) {
        console.warn('pruneConversationsWithDeletedParticipants query failed:', e);
        return;
    }
    for (const convDoc of convSnap.docs) {
        const parts = convDoc.data().participants || [];
        let remove = false;
        for (const p of parts) {
            const uSnap = await getDoc(doc(db, 'users', p));
            if (!uSnap.exists()) {
                remove = true;
                break;
            }
        }
        if (remove) {
            try {
                await deleteConversationCompletely(convDoc.id);
            } catch (err) {
                console.warn('Failed to prune conversation', convDoc.id, err);
            }
        }
    }
}

/** Remove every conversation this user is in (and all messages). Call before deleting Auth user. */
export async function deleteConversationsForUser(uid) {
    if (!uid) return;
    let convSnap;
    try {
        convSnap = await getDocs(
            query(collection(db, 'conversations'), where('participants', 'array-contains', uid))
        );
    } catch (e) {
        console.warn('deleteConversationsForUser query failed:', e);
        return;
    }
    for (const convDoc of convSnap.docs) {
        await deleteConversationCompletely(convDoc.id);
    }
}

async function deleteUserSubcollections(uid) {
    const foldersSnap = await getDocs(collection(db, 'users', uid, 'folders'));
    for (const d of foldersSnap.docs) {
        await deleteDoc(d.ref);
    }
    const likesSnap = await getDocs(collection(db, 'users', uid, 'likes'));
    for (const d of likesSnap.docs) {
        await deleteDoc(d.ref);
    }
    const likedRecipesSnap = await getDocs(collection(db, 'users', uid, 'likedRecipes'));
    for (const d of likedRecipesSnap.docs) {
        await deleteDoc(d.ref);
    }
    const followingSnap = await getDocs(collection(db, 'users', uid, 'following'));
    for (const d of followingSnap.docs) {
        await deleteDoc(d.ref);
    }
}

async function deleteUserPosts(uid) {
    const postsSnap = await getDocs(query(collection(db, 'posts'), where('uid', '==', uid)));
    for (const p of postsSnap.docs) {
        await deleteDoc(p.ref);
    }
}

async function deleteUserRecipeInteractions(uid) {
    const [commentsSnap, ratingsSnap] = await Promise.all([
        getDocs(query(collectionGroup(db, 'comments'), where('uid', '==', uid))),
        getDocs(query(collectionGroup(db, 'ratings'), where('uid', '==', uid)))
    ]);

    for (const d of commentsSnap.docs) {
        await deleteDoc(d.ref);
    }
    for (const d of ratingsSnap.docs) {
        await deleteDoc(d.ref);
    }
}

async function deleteFollowerReferencesForUser(uid) {
    const followerRefs = await getDocs(
        query(collectionGroup(db, 'following'), where('targetUid', '==', uid))
    );
    for (const d of followerRefs.docs) {
        try {
            await deleteDoc(d.ref);
        } catch (e) {
            // Legacy docs or restrictive rules on specific paths should not block account deletion.
            console.warn('Could not delete follower reference:', d.ref.path, e);
        }
    }
}

async function runCleanupStep(stepName, fn) {
    try {
        await fn();
    } catch (e) {
        console.warn(`Account cleanup step failed (${stepName}):`, e);
    }
}

export async function pruneMyFollowingWithDeletedUsers(myUid) {
    if (!myUid) return;
    const followingSnap = await getDocs(collection(db, 'users', myUid, 'following'));
    for (const rel of followingSnap.docs) {
        const targetUid = rel.data()?.targetUid || rel.id;
        if (!targetUid) continue;
        const targetUserSnap = await getDoc(doc(db, 'users', targetUid));
        if (!targetUserSnap.exists()) {
            try {
                await deleteDoc(rel.ref);
            } catch (e) {
                console.warn('Could not prune deleted following user:', rel.ref.path, e);
            }
        }
    }
}

/**
 * Full Firestore cleanup for an account (conversations, folders, likes, user doc).
 * Run while the user is still signed in, then call Auth deleteUser().
 */
export async function deleteUserFirestoreData(uid) {
    await runCleanupStep('markDeleted', async () => setDoc(doc(db, 'users', uid), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
    }, { merge: true }));
    await runCleanupStep('conversations', async () => deleteConversationsForUser(uid));
    await runCleanupStep('posts', async () => deleteUserPosts(uid));
    await runCleanupStep('recipeInteractions', async () => deleteUserRecipeInteractions(uid));
    await runCleanupStep('followerReferences', async () => deleteFollowerReferencesForUser(uid));
    await runCleanupStep('userSubcollections', async () => deleteUserSubcollections(uid));
    await deleteDoc(doc(db, 'users', uid));
}

/** Lowercase trimmed email, or null if none (dedupe falls back to per-uid key). */
export function normalizeEmailForDedupe(email) {
    const s = (email || '').trim().toLowerCase();
    return s || null;
}

function userProfileRecencyMs(u) {
    const ts = u.profileUpdatedAt;
    if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
    if (ts && typeof ts.seconds === 'number') return ts.seconds * 1000;
    const iso = u.preferencesUpdatedAt;
    if (iso && typeof iso === 'string') {
        const t = Date.parse(iso);
        if (!Number.isNaN(t)) return t;
    }
    return 0;
}

/** Positive if b should replace a as the canonical row for the same email. */
function compareUserDuplicates(a, b) {
    const mb = userProfileRecencyMs(b);
    const ma = userProfileRecencyMs(a);
    if (mb !== ma) return mb - ma;
    const ob = b.onboardingComplete ? 1 : 0;
    const oa = a.onboardingComplete ? 1 : 0;
    if (ob !== oa) return ob - oa;
    return String(b.uid || '').localeCompare(String(a.uid || ''));
}

/**
 * Collapse multiple users/{uid} docs that share the same email (e.g. re-signup) to one row for search UIs.
 */
export function dedupeUsersByEmail(users) {
    const map = new Map();
    for (const u of users) {
        const emailKey = normalizeEmailForDedupe(u.email);
        const key = emailKey || `__noemail__${u.uid}`;
        const prev = map.get(key);
        if (!prev) {
            map.set(key, u);
            continue;
        }
        if (compareUserDuplicates(prev, u) > 0) {
            map.set(key, u);
        }
    }
    return Array.from(map.values());
}

// ── Users ──────────────────────────────────────────────────────────────────

export function newUser(id, name, mail, bio, color) {
    const userData = {
        uid: id,
        displayName: name,
        email: mail,
        bio: bio || '',
        avatarColor: color
    };
    const userRef = doc(db, 'users/' + id);
    setDoc(userRef, userData);
}

export async function getUser(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return null;
    return {
        uid:          snapshot.id,
        displayName:  snapshot.data().displayName  || '',
        email:        snapshot.data().email        || '',
        bio:          snapshot.data().bio          || '',
        dietaryPrefs: snapshot.data().dietaryPrefs || [],
        avatarColor:  snapshot.data().avatarColor  || ''
    };
}

export function updateUserProfile(id, name, bio, dietaryPrefs) {
    const userRef = doc(db, 'users/' + id);
    return updateDoc(userRef, { displayName: name, bio, dietaryPrefs });
}

/** @deprecated Use deleteUserFirestoreData — this now removes conversations and subcollections too. */
export async function deleteUser(uid) {
    await deleteUserFirestoreData(uid);
}


// ── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(id, folderName, privacy = 'private') {
    const safeName = folderName.replace(/\//g, '_');
    const folderData = {
        name: folderName, privacy, savedRecipes: [], coverImage: null,
        createdAt: new Date().toISOString()
    };
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    await setDoc(folderRef, folderData);
}

export async function deleteFolder(uid, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    await deleteDoc(doc(db, 'users', uid, 'folders', safeName));
}

export async function getFolders(uid) {
    const foldersRef = collection(db, 'users/' + uid + '/folders');
    const snapshot = await getDocs(foldersRef);
    return snapshot.docs.map(docSnap => ({
        id:         docSnap.id,
        name:       docSnap.data().name,
        privacy:    docSnap.data().privacy       || 'private',
        recipes:    docSnap.data().savedRecipes  || [],
        coverImage: docSnap.data().coverImage    || null,
        createdAt:  docSnap.data().createdAt     || ''
    }));
}

export async function saveRecipe(uid, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const ref = doc(db, 'users/' + uid + '/folders/' + safeName);
    const canonical = {
        idMeal:       mealObj.idMeal       || mealObj.id,
        strMeal:      mealObj.strMeal      || mealObj.name,
        strMealThumb: mealObj.strMealThumb || mealObj.thumb,
        savedAt:      mealObj.savedAt      || new Date().toISOString()
    };
    await setDoc(ref, { savedRecipes: arrayUnion(canonical) }, { merge: true });
    const snap = await getDoc(ref);
    if (snap.exists() && !snap.data().coverImage) {
        await updateDoc(ref, { coverImage: canonical.strMealThumb });
    }
}

export async function unsaveRecipe(uid, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const ref = doc(db, 'users/' + uid + '/folders/' + safeName);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const targetId = mealObj.idMeal || mealObj.id;
    const stored   = snap.data().savedRecipes || [];
    const toRemove = stored.find(m => m.idMeal === targetId);
    if (!toRemove) return;
    await updateDoc(ref, { savedRecipes: arrayRemove(toRemove) });
    const remaining = stored.filter(m => m.idMeal !== targetId);
    await updateDoc(ref, { coverImage: remaining.length > 0 ? remaining[0].strMealThumb : null });
}

export async function getSavedRecipes(id) {
    const snap = await getDoc(doc(db, 'users/' + id));
    return snap.exists() ? snap.data() : null;
}


// ── Comments ──────────────────────────────────────────────────────────────────

export async function addComment(mealId, uid, displayName, avatarColor, text) {
    const commentsRef = collection(db, 'recipes', mealId, 'comments');
    await addDoc(commentsRef, {
        uid,
        displayName,
        avatarColor: avatarColor || '#9FB19F',
        text: text.trim(),
        createdAt: serverTimestamp()
    });
}

export async function getComments(mealId) {
    const commentsRef = collection(db, 'recipes', mealId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
        id:          d.id,
        uid:         d.data().uid,
        displayName: d.data().displayName,
        avatarColor: d.data().avatarColor || '#9FB19F',
        text:        d.data().text,
        createdAt:   d.data().createdAt?.toDate?.() || new Date()
    }));
}

export async function deleteComment(mealId, commentId) {
    await deleteDoc(doc(db, 'recipes', mealId, 'comments', commentId));
}


// ── Ratings ───────────────────────────────────────────────────────────────────

export async function submitRating(mealId, uid, stars) {
    const ratingRef = doc(db, 'recipes', mealId, 'ratings', uid);
    const recipeRef = doc(db, 'recipes', mealId);
    const existing  = await getDoc(ratingRef);

    if (existing.exists()) {
        const oldStars = existing.data().stars;
        await setDoc(recipeRef, {
            ratingSum:   increment(stars - oldStars),
            ratingCount: increment(0)
        }, { merge: true });
    } else {
        await setDoc(recipeRef, {
            ratingSum:   increment(stars),
            ratingCount: increment(1)
        }, { merge: true });
    }
    await setDoc(ratingRef, { uid, stars, createdAt: serverTimestamp() });
}

export async function getRatingData(mealId) {
    const recipeSnap = await getDoc(doc(db, 'recipes', mealId));
    const data = recipeSnap.exists() ? recipeSnap.data() : {};
    const count = data.ratingCount || 0;
    const sum   = data.ratingSum   || 0;
    return { average: count > 0 ? sum / count : 0, count };
}

export async function getUserRating(mealId, uid) {
    const snap = await getDoc(doc(db, 'recipes', mealId, 'ratings', uid));
    return snap.exists() ? snap.data().stars : null;
}


// ── Messages ───────────────────────────────────────────────────────────────────

export async function newConversation(uid1, uid2) {
    const uids = [uid1, uid2].sort();
    const conversationRef = doc(db, 'conversations/' + uids[0] + '_' + uids[1]);
    await setDoc(conversationRef, {
        uid1, uid2, messages: [], lastSentAt: new Date().toISOString()
    });
}

export async function sendMessage(sender, recipient, message) {
    const uids = [sender, recipient].sort();
    const conversationRef = doc(db, 'conversations/' + uids[0] + '_' + uids[1]);
    await updateDoc(conversationRef, {
        messages: arrayUnion({ sender, message, sentAt: new Date().toISOString() }),
        lastSentAt: new Date().toISOString()
    });
}

export async function getConversation(uid1, uid2) {
    const uids = [uid1, uid2].sort();
    const snap = await getDoc(doc(db, 'conversations/' + uids[0] + '_' + uids[1]));
    if (!snap.exists()) return { messages: [] };
    return { uid1: snap.data().uid1, uid2: snap.data().uid2, messages: snap.data().messages || [] };
}


// ── Posts ──────────────────────────────────────────────────────────────────
// Firestore: posts/{postId}
//   { uid, displayName, avatarColor, mealName, ingredients, instructions, postImg, createdAt }

export async function newPost(uid, displayName, avatarColor, mealName, ingredients, instructions, postImg) {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
        uid,
        displayName,
        avatarColor: avatarColor || '#9FB19F',
        mealName,
        ingredients,
        instructions,
        postImg: postImg || null,
        createdAt: serverTimestamp()
    });
    return docRef.id;
}

export async function getPosts() {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
        id:           d.id,
        uid:          d.data().uid,
        displayName:  d.data().displayName  || 'Anonymous',
        avatarColor:  d.data().avatarColor  || '#9FB19F',
        mealName:     d.data().mealName,
        ingredients:  d.data().ingredients  || [],
        instructions: d.data().instructions || '',
        postImg:      d.data().postImg      || null,
        createdAt:    d.data().createdAt?.toDate?.() || new Date()
    }));
}

export async function deletePost(postId) {
    await deleteDoc(doc(db, 'posts', postId));
}

// ── Recipe CSV import (admin / tooling) ─────────────────────────────────────
// Column order matches teammate script: idMeal, strMeal, strMealThumb, ingredients,
// ingredient tokens (dash-separated → array), restaurant (first "-" → comma).

/**
 * @param {string[]} recipeData - One CSV row split by comma (same shape as teammate upload).
 */
export async function importRecipeFromCsvRow(recipeData) {
    const idMeal = (recipeData[0] || '').trim();
    if (!idMeal) return;

    const row = [...recipeData];
    const ingredients = (row[4] || '').split('-');
    if (row.length > 5 && row[5] != null && row[5] !== '') {
        row[5] = String(row[5]).replace('-', ',');
    }
    row[4] = ingredients;

    const recipesRef = doc(db, 'recipes', idMeal);
    await setDoc(recipesRef, {
        idMeal,
        strMeal: row[1] || '',
        strMealThumb: row[2] || null,
        ingredients: row[3],
        instructions: row[4],
        restaurant: row[5]
    });
}