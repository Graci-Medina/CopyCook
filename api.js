// api.js — shared helper for all calls to the CopyCook backend.
// Import this wherever you need to talk to /api/* routes.
//
// Usage:
//   import { apiFetch } from '../api.js';
//   const folders = await apiFetch('/api/recipes/saved');

import { auth } from './firebase-config.js';

const BASE_URL = 'http://localhost:3000';

/**
 * Wraps fetch() with an Authorization: Bearer <token> header.
 * Automatically refreshes the Firebase ID token before each call.
 *
 * @param {string} path   - e.g. '/api/recipes/saved'
 * @param {object} options - standard fetch options (method, body, etc.)
 * @returns {Promise<any>} - parsed JSON response
 */
export async function apiFetch(path, options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated — no current user.');

    // Always get a fresh token (Firebase caches it and only refreshes when needed)
    const token = await user.getIdToken();

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * GET /api/recipes/saved
 * Returns all folders (with their saved recipes) for the logged-in user.
 */
export async function getSavedFolders() {
    return apiFetch('/api/recipes/saved');
}

/**
 * POST /api/recipes/save
 * Saves a recipe into the specified folder.
 *
 * @param {string} folderName - destination folder name
 * @param {object} meal       - meal object from MealDB (must include idMeal, strMeal, strMealThumb)
 */
export async function saveRecipeToFolder(folderName, meal) {
    return apiFetch('/api/recipes/save', {
        method: 'POST',
        body: JSON.stringify({ folderName, meal })
    });
}

/**
 * DELETE /api/recipes/save/:mealId?folderName=...
 * Removes a recipe from the specified folder.
 *
 * @param {string} mealId     - idMeal value from MealDB
 * @param {string} folderName - folder to remove it from
 */
export async function unsaveRecipeFromFolder(mealId, folderName) {
    return apiFetch(`/api/recipes/save/${mealId}?folderName=${encodeURIComponent(folderName)}`, {
        method: 'DELETE'
    });
}