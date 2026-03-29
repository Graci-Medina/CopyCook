const express = require('express');
const router = express.Router();

// authMiddleware lives at the project root, two levels up from src/routes/
const authMiddleware = require('../../authMiddleware');

// recipeController lives at src/controllers/
const recipeController = require('../controllers/recipeController');

// deleteFolderController for folder deletion
const deleteFolderController = require('../controllers/deleteFolderController');

// GET /api/recipes/saved — get all saved recipes for the authenticated user
router.get('/saved', authMiddleware, recipeController.getSavedRecipes);

// POST /api/recipes/save — save a recipe for the authenticated user
router.post('/save', authMiddleware, recipeController.saveRecipe);

// DELETE /api/recipes/save/:mealId — unsave a recipe for the authenticated user
router.delete('/save/:mealId', authMiddleware, recipeController.unsaveRecipe);

// DELETE /api/recipes/folder/:folderName — delete a folder and its contents for the authenticated user
router.delete('/folder/:folderName', authMiddleware, deleteFolderController.deleteFolder);

module.exports = router;