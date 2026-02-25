document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.getElementById("recipe-title").textContent = "No recipe selected";
        document.getElementById("recipe-instructions").textContent =
            "Go back and click a recipe card (missing ?id= in the URL).";
        return;
    }

    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals && data.meals[0] ? data.meals[0] : null;

    if (!meal) {
        document.getElementById("recipe-title").textContent = "Recipe not found";
        document.getElementById("recipe-instructions").textContent =
            "The API did not return a recipe for this ID.";
        return;
    }

    document.getElementById("recipe-title").textContent = meal.strMeal || "Recipe";

    const img = document.getElementById("recipe-image");
    img.src = meal.strMealThumb || "";
    img.alt = meal.strMeal || "Recipe image";

    document.getElementById("recipe-instructions").textContent =
        meal.strInstructions || "";

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ing = meal["strIngredient" + i];
        const meas = meal["strMeasure" + i];
        if (ing && ing.trim()) {
            ingredients.push(`${(meas || "").trim()} ${(ing || "").trim()}`.trim());
        }
    }

    const steps = (meal.strInstructions || "")
        .split(/\r?\n+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(text => ({ "@type": "HowToStep", "text": text }));

    const schema = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": meal.strMeal,
        "image": meal.strMealThumb ? [meal.strMealThumb] : [],
        "description": (meal.strInstructions || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160),
        "recipeCategory": meal.strCategory || undefined,
        "recipeCuisine": meal.strArea || undefined,
        "keywords": meal.strTags || undefined,
        "recipeIngredient": ingredients,
        "recipeInstructions": steps.length
            ? steps
            : [{ "@type": "HowToStep", "text": meal.strInstructions || "" }],
        "url": window.location.href
    };

    const cleanSchema = JSON.parse(JSON.stringify(schema));

    document.getElementById("recipe-schema").textContent =
        JSON.stringify(cleanSchema, null, 2);
});