import { db } from './firebase-config.js';

import {
    doc, setDoc, updateDoc, getDoc, getDocs, collection, arrayUnion, arrayRemove, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



// ─────────────────────────────────────────────────────────────────────────────
// Firestore structure:
//   users/{uid}/folders/{safeName}  →  { name, privacy, savedRecipes, coverImage, createdAt }
//
//   recipes/{mealId}/comments/{commentId}  →  { uid, displayName, text, createdAt }
//   recipes/{mealId}/ratings/{uid}         →  { uid, stars, createdAt }
//   recipes/{mealId}                       →  { ratingCount, ratingSum }  (aggregate)
// ─────────────────────────────────────────────────────────────────────────────


// ── Users ──────────────────────────────────────────────────────────────────
// Firestore: users/{uid}
//   { uid, displayName, email, bio, dietaryPrefs, avatarColor }

export function newUser(id, name, mail, bio, color) {
    const userData = {
        uid: id,
        displayName: name,
        email: mail,
        bio: bio,
        avatarColor: color
    };
    const userRef = doc(db, 'users/' + id);
    setDoc(userRef, userData);
}

export async function getUser(uid) {
    const userRef = collection(db, 'users/' + uid);
    const snapshot = await getDoc(userRef);
    return snapshot.docs.map(docSnap => ({
        uid:         docSnap.uid,
        displayName:       docSnap.data().displayName,
        email:    docSnap.data().email        || '',
        bio:    docSnap.data().bio   || '',
        dietaryPrefs: docSnap.data().dietaryPrefs     || [],
        avatarColor:  docSnap.data().avatarColor      || ''
    }));
}

export function updateUserProfile(id, name, bio, dietaryPrefs) {
    const userRef = doc(db, 'users/' + id);
    const userData = {
        displayName: name,
        bio: bio,
        dietaryPrefs: dietaryPrefs
    }
    updateDoc(userRef, userData)
}


// ── Folders ──────────────────────────────────────────────────────────────────
// Firestore: users/{uid}/folders/{safeName}
//   { id, name, privacy, recipes, coverImage, createdAt }

// Gets thumbnail URL from a recipe object
function getRecipeThumbnail(recipe) {
    return recipe?.thumb || recipe?.strMealThumb || null;
}

function getLatestSavedRecipeThumbnail(recipes) {
    const items = Array.isArray(recipes) ? recipes : [];
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const thumb = getRecipeThumbnail(items[index]);
        if (thumb) return thumb;
    }
    return null;
}

export async function createFolder(id, folderName, privacy = 'private') {
    const safeName = folderName.replace(/\//g, '_');
    const folderData = {
        name: folderName, privacy, savedRecipes: [], coverImage: null,
        createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', id, 'folders', safeName), folderData);
}

// Deletes a folder document for a user.
export async function deleteFolder(id, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    await deleteDoc(folderRef);
}

// Reads all folders for a user from Firestore and returns them
// as an array shaped the same way saved.html expects
export async function getFolders(uid) {
    const foldersRef = collection(db, 'users/' + uid + '/folders');
    const snapshot = await getDocs(foldersRef);
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const recipes = data.savedRecipes || [];
        return {
            id:         docSnap.id,
            name:       data.name,
            privacy:    data.privacy || 'private',
            recipes,
            coverImage: getLatestSavedRecipeThumbnail(recipes) || data.coverImage || null,
            createdAt:  data.createdAt || ''
        };
    });
}

export async function saveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    // setDoc with merge so it works even if folder doc doesn't exist yet
    await setDoc(folderRef, {
        savedRecipes: arrayUnion(mealObj)
    }, { merge: true });
    const snap = await getDoc(folderRef);
    if (snap.exists()) {
        const savedRecipes = snap.data().savedRecipes || [];
        await updateDoc(folderRef, { coverImage: getLatestSavedRecipeThumbnail(savedRecipes) });
    }
}

export async function unsaveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    await updateDoc(folderRef, {
        savedRecipes: arrayRemove(mealObj)
    });
    const snap = await getDoc(folderRef);
    if (snap.exists()) {
        const savedRecipes = snap.data().savedRecipes || [];
        await updateDoc(folderRef, { coverImage: getLatestSavedRecipeThumbnail(savedRecipes) });
    }
}

export async function getSavedRecipes(id) {
    const userRef = doc(db, 'users/' + id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    } else {
        return null;
    }
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

// ── Messages ───────────────────────────────────────────────────────────────────
// Firestore: conversations/{uid_uid}/messages/{---}  →  { sender, recipient, message, sentAt }

export async function newConversation(uid1, uid2) {
    let uids = [uid1, uid2];
    uids = uids.sort();
    const conversationRef = doc(db, 'conversations/' + uids[0] + '_' + uids[1]);
    const messageData = {
        uid1: uid1,
        uid2: uid2,
        messages: [],
        lastSentAt: new Date().toISOString()
    };
    setDoc(conversationRef, messageData);
}

export async function sendMessage(sender, recipient, message) {
    let uids = [sender, recipient];
    uids = uids.sort();
    const conversationRef = doc(db, 'conversations/' + uids[0] + '_' + uids[1]);
    const messageData = {
        sender: sender,
        message: message,
        sentAt: new Date().toISOString()
    }
    const conversationData = {
        messages: arrayUnion(messageData),
        lastSentAt: new Date().toISOString()
    };
    updateDoc(conversationRef, conversationData);
}

export async function getConversation(uid1, uid2) {
    let uids = [uid1, uid2];
    uids = uids.sort();
    const snapshot = await getDocs(collection(db, 'conversations', uids[0] + '_' + uids[1]));
    return snapshot.docs.map(docSnap => ({
        uid1:       docSnap.uid1,
        uid2:       docSnap.uid2,
        messages:    docSnap.data().messages  || [],
    }));
}
