const express = require('express');
const router = express.Router();

// authMiddleware lives at the project root, two levels up from src/routes/
const authMiddleware = require('../../authMiddleware');

// recipeController lives at src/controllers/
const recipeController = require('../controllers/recipeController');

// GET /api/recipes/saved — get all saved recipes for the authenticated user
router.get('/saved', authMiddleware, recipeController.getSavedRecipes);

// POST /api/recipes/save — save a recipe for the authenticated user
router.post('/save', authMiddleware, recipeController.saveRecipe);

// DELETE /api/recipes/save/:mealId — unsave a recipe for the authenticated user
router.delete('/save/:mealId', authMiddleware, recipeController.unsaveRecipe);

module.exports = router;