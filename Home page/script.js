// AVATAR SETUP — reads from localStorage set during signup
function loadAvatar() {
    const profileAvatar = document.getElementById('profileAvatar');
    if (!profileAvatar) return;

    const initial = localStorage.getItem('userInitial');
    const color = localStorage.getItem('userAvatarColor');
    const name = localStorage.getItem('userDisplayName');

    if (initial && color) {
        profileAvatar.innerHTML = initial;
        profileAvatar.style.backgroundColor = color;
        profileAvatar.style.display = 'flex';
        profileAvatar.style.alignItems = 'center';
        profileAvatar.style.justifyContent = 'center';
        profileAvatar.style.color = 'white';
        profileAvatar.style.fontSize = '20px';
        profileAvatar.style.fontWeight = '700';
        profileAvatar.style.fontFamily = "'Poppins', sans-serif";
        profileAvatar.title = name || '';
    }
}

// LOGOUT POPUP FUNCTIONS

function toggleLogoutPopup(event) {
    event.preventDefault();
    const popup = document.getElementById('logoutPopup');
    popup.classList.toggle('active');
}
function openRecipe(idMeal) {
    window.location.href = `recipe.html?id=${idMeal}`;
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

// LOAD RANDOM RECIPES FROM MEALDB

let isLoading = false;

async function loadRandomRecipes() {
    const grid = document.getElementById("foodGrid");
    if (!grid || isLoading) return;
    isLoading = true;

    const loadingText = document.createElement("p");
    loadingText.innerText = "Loading recipes...";
    grid.appendChild(loadingText);

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

// SINGLE DOMContentLoaded — everything starts here
document.addEventListener("DOMContentLoaded", function () {

    // Load avatar
    loadAvatar();

    // Load recipes
    loadRandomRecipes();

    // Close logout popup when clicking outside
    const popup = document.getElementById('logoutPopup');
    if (popup) {
        popup.addEventListener('click', function (event) {
            if (event.target === popup) closeLogoutPopup();
        });
    }

    // Infinite scroll
    const grid = document.getElementById("foodGrid");
    if (grid) {
        grid.addEventListener("scroll", () => {
            if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 200 && !isLoading) {
                loadRandomRecipes();
            }
        });
    }
});