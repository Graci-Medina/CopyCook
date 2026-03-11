const express = require('express');
const router = express.Router();
const authMiddleware = require('../server/authMiddleware');

// Import the controller
const recipeController = require('../controllers/recipeController');

// Use the controller functions as the second argument

// GET /api/recipes/saved - Get all saved recipes for the authenticated user
router.get('/saved', authMiddleware, recipeController.getSavedRecipes);

// POST /api/recipes/save - Save a recipe for the authenticated user
router.post('/save', authMiddleware, recipeController.saveRecipe);

// DELETE /api/recipes/save/:mealId - Unsave a recipe for the authenticated user  
router.delete('/save/:mealId', authMiddleware, recipeController.unsaveRecipe);

module.exports = router;
