import { db } from './firebase-config.js';

import {
    doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection,
    arrayUnion, arrayRemove, addDoc, query, orderBy, serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────────
// Firestore structure:
//   users/{uid}/folders/{safeName}  →  { name, privacy, savedRecipes, coverImage, createdAt }
//   recipes/{mealId}/comments/{commentId}  →  { uid, displayName, text, createdAt }
//   recipes/{mealId}/ratings/{uid}         →  { uid, stars, createdAt }
//   recipes/{mealId}                       →  { ratingCount, ratingSum }  (aggregate)
//   posts/{postId}  →  { uid, displayName, avatarColor, mealName, ingredients, instructions, postImg, createdAt }
//   conversations/{uid_uid}/messages/{---} →  { sender, message, sentAt }
// ─────────────────────────────────────────────────────────────────────────────


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

export async function deleteUser(uid) {
    await deleteDoc(doc(db, 'users', uid));
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