// ============================================================
//  recipes-data.js  —  CopyCook Manual Copycat Recipe Library
// ============================================================
//
//  HOW TO ADD A RECIPE:
//  1. Find the restaurantId that matches the restaurant's entry
//     in CHAIN_RESTAURANTS (e.g. "kfc", "olive-garden")
//  2. Copy the recipe block below and fill in every field
//  3. Always fill in source.name, source.author, source.url
//     so we properly credit the original creator
//  4. Use a free image URL (Unsplash, your Firebase Storage, etc.)
//     for the "image" field
// ============================================================

const COPYCAT_RECIPES = [

    // ── KFC ──────────────────────────────────────────────────
    {
        id: "kfc-sweet-corn",
        restaurantId: "kfc",
        name: "KFC Sweet Corn",
        image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400",
        prepTime: 5,
        cookTime: 10,
        servings: 4,
        calories: 126,
        difficulty: "Easy",
        tags: ["Side Dish", "Vegetarian"],
        ingredients: [
            { amount: "1 lb",   item: "frozen sweet corn" },
            { amount: "½ cup",  item: "water" },
            { amount: "1 tsp",  item: "salt" },
            { amount: "2 tbsp", item: "butter" }
        ],
        instructions: [
            "Combine all ingredients in a small saucepan.",
            "Place the saucepan over medium-low heat.",
            "Cook, stirring occasionally, until the corn is warmed through (about 8–10 minutes).",
            "Taste and adjust salt before serving."
        ],
        source: {
            name: "CopyKat Recipes",
            author: "Stephanie Manley",
            url: "https://copykat.com/kfc-sweet-corn"
        }
    },

    // ── ADD MORE KFC RECIPES HERE ─────────────────────────────
    // {
    //     id: "kfc-coleslaw",
    //     restaurantId: "kfc",
    //     name: "KFC Coleslaw",
    //     image: "https://...",
    //     ...
    // },

    // ── OLIVE GARDEN ──────────────────────────────────────────
    // {
    //     id: "olive-garden-breadsticks",
    //     restaurantId: "olive-garden",
    //     name: "Olive Garden Breadsticks",
    //     image: "https://...",
    //     prepTime: 20,
    //     cookTime: 15,
    //     servings: 8,
    //     calories: 140,
    //     difficulty: "Medium",
    //     tags: ["Bread", "Italian"],
    //     ingredients: [
    //         { amount: "1 packet", item: "active dry yeast" },
    //         ...
    //     ],
    //     instructions: [
    //         "...",
    //     ],
    //     source: {
    //         name: "CopyKat Recipes",
    //         author: "Stephanie Manley",
    //         url: "https://copykat.com/olive-garden-breadsticks"
    //     }
    // },

    // ── CHEESECAKE FACTORY ────────────────────────────────────
    // { id: "ccf-brown-bread", restaurantId: "cheesecake-factory", ... }

];

// ── Helper: get all recipes for a given restaurantId ──────────
function getRecipesForRestaurant(restaurantId) {
    return COPYCAT_RECIPES.filter(r => r.restaurantId === restaurantId);
}