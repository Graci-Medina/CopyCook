// recipeController.js
// Uses the Firebase Admin SDK (firebaseAdmin.js) to talk to Firestore.
// Meal objects are stored in canonical MealDB shape: { idMeal, strMeal, strMealThumb }

const admin = require('../firebaseAdmin');
const db    = admin.firestore();

// Helper — Firestore ref for a user's folder doc
function folderRef(uid, folderName) {
    const safeName = folderName.replace(/\//g, '_');
    return db.collection('users').doc(uid).collection('folders').doc(safeName);
}

// GET /api/recipes/saved
// Returns all folders (with their saved recipes) for the authenticated user.
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
            recipes:    docSnap.data().savedRecipes || [],   // exposed as `recipes`
            coverImage: docSnap.data().coverImage   || null,
            createdAt:  docSnap.data().createdAt    || ''
        }));

        res.status(200).json(folders);
    } catch (error) {
        console.error('getSavedRecipes error:', error);
        res.status(500).json({ error: 'Failed to fetch saved recipes' });
    }
};

// POST /api/recipes/save
// Body: { folderName: string, meal: { idMeal, strMeal, strMealThumb } }
exports.saveRecipe = async (req, res) => {
    try {
        const { folderName, meal } = req.body;
        if (!folderName || !meal) {
            return res.status(400).json({ error: 'folderName and meal are required' });
        }

        // Accept either shape; normalise to canonical MealDB shape for storage
        const canonical = {
            idMeal:       meal.idMeal       || meal.id,
            strMeal:      meal.strMeal      || meal.name,
            strMealThumb: meal.strMealThumb || meal.thumb
        };

        const ref = folderRef(req.user.uid, folderName);

        // Use set with merge so it works even if the folder doc was only created client-side
        await ref.set(
            { savedRecipes: admin.firestore.FieldValue.arrayUnion(canonical) },
            { merge: true }
        );

        // Set coverImage if not already present
        const snap = await ref.get();
        if (snap.exists() && !snap.data().coverImage) {
            await ref.update({ coverImage: canonical.strMealThumb });
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('saveRecipe error:', error);
        res.status(500).json({ error: 'Failed to save recipe' });
    }
};

// DELETE /api/recipes/save/:mealId?folderName=FolderName
// Removes a recipe from the specified folder.
exports.unsaveRecipe = async (req, res) => {
    try {
        const { folderName } = req.query;
        const { mealId }     = req.params;

        if (!folderName) {
            return res.status(400).json({ error: 'folderName query param is required' });
        }

        const ref  = folderRef(req.user.uid, folderName);
        const snap = await ref.get();

        if (!snap.exists()) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        const current     = snap.data().savedRecipes || [];
        const mealToRemove = current.find(m => m.idMeal === mealId);

        if (!mealToRemove) {
            return res.status(404).json({ error: 'Recipe not found in folder' });
        }

        await ref.update({
            savedRecipes: admin.firestore.FieldValue.arrayRemove(mealToRemove)
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('unsaveRecipe error:', error);
        res.status(500).json({ error: 'Failed to remove recipe' });
    }
};