// firebase-functions.js uses ES Module syntax (import/export) and the client-side
// Firebase SDK, so it can't be required here on the server. Instead, we use the
// Firebase Admin SDK (already initialised in firebaseAdmin.js) to talk to Firestore.

const admin = require('../../firebaseAdmin');
const db = admin.firestore();

// Helper — builds the Firestore path for a user's folder
function folderRef(uid, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    return db.collection('users').doc(uid).collection('folders').doc(safeName);
}

// GET /api/recipes/saved
// Returns all folders (and their saved recipes) for the authenticated user.
exports.getSavedRecipes = async (req, res) => {
    try {
        const snapshot = await db
            .collection('users')
            .doc(req.user.uid)
            .collection('folders')
            .get();

        const folders = snapshot.docs.map(docSnap => ({
            id:         docSnap.id,
            name:       docSnap.data().name,
            privacy:    docSnap.data().privacy      || 'private',
            recipes:    docSnap.data().savedRecipes || [],
            coverImage: docSnap.data().coverImage   || null,
            createdAt:  docSnap.data().createdAt    || ''
        }));

        res.status(200).json(folders);
    } catch (error) {
        console.error("getSavedRecipes error:", error);
        res.status(500).json({ error: "Failed to fetch saved recipes" });
    }
};

// POST /api/recipes/save
// Body: { folderName: string, meal: object }
exports.saveRecipe = async (req, res) => {
    try {
        const { folderName, meal } = req.body;
        if (!folderName || !meal) {
            return res.status(400).json({ error: "folderName and meal are required" });
        }

        await folderRef(req.user.uid, folderName).update({
            savedRecipes: admin.firestore.FieldValue.arrayUnion(meal)
        });

        res.status(201).json({ success: true });
    } catch (error) {
        console.error("saveRecipe error:", error);
        res.status(500).json({ error: "Failed to save recipe" });
    }
};

// DELETE /api/recipes/save/:mealId
// Query param: folderName
// e.g. DELETE /api/recipes/save/abc123?folderName=Favourites
exports.unsaveRecipe = async (req, res) => {
    try {
        const { folderName } = req.query;
        const { mealId } = req.params;

        if (!folderName) {
            return res.status(400).json({ error: "folderName query param is required" });
        }

        // We only have the mealId from the URL, so remove the matching object by idMeal field.
        const ref = folderRef(req.user.uid, folderName);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: "Folder not found" });
        }

        const current = snap.data().savedRecipes || [];
        const mealToRemove = current.find(m => m.idMeal === mealId);

        if (!mealToRemove) {
            return res.status(404).json({ error: "Recipe not found in folder" });
        }

        await ref.update({
            savedRecipes: admin.firestore.FieldValue.arrayRemove(mealToRemove)
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("unsaveRecipe error:", error);
        res.status(500).json({ error: "Failed to remove recipe" });
    }
};