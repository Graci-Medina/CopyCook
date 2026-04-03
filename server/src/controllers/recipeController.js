// firebase-functions.js uses ES Module syntax (import/export) and the client-side
// Firebase SDK, so it can't be required here on the server. Instead, we use the
// Firebase Admin SDK (already initialised in firebaseAdmin.js) to talk to Firestore.

const admin = require('../../firebaseAdmin');
const db = admin.firestore();

function normalizeMeal(meal) {
    if (!meal || typeof meal !== 'object') return null;
    return {
        idMeal: meal.idMeal || meal.id || null,
        strMeal: meal.strMeal || meal.name || null,
        strMealThumb: meal.strMealThumb || meal.thumb || null
    };
}

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
            recipes:    (docSnap.data().savedRecipes || [])
                .map(normalizeMeal)
                .filter(Boolean),
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

        const normalizedMeal = normalizeMeal(meal);
        if (!normalizedMeal?.idMeal || !normalizedMeal?.strMeal) {
            return res.status(400).json({ error: "meal is missing required fields" });
        }

        await folderRef(req.user.uid, folderName).update({
            savedRecipes: admin.firestore.FieldValue.arrayUnion(normalizedMeal)
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
        const { folderName, folderId, mealName } = req.query;
        const { mealId } = req.params;

        if (!folderName && !folderId) {
            return res.status(400).json({ error: "folderName or folderId query param is required" });
        }

        const docId = folderId ? String(folderId) : folderName.replace(/\//g, '_');
        const ref = db.collection('users').doc(req.user.uid).collection('folders').doc(docId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: "Folder not found" });
        }

        const current = snap.data().savedRecipes || [];
        const mealIdStr = String(mealId || '').trim();
        const normalizeText = (value) => String(value || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9 ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const mealNameNorm = normalizeText(mealName);

        const getCandidateIds = (m) => {
            if (!m || typeof m !== 'object') return [];
            const nestedMeal = m.meal && typeof m.meal === 'object' ? m.meal : {};
            const nestedRecipe = m.recipe && typeof m.recipe === 'object' ? m.recipe : {};

            return [
                m.idMeal, m.id, m.mealId, m.recipeId,
                nestedMeal.idMeal, nestedMeal.id, nestedMeal.mealId, nestedMeal.recipeId,
                nestedRecipe.idMeal, nestedRecipe.id, nestedRecipe.mealId, nestedRecipe.recipeId
            ]
                .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
                .map(v => String(v).trim());
        };

        const getCandidateNames = (m) => {
            if (!m || typeof m !== 'object') return [];
            const nestedMeal = m.meal && typeof m.meal === 'object' ? m.meal : {};
            const nestedRecipe = m.recipe && typeof m.recipe === 'object' ? m.recipe : {};

            return [
                m.strMeal, m.name, m.title,
                nestedMeal.strMeal, nestedMeal.name, nestedMeal.title,
                nestedRecipe.strMeal, nestedRecipe.name, nestedRecipe.title
            ]
                .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
                .map(v => normalizeText(v));
        };

        console.log('[unsaveRecipe DEBUG] mealIdStr:', mealIdStr, '| mealNameNorm:', mealNameNorm);
        console.log('[unsaveRecipe DEBUG] current savedRecipes:', JSON.stringify(current, null, 2));

        const updated = current.filter((m) => {
            const ids = getCandidateIds(m);
            const names = getCandidateNames(m);
            console.log('[unsaveRecipe DEBUG] item ids:', ids, '| item names:', names);

            const idMatch = mealIdStr && mealIdStr !== 'unknown' && mealIdStr !== 'undefined' && ids.includes(mealIdStr);
            const nameMatch = mealNameNorm && names.some((name) => name === mealNameNorm);

            return !(idMatch || nameMatch);
        });

        if (updated.length === current.length) {
            return res.status(404).json({
                error: "Recipe not found in folder",
                debug_mealIdStr: mealIdStr,
                debug_mealNameNorm: mealNameNorm,
                debug_storedRecipes: current
            });
        }

        await ref.update({
            savedRecipes: updated
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("unsaveRecipe error:", error);
        res.status(500).json({ error: "Failed to remove recipe" });
    }
};