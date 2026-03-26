import { db, auth } from './firebase-config.js';

import {
    updateProfile, updateEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, arrayUnion, arrayRemove
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


// Creates a folder under users/uid/folders/safeName
// Stores privacy and createdAt so data survives logout
export function createFolder(id, folderName, privacy = 'private') {
    const safeName = folderName.replace(/\//g, '_');
    const folderData = {
        name: folderName,
        privacy: privacy,
        savedRecipes: [],
        createdAt: new Date().toISOString()
    };
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    setDoc(folderRef, folderData);
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

//Deletes a specified folder within a users collection
export function deleteFolder(id, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    deleteDoc(folderRef);
}

export function saveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    updateDoc(folderRef, {
        savedRecipes: arrayUnion(mealObj)
    });
}

export function unsaveRecipe(id, folderName, mealObj) {
    const safeName = folderName.replace(/\//g, '_');
    const folderRef = doc(db, 'users/' + id + '/folders/' + safeName);
    updateDoc(folderRef, {
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
