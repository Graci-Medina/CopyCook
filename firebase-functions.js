import { db } from './firebase-config.js';

import {
    doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection,
    arrayUnion, arrayRemove, addDoc, query, orderBy, serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────────
// Firestore structure:
//   users/{uid}/folders/{safeName}  →  { name, privacy, savedRecipes, coverImage, createdAt }
//
//   recipes/{mealId}/comments/{commentId}  →  { uid, displayName, text, createdAt }
//   recipes/{mealId}/ratings/{uid}         →  { uid, stars, createdAt }
//   recipes/{mealId}                       →  { ratingCount, ratingSum }  (aggregate)
// ─────────────────────────────────────────────────────────────────────────────

export function newUser(id, name, mail, color) {
    const userData = { uid: id, displayName: name, email: mail, avatarColor: color };
    setDoc(doc(db, 'users', id), userData);
}

// ── Folders ──────────────────────────────────────────────────────────────────
export async function createFolder(id, folderName, privacy = 'private') {
    const safeName = folderName.replace(/\//g, '_');
    const folderData = {
        name: folderName, privacy, savedRecipes: [], coverImage: null,
        createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', id, 'folders', safeName), folderData);
}

export async function deleteFolder(uid, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    await deleteDoc(doc(db, 'users', uid, 'folders', safeName));
}

export async function getFolders(uid) {
    const snapshot = await getDocs(collection(db, 'users', uid, 'folders'));
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
    const ref = doc(db, 'users', uid, 'folders', safeName);
    const canonical = {
        idMeal:       mealObj.idMeal       || mealObj.id,
        strMeal:      mealObj.strMeal      || mealObj.name,
        strMealThumb: mealObj.strMealThumb || mealObj.thumb
    };
    await setDoc(ref, { savedRecipes: arrayUnion(canonical) }, { merge: true });
    const snap = await getDoc(ref);
    if (snap.exists() && !snap.data().coverImage) {
        await updateDoc(ref, { coverImage: canonical.strMealThumb });
    }
}

export async function unsaveRecipe(uid, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const ref = doc(db, 'users', uid, 'folders', safeName);
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
    const snap = await getDoc(doc(db, 'users', id));
    return snap.exists() ? snap.data() : null;
}

// ── Comments ──────────────────────────────────────────────────────────────────
// Firestore: recipes/{mealId}/comments/{auto-id}
//   { uid, displayName, avatarColor, text, createdAt (serverTimestamp) }

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
// Firestore: recipes/{mealId}/ratings/{uid}  →  { uid, stars, createdAt }
//            recipes/{mealId}                →  { ratingCount, ratingSum }  (aggregate doc)

export async function submitRating(mealId, uid, stars) {
    const ratingRef  = doc(db, 'recipes', mealId, 'ratings', uid);
    const recipeRef  = doc(db, 'recipes', mealId);
    const existing   = await getDoc(ratingRef);

    if (existing.exists()) {
        const oldStars = existing.data().stars;
        // Update aggregate: subtract old, add new
        await setDoc(recipeRef, {
            ratingSum:   increment(stars - oldStars),
            ratingCount: increment(0)           // count stays the same
        }, { merge: true });
        await setDoc(ratingRef, { uid, stars, createdAt: serverTimestamp() });
    } else {
        await setDoc(recipeRef, {
            ratingSum:   increment(stars),
            ratingCount: increment(1)
        }, { merge: true });
        await setDoc(ratingRef, { uid, stars, createdAt: serverTimestamp() });
    }
}

export async function getRatingData(mealId) {
    // Returns { average, count, userStars (null if not rated) }
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