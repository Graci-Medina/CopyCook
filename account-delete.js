/**
 * Registers window.deleteAccount — Firestore cleanup then Firebase Auth removal.
 * Import this module (side effect) from any page that exposes "Delete account".
 */
import { auth } from './firebase-config.js';
import { deleteUser as firebaseAuthDeleteUser } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { deleteUserFirestoreData } from './firebase-functions.js';

window.deleteAccount = async function () {
    if (!confirm(
        'Delete your account permanently? This removes your profile, saved folders, follows, posts, likes, recipe activity, and all conversations. This cannot be undone.'
    )) return;
    const user = auth.currentUser;
    if (!user) {
        alert('You are not signed in.');
        return;
    }
    try {
        await deleteUserFirestoreData(user.uid);
        await firebaseAuthDeleteUser(user);
        localStorage.clear();
        sessionStorage.clear();
        if (typeof window.closeLogoutPopup === 'function') window.closeLogoutPopup();
        window.location.href = new URL('../login.html', window.location.href).toString();
    } catch (e) {
        console.error('deleteAccount:', e);
        const code = e && e.code ? e.code : '';
        const msg = code === 'auth/requires-recent-login'
            ? 'For security, log out, sign in again, then delete your account.'
            : (e.message || 'Could not delete account. Try again.');
        alert(msg);
    }
};
