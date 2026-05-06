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


    // ── iHop ────────────────────────────────────
    { //Lemon Ricotta Crepes
            id: "ihop-lemon-ricotta-crepes",
            restaurantId: "ihop",
            name: "iHop Lemon Ricotta Crepes",
            image: "https://i.postimg.cc/FHgpSm0H/image.png",
            prepTime: 15,
            cookTime: 20,
            servings: 8,
            calories: 395,
            difficulty: "Easy",
            tags: ["Breakfast", "Brunch", "Vegetarian", "American"],
            ingredients: [
                { amount: "2 cups",   item: "flour" },
                { amount: "1/2 tsp",  item: "salt" },
                { amount: "3 tsp",  item: "sugar" },
                { amount: "1 3/4 cups", item: "milk" },
                { amount: "4",  item: "large eggs" },
                { amount: "1/2 tsp",  item: "vanilla extract" },
                { amount: "6 tbsp", item: "butter" },
                { amount: "1/4 cup", item: "granulated sugar" },
                { amount: "16 oz",  item: "full-fall ricotta" },
                { amount: "2 tbsp",  item: "lemon juice" },
                { amount: "1/8 tsp", item: "salt" },
                { amount: "1/2 cup", item: "fresh blueberries" },
                { amount: "to taste", item: "lemon wedges" }
            ],
            instructions: [
                "Place the flour, salt, and sugar in a large bowl and mix with a fork.",
                "In another bowl, whisk together the milk and eggs. When the texture is uniform, add the vanilla extract and 4 tablespoons of melted butter. Stir to combine.",
                "Pour half of the milk mixture over the flour and stir to make a paste. Once incorporated, add the rest of the milk and stir to create a very thin batter.",
                "Cover and refrigerate for at least 30 minutes or up to 48 hours.",
                "Heat a 10-inch nonstick skillet over medium heat. Brush the skillet with a thin layer of melted butter.",
                "Pour about 2 ounces of batter (1/4 cup) into the pan. Swirl the pan until the batter has spread evenly into a round shape, using a spatula if necessary.",
                "Cook the crepe until just set, about 30 seconds. Do not let the edges brown.",
                "Flip and cook for another few seconds. Remove the crepe from the pan and repeat with the remaining batter.",
                "To make the filling, pulse the granulated sugar in a blender for about 30 seconds.",
                "Add the ricotta, lemon juice, and salt and pulse a few times to combine.",
                "Place 2 to 3 tablespoon of filling in the center of each crepe.",
                "Roll up the crepes",
                "Place 2 or 3 filled crepes on each plate.",
                "Garnish with fresh blueberries and a lemon wedge."
            ],
            source: {
                name: "CopyKat Recipes",
                author: "Stephanie Manley",
                url: "https://copykat.com/ihop-lemon-ricotta-crepes/"
            }
        },

    { //Chicken Florentine Crepes
                id: "ihop-chicken-florentine-crepes",
                restaurantId: "ihop",
                name: "iHop Chicken Florentine Crepes",
                image: "https://i.postimg.cc/LX6gWFqc/image.png",
                prepTime: 20,
                cookTime: 30,
                servings: 8,
                calories: 464,
                difficulty: "Easy",
                tags: ["Breakfast", "Brunch", "American"],
                ingredients: [
                    { amount: "2 cups",   item: "flour" },
                    { amount: "1/2 tsp",  item: "salt" },
                    { amount: "3 tsp",  item: "sugar" },
                    { amount: "1 3/4 cups", item: "milk" },
                    { amount: "4",  item: "large eggs" },
                    { amount: "1/2 tsp",  item: "vanilla extract" },
                    { amount: "6 tbsp", item: "butter" },
                    { amount: "1/4 cup", item: "shredded Monterey Jack cheese" },
                    { amount: "1/4 cup",  item: "shredded cheddar cheese" },
                    { amount: "2 lbs",  item: "chicken breasts" },
                    { amount: "1 tsp", item: "seasoned salt" },
                    { amount: "1 tbsp", item: "olive oil" },
                    { amount: "1 cup", item: "sliced onion" },
                    { amount: "6 oz", item: "spinach" },
                    { amount: "1 package", item: "Knorr Hollandaise sauce" },
                    { amount: "1/2 cup", item: "chopped fresh tomatoes" }
                ],
                instructions: [
                    "Place the flour, salt, and sugar in a large bowl and mix with a fork.",
                    "In another bowl, whisk together the milk and eggs. When the texture is uniform, add the vanilla extract and 4 tablespoons of melted butter. Stir to combine.",
                    "Pour half of the milk mixture over the flour and stir to make a paste. Once incorporated, add the rest of the milk and stir to create a very thin batter.",
                    "Cover and refrigerate for at least 30 minutes or up to 48 hours.",
                    "Heat a 10-inch nonstick skillet over medium heat. Brush the skillet with a thin layer of melted butter.",
                    "Pour about 2 ounces of batter (1/4 cup) into the pan. Swirl the pan until the batter has spread evenly into a round shape, using a spatula if necessary.",
                    "Cook the crepe until just set, about 30 seconds. Do not let the edges brown.",
                    "Flip and cook for another few seconds. Remove the crepe from the pan and repeat with the remaining batter.",
                    "Keep the crepes warm in a 200°F oven while you prepare the filling.",
                    "Mix the shredded cheeses in a small bowl and set aside.",
                    "Heat a large skillet over medium heat and add the olive oil.",
                    "Season both sides of the chicken breasts with seasoned salt and place them in the skillet. ",
                    "Cook for 6 to 7 minutes per side or until cooked through.",
                    "Remove the chicken breasts from the skillet and cut them into bite-sized pieces.",
                    "Place the onions in the skillet along with a pinch of salt, adding more oil if necessary.",
                    "When the onions have become translucent, return the chicken to the skillet and add the spinach.",
                    "Stir once or twice, and turn off the heat.",
                    "Place 1 tablespoon of shredded cheese and 1/4 cup of the chicken mixture in the center of each crepe.",
                    "Roll up the crepes.",
                    "Place 2 filled crepes on each plate.",
                    "Pour hollandaise sauce over the crepes and sprinkle with about 1 tablespoon of chopped tomatoes."
                ],
                source: {
                    name: "CopyKat Recipes",
                    author: "Stephanie Manley",
                    url: "https://copykat.com/ihop-chicken-florentine-crepes/"
                }
            },

    { //Fresh Berry Crepes
                id: "ihop-fresh-berry-crepes",
                restaurantId: "ihop",
                name: "iHop Fresh Berry Crepes",
                image: "https://i.postimg.cc/mDH3jG0g/image.png",
                prepTime: 10,
                cookTime: 15,
                servings: 3,
                calories: 724,
                difficulty: "Easy",
                tags: ["Breakfast", "Brunch", "Vegetarian", "American"],
                ingredients: [
                    { amount: "2 cups",   item: "flour" },
                    { amount: "1/2 tsp",  item: "salt" },
                    { amount: "3 tsp",  item: "sugar" },
                    { amount: "1 3/4 cups", item: "milk" },
                    { amount: "4",  item: "large eggs" },
                    { amount: "6 tbsp",  item: "melted butter" },
                    { amount: "1/2 tsp",  item: "vanilla extract" },
                    { amount: "2 tbsp", item: "butter (for crepes)" },
                    { amount: "1/2 cup",  item: "fresh strawberries" },
                    { amount: "1/2 cup",  item: "fresh blueberries" },
                    { amount: "optional", item: "powdered sugar" }
                ],
                instructions: [
                    "Place the flour, salt, and sugar in a large bowl and mix with a fork.",
                    "In another bowl, whisk together the milk and eggs. When the texture is uniform, add the vanilla extract and 4 tablespoons of melted butter. Stir to combine.",
                    "Pour half of the milk mixture over the flour and stir to make a paste. Once incorporated, add the rest of the milk and stir to create a very thin batter.",
                    "Cover and refrigerate for at least 30 minutes or up to 48 hours.",
                    "Preheat a 10-inch nonstick skillet over medium heat. Brush the skillet with a thin layer of melted butter.",
                    "Pour about 2 ounces of batter (1/4 cup) into the pan. Swirl the pan until the batter has spread evenly into a round shape, using a spatula if necessary.",
                    "Cook the crepe until just set, about 30 seconds. Do not let the edges brown.",
                    "Flip and cook for another few seconds. Remove the crepe from the pan and repeat with the remaining batter.",
                    "Fold each crepe into quarters.",
                    "Place 4 folded crepes onto a plate and top with strawberries and blueberries.",
                    "Sprinkle with powdered sugar if desired."
                ],
                source: {
                    name: "CopyKat Recipes",
                    author: "Stephanie Manley",
                    url: "https://copykat.com/ihop-fresh-berry-crepes/"
                }
            },

    { //Protein Pancakes
                id: "ihop-protein-pancakes",
                restaurantId: "ihop",
                name: "iHop Protein Pancakes",
                image: "https://i.postimg.cc/FsdM5f3y/image.png",
                prepTime: 10,
                cookTime: 10,
                servings: 1,
                calories: 300,
                difficulty: "Easy",
                tags: ["Breakfast", "Brunch", "Vegetarian", "American"],
                ingredients: [
                    { amount: "1/2 cup",   item: "all-purpose flour" },
                    { amount: "1/4 cup",  item: "rolled oats" },
                    { amount: "4 scoops",  item: "whey protein powder" },
                    { amount: "2 tbsp", item: "brown sugar" },
                    { amount: "1 tbsp",  item: "buttermilk powder" },
                    { amount: "1 tbsp",  item: "cornmeal" },
                    { amount: "1 tsp",  item: "baking powder" },
                    { amount: "1 tsp", item: "kosher salt" },
                    { amount: "1/2 tsp",  item: "chia seeds" },
                    { amount: "1/4 tsp",  item: "flax seeds" },
                    { amount: "1/2 cup",  item: "pancake mix" },
                    { amount: "1/4 cup",  item: "buttermilk" },
                    { amount: "1/2 tsp", item: "maple extract"},
                    { amount: "1",  item: "large egg" },
                    { amount: "to taste",  item: "canola oil" },
                    { amount: "for serving",  item: "butter and syrup" }
                ],
                instructions: [
                    "To make the pancake mix, combine all the ingredients in an airtight container and store in a cool, dry place.",
                    "To make the pancakes, place 1/2 cup of the pancake mix in a bowl. In a separate bowl, whisk together the buttermilk, maple extract, and egg.",
                    "Add the wet ingredients to the pancake mix and stir until combined.",
                    "Heat a skillet or griddle over medium-low heat.",
                    "Brush with canola oil.",
                    "When hot, pour the pancake batter onto the skillet 1/4 cup at a time.",
                    "When the pancakes begin to show tiny bubbles on top, flip them over.",
                    "Continue to cook until golden brown on both sides.",
                    "Serve immediately, topped with butter and syrup."
                ],
                source: {
                    name: "CopyKat Recipes",
                    author: "Stephanie Manley",
                    url: "https://copykat.com/ihop-protein-pancakes/"
                }
            },

    { //Buttermilk Pancakes
                id: "ihop-buttermilk-pancakes",
                restaurantId: "ihop",
                name: "iHop Buttermilk Pancakes",
                image: "https://i.postimg.cc/j2xZqS8Z/image.png",
                prepTime: 10,
                cookTime: 15,
                servings: 4,
                calories: 356,
                difficulty: "Easy",
                tags: ["Breakfast", "Brunch", "Vegetarian", "American"],
                ingredients: [
                    { amount: "1 1/4 cups",   item: "all-purpose flour" },
                    { amount: "1 1/2 tsp",  item: "baking powder" },
                    { amount: "2 1/2 tsp",  item: "sugar" },
                    { amount: "1/2 tsp", item: "salt" },
                    { amount: "1/2 tsp",  item: "baking soda" },
                    { amount: "1 1/2 cups",  item: "buttermilk" },
                    { amount: "2 tbsp",  item: "vegetable oil" },
                    { amount: "1", item: "egg" },
                    { amount: "for serving",  item: "syrup" }
                ],
                instructions: [
                    "Place the flour, baking powder, sugar, salt, and baking soda in a bowl and whisk to combine.",
                    "Add the buttermilk, oil, and egg and use a spoon to mix until smooth. If the batter seems too thick, add a little more buttermilk and mix well.",
                    "Heat a skillet or griddle over medium-low heat and brush with a bit of oil.",
                    "Pour the batter onto the skillet or griddle until it spreads to the desired size.",
                    "When the pancakes begin to show tiny bubbles on top, flip them over and cook until golden brown on both sides.",
                    "Serve warm with your favorite syrup."
                ],
                source: {
                    name: "CopyKat Recipes",
                    author: "Stephanie Manley",
                    url: "https://copykat.com/ihop-buttermilk-pancakes/"
                }
            },

{ //Minion Pancakes
                id: "ihop-minion-pancakes",
                restaurantId: "ihop",
                name: "iHop Minion Pancakes",
                image: "https://i.postimg.cc/8z3V3qyG/image.png",
                prepTime: 15,
                cookTime: 20,
                servings: 4,
                calories: 400,
                difficulty: "Easy",
                tags: ["Breakfast", "Brunch", "Vegetarian", "American"],
                ingredients: [
                    { amount: "1 1/4 cups",   item: "all-purpose flour" },
                    { amount: "1 1/2 tsp",  item: "baking powder" },
                    { amount: "2 1/2 tsp",  item: "sugar" },
                    { amount: "1/2 tsp", item: "salt" },
                    { amount: "1/2 tsp",  item: "baking soda" },
                    { amount: "1 1/2 cups",  item: "buttermilk" },
                    { amount: "2 tbsp",  item: "vegetable oil" },
                    { amount: "1", item: "egg (lightly beaten)" },
                    { amount: "3",  item: "bananas (thinly sliced)" }
                    { amount: "1 4 oz package", item: "banana pudding" },
                    { amount: "1/4 cup", item: "crushed vanilla wafers" },
                    { amount: "1 can", item: "whipped cream" },
                    { amount: "1 tbsp", item: "yellow and blue sprinkles" },
                ],
                instructions: [
                    "About 1 hour before serving, prepare the banana pudding according to the package directions.",
                    "To make the pancake batter, place the flour, baking powder, sugar, salt, and baking soda in a bowl and whisk to combine.",
                    "Add the buttermilk, oil, and egg.",
                    "Use a spoon to mix until smooth. If the batter seems too thick while cooking the pancakes, mix a little more buttermilk into the remaining batter.",
                    "Heat a skillet or griddle over medium-low heat.",
                    "Brush with a little oil or spray with nonstick cooking spray.",
                    "Pour the batter onto the hot griddle until it spreads to the desired size.",
                    "Place 4 or 5 slices of banana onto the pancake quickly after it is poured.",
                    "When small bubbles begin to appear on top of the batter, flip the pancake over and cook until golden on both sides.",
                    "To serve, make a stack of 3 pancakes.",
                    "Add 2 tablespoons of banana pudding on top of the pancakes and sprinkle with crushed vanilla wafers.",
                    "Add 4 or 5 slices of banana and top with whipped cream and blue and yellow sprinkles."
                ],
                source: {
                    name: "CopyKat Recipes",
                    author: "Stephanie Manley",
                    url: "https://copykat.com/ihop-minion-pancakes/"
                }
            },

    // ── CHEESECAKE FACTORY ────────────────────────────────────
    { //Oreo Cheesecake
                    id: "cheesecake-factory-oreo-cheesecake",
                    restaurantId: "cheesecake-factory",
                    name: "Cheesecake Factory Oreo Cheesecake",
                    image: "https://i.postimg.cc/4xjKX2Ls/image.png",
                    prepTime: 25,
                    cookTime: 60,
                    servings: 16,
                    calories: 413,
                    difficulty: "Medium",
                    tags: ["Dessert", "Vegetarian", "American"],
                    ingredients: [
                        { amount: "1 1/2 cups",   item: "Oreo cookie crumbs" },
                        { amount: "2 tbsp + extra",   item: "melted butter" },
                        { amount: "24 oz",   item: "cream cheese (room temperature)" },
                        { amount: "1 cup",  item: "sugar" },
                        { amount: "5",  item: "large eggs" },
                        { amount: "2 tsp", item: "vanilla extract" },
                        { amount: "1/4 tsp",  item: "salt" },
                        { amount: "1/4 cup",  item: "all-purpose flour" },
                        { amount: "8 oz",  item: "sour cream" },
                        { amount: "15", item: "Oreo cookies (coarsely chopped)" }
                    ],
                    instructions: [
                        "To make the crust, thinly coat the inside of a 9-inch springform pan with butter.",
                        "Mix the Oreo crumbs with the melted butter and press the mixture into the bottom and 1 1/2 inches up the sides of the prepared springform pan.",
                        "Preheat the oven to 325°F.",
                        "With the mixer on low, beat the cream cheese until light and fluffy.",
                        "Gradually add the sugar and beat until well combined.",
                        "Add the eggs one at a time and beat until just blended, making sure not to incorporate too much air into the batter.",
                        "Add the vanilla, salt, and flour and beat until just smooth.",
                        "Add the sour cream and beat until just combined. Do not overmix.",
                        "Use a spatula to fold just under half of the chopped Oreos into the batter.",
                        "Pour the batter into the springform pan and top with the remaining chopped Oreos.",
                        "Place the pan on the top rack of the preheated oven and bake for 1 hour, until the center of the cheesecake jiggles slightly when the pan is gently shaken.",
                        "If it is very jiggly, cook for an additional 15 minutes.",
                        "Turn the oven off and prop the door open with a wooden spoon.",
                        "Keep the cheesecake in the oven for another hour before transferring it to the counter to cool completely.",
                        "Cover the pan and refrigerate for 24 hours before serving."
                    ],
                    source: {
                        name: "CopyKat Recipes",
                        author: "Stephanie Manley",
                        url: "https://copykat.com/cheesecake-factory-bakery-oreo-cheesecake/"
                    }
                },

{ //Loaded Baked Potato Tots
                    id: "cheesecake-factory-loaded-baked-potato-tots",
                    restaurantId: "cheesecake-factory",
                    name: "Cheesecake Factory Loaded Baked Potato Tots",
                    image: "https://i.postimg.cc/HkZd4JDT/image.png",
                    prepTime: 25,
                    cookTime: 60,
                    servings: 16,
                    calories: 413,
                    difficulty: "Easy",
                    tags: ["Side Dish", "American"],
                    ingredients: [
                        { amount: "2 cups",   item: "mashed potatoes (lumpy, cold)" },
                        { amount: "1/2 cup",   item: "cream cheese" },
                        { amount: "1/2 cup",   item: "grated cheddar cheese" },
                        { amount: "1/2 cup",  item: "bacon (cooked & chopped into 1/2 inch pieces)" },
                        { amount: "1 bunch",  item: "green onions (thinly sliced)" },
                        { amount: "1", item: "egg (beaten)" },
                        { amount: "1 tbsp",  item: "cornstarch" },
                        { amount: "1 tbsp",  item: "all-purpose flour" },
                        { amount: "1/2 tsp",  item: "coarse salt" },
                        { amount: "1/2 tsp", item: "ground black pepper" },
                        { amount: "2 cups",  item: "all-purpose flour" },
                        { amount: "6",  item: "eggs (beaten with 1 tbsp of cold water)" },
                        { amount: "4 cups",  item: "panko breadcrumbs" },
                        { amount: "for frying",  item: "canola oil" },
                        { amount: "to taste",  item: "coarse salt" },
                        { amount: "1/2 cup",  item: "sour cream" },
                        { amount: "1/2 cup",  item: "sriracha mayo" },
                    ],
                    instructions: [
                        "Place the potatoes, cheeses, bacon, green onion, and egg into a large bowl and mix together with a rubber spatula.",
                        "Sprinkle the cornstarch, flour, salt, and pepper over the mixture, and gently fold to combine.",
                        "Line a baking sheet (that will fit in your freezer) with foil and sprinkle lightly with flour.",
                        "Scoop walnut-sized spoonfuls of the potato mixture onto the prepared baking sheet spaced evenly apart.",
                        "Place into the freezer for approximately 30 minutes to allow them to harden but not freeze completely.",
                        "Remove the baking sheet from the freezer and gently roll the potato mixture into tot shape.",
                        "Place the baking sheet back into freezer to freeze completely.",
                        "To bread the tots, place the flour, egg, and panko breadcrumbs into three separate containers.",
                        "Remove the tots from the freezer and, working in batches, dredge them in the flour, shaking off any excess.",
                        "Then dip them into the egg, draining off any excess.",
                        "Dredge them in the breadcrumbs, coating completely.",
                        "Repeat until all tots are breaded.",
                        "Heat the oil to 350°F.",
                        "Working in batches, fry the tots for 1 1/2 to 2 minutes or until hot throughout.",
                        "Remove the tots from the oil and drain over paper towels.",
                        "Season with salt while still hot.",
                        "Serve with sour cream and sriracha mayo, and enjoy!"
                    ],
                    source: {
                        name: "CopyKat Recipes",
                        author: "Stephanie Manley",
                        url: "https://copykat.com/cheesecake-factory-loaded-baked-potato-tots/"
                    }
                },

{ //Original Cheesecake
                    id: "cheesecake-factory-original-cheesecake",
                    restaurantId: "cheesecake-factory",
                    name: "Cheesecake Factory Original Cheesecake",
                    image: "https://i.postimg.cc/YSWvjcj1/image.png",
                    prepTime: 20,
                    cookTime: 75,
                    servings: 16,
                    calories: 364,
                    difficulty: "Medium",
                    tags: ["Dessert", "Vegetarian", "American"],
                    ingredients: [
                        { amount: "1/4 cup",   item: "finely chopped pecans" },
                        { amount: "1/4 cup",   item: "finely chopped almonds" },
                        { amount: "1/4 cup",   item: "finely chopped walnuts" },
                        { amount: "3/4 cup",  item: "finely chopped vanilla wafers" },
                        { amount: "2 tbsp",  item: "melted butter" },
                        { amount: "1 1/2 lbs", item: "cream cheese" },
                        { amount: "1 1/3 cups",  item: "sugar" },
                        { amount: "5",  item: "eggs" },
                        { amount: "16 oz",  item: "sour cream" },
                        { amount: "1/4 cup", item: "flour" },
                        { amount: "2 tsp",  item: "vanilla" },
                        { amount: "2 tsp",  item: "lemon juice" }
                    ],
                    instructions: [
                        "Blend all the nuts and chopped vanilla wafers into the melted butter and press the mixture into a buttered springform pan.",
                        "Line the mixture about 1 1/2” up the sides of the pan and set aside.",
                        "Keep your mixer on the low setting throughout the mixing process.",
                        "Beat the cream cheese until light and fluffy.",
                        "Add the sugar a little at a time and continue beating until the mixture is creamy.",
                        "Add one egg at a time and beat after each egg.",
                        "When the eggs have been mixed into the cream cheese, add the flour, lemon juice, and vanilla and mix well.",
                        "Lastly, add the sour cream and beat well.",
                        "Pour the cream cheese mixture into the springform pan.",
                        "Place on the top rack in the middle of a 325 degree preheated oven and bake for 1 hour and 15 minutes.",
                        "When the baking is finished. Turn off the oven. Prop open the oven door and let the cheesecake sit in the oven for 1 hour. ",
                        "Remove the cheesecake from the oven and let it cool enough to put into the refrigerator for 24 hours.",
                        "A cheesecake should be allowed to season in order for the flavor to ripen and become enriched. The wait will be worth it!"
                    ],
                    source: {
                        name: "CopyKat Recipes",
                        author: "Stephanie Manley",
                        url: "https://copykat.com/cheesecake-factory-cheesecake/"
                    }
                },

{ //Romano Chicken
                    id: "cheesecake-factory-romano-chicken",
                    restaurantId: "cheesecake-factory",
                    name: "Cheesecake Factory Romano Chicken",
                    image: "https://i.postimg.cc/139xfDtN/image.png",
                    prepTime: 10,
                    cookTime: 20,
                    servings: 2,
                    calories: 422,
                    difficulty: "Easy",
                    tags: ["Dinner", "American"],
                    ingredients: [
                        { amount: "1",   item: "egg" },
                        { amount: "2 tsp",   item: "water" },
                        { amount: "2",   item: "boneless, skinless chicken breasts" },
                        { amount: "1/2 cup",  item: "all-purpose flour" },
                        { amount: "to taste",  item: "salt and pepper" },
                        { amount: "2 tbsp", item: "grated Romano cheese" },
                        { amount: "2 tbsp",  item: "oil (for frying)" }
                    ],
                    instructions: [
                        "Whisk together the egg and water to make an egg wash.",
                        "Pound out chicken breasts to, at most, ½-inch thick.",
                        "Season the flour with salt and pepper.",
                        "Lightly coat the chicken with the seasoned flour.",
                        "Dip the flour-coated chicken in the egg wash.",
                        "Dredge the chicken in grated Romano to coat it with the cheese.",
                        "Place the chicken in a frying pan with oil over medium-high heat.",
                        "Cook the chicken until it is golden brown on both sides and done (internal temperature is 165°F)."
                    ],
                    source: {
                        name: "CopyKat Recipes",
                        author: "Stephanie Manley",
                        url: "https://copykat.com/cheesecake-factory-romano-chicken-not-only-do-they-make-fantastic-cheesecake-you-can-try-their-delicious-romano-chicken-with-our-copy-cat-recipe/"
                    }
                },

];

// ── Helper: get all recipes for a given restaurantId ──────────
function getRecipesForRestaurant(restaurantId) {
    return COPYCAT_RECIPES.filter(r => r.restaurantId === restaurantId);
}