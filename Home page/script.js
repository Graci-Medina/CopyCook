// LOGOUT POPUP FUNCTIONS

function toggleLogoutPopup(event) {
    event.preventDefault();
    const popup = document.getElementById('logoutPopup');
    popup.classList.toggle('active');
}

function closeLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    popup.classList.remove('active');
}

function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../login.html';
}

// Close popup when clicking outside
document.addEventListener('DOMContentLoaded', function () {
    const popup = document.getElementById('logoutPopup');
    if (popup) {
        popup.addEventListener('click', function (event) {
            if (event.target === popup) {
                closeLogoutPopup();
            }
        });
    }
});

// LOAD RANDOM RECIPES FROM MEALDB

let isLoading = false;

async function loadRandomRecipes() {
    const grid = document.getElementById("foodGrid");
    if (!grid || isLoading) return;
    isLoading = true;

    // Loading indicator
    const loadingText = document.createElement("p");
    loadingText.innerText = "Loading recipes...";
    grid.appendChild(loadingText);

    // Load 12 random recipes
    for (let i = 0; i < 12; i++) {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
        const data = await response.json();
        const meal = data.meals[0];

        const recipeCard = document.createElement("div");
        recipeCard.classList.add("food-card");
        recipeCard.onclick = () => openRecipe(meal.idMeal);

        recipeCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="food-info">
                <h4>${meal.strMeal}</h4>
            </div>
            <button class="save-btn" onclick="event.stopPropagation()">Save</button>
        `;

        grid.appendChild(recipeCard);
    }

    loadingText.remove();
    isLoading = false;
}


// INITIAL LOAD

document.addEventListener("DOMContentLoaded", function () {
    loadRandomRecipes();
});

// INFINITE SCROLL

document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("foodGrid");
    if (!grid) return;

    grid.addEventListener("scroll", () => {
        if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 200 && !isLoading) {
            loadRandomRecipes();
        }
    });
});