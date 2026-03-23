import { db } from './firebase-config.js';

import {
    doc, setDoc, updateDoc, getDoc, getDocs, collection, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Each user document contains a subcollection of folders.
// Each folder document lists all saved recipe objects inside it.
// Ex: users/uid/folders/cheatfood  →  { name, privacy, savedRecipes: [meal, ...] }

export function newUser(id, name, mail, color) {
    const userData = {
        uid: id,
        displayName: name,
        email: mail,
        avatarColor: color
    };
    const userRef = doc(db, 'users/' + id);
    setDoc(userRef, userData);
}

// Creates a folder under users/uid/folders/safeName
// Stores privacy and createdAt so data survives logout
export async function createFolder(id, folderName, privacy = 'private') {
    const safeName = folderName.replace(/\//g, '_');
    const folderData = {
        name: folderName,
        privacy: privacy,
        savedRecipes: [],
        coverImage: null,
        createdAt: new Date().toISOString()
    };
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    await setDoc(folderRef, folderData);
}

// Reads all folders for a user from Firestore and returns them
// as an array shaped the same way saved.html expects
export async function getFolders(uid) {
    const foldersRef = collection(db, 'users/' + uid + '/folders');
    const snapshot = await getDocs(foldersRef);
    return snapshot.docs.map(docSnap => ({
        id:         docSnap.id,
        name:       docSnap.data().name,
        privacy:    docSnap.data().privacy        || 'private',
        recipes:    docSnap.data().savedRecipes   || [],
        coverImage: docSnap.data().coverImage     || null,
        createdAt:  docSnap.data().createdAt      || ''
    }));
}

export async function saveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    // setDoc with merge so it works even if folder doc doesn't exist yet
    await setDoc(folderRef, {
        savedRecipes: arrayUnion(mealObj)
    }, { merge: true });
    // Also update coverImage if not set
    const snap = await getDoc(folderRef);
    if (snap.exists() && !snap.data().coverImage) {
        await updateDoc(folderRef, { coverImage: mealObj.thumb });
    }
}

export async function unsaveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    await updateDoc(folderRef, {
        savedRecipes: arrayRemove(mealObj)
    });
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