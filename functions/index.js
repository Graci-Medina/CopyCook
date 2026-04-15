const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * When an Auth user is removed (client delete, Admin SDK, or Firebase console),
 * remove their Firestore data so conversations do not linger for other users
 * and a new account (new UID) does not collide with old conversation IDs.
 */
exports.cleanupUserDataOnAuthDelete = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    const db = admin.firestore();

    const convSnap = await db.collection('conversations').where('participants', 'array-contains', uid).get();

    for (const convDoc of convSnap.docs) {
        const msgsSnap = await convDoc.ref.collection('messages').get();
        let batch = db.batch();
        let n = 0;
        for (const m of msgsSnap.docs) {
            batch.delete(m.ref);
            n++;
            if (n >= 400) {
                await batch.commit();
                batch = db.batch();
                n = 0;
            }
        }
        if (n > 0) await batch.commit();
        await convDoc.ref.delete();
    }

    const userRef = db.doc(`users/${uid}`);
    const foldersSnap = await userRef.collection('folders').get();
    for (const d of foldersSnap.docs) await d.ref.delete();
    const likesSnap = await userRef.collection('likes').get();
    for (const d of likesSnap.docs) await d.ref.delete();
    const likedSnap = await userRef.collection('likedRecipes').get();
    for (const d of likedSnap.docs) await d.ref.delete();

    await userRef.delete();
});
