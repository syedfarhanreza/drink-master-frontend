let groupDrinks = [];
const MAX_GROUP_SIZE = 7;

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const drinksContainer = document.getElementById("drinksContainer");
const notFound = document.getElementById("notFound");
const groupList = document.getElementById("groupList");
const drinkCount = document.getElementById("drinkCount");
const drinkModal = new bootstrap.Modal(document.getElementById("drinkModal"));

window.addEventListener("DOMContentLoaded", () => {
  searchDrinks("cocktail");
});

searchBtn.addEventListener("click", () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    searchDrinks(searchTerm);
  }
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      searchDrinks(searchTerm);
    }
  }
});

async function searchDrinks(searchTerm) {
  try {
    drinksContainer.innerHTML =
      '<div class="loading"><i class="fas fa-spinner fa-3x"></i></div>';
    notFound.classList.add("d-none");

    const response = await fetch(
      `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${searchTerm}`
    );
    const data = await response.json();

    if (data.drinks) {
      displayDrinks(data.drinks);
    } else {
      drinksContainer.innerHTML = "";
      notFound.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error fetching drinks:", error);
    drinksContainer.innerHTML =
      '<div class="alert alert-danger">Error loading drinks. Please try again.</div>';
  }
}

function displayDrinks(drinks) {
  drinksContainer.innerHTML = drinks
    .map((drink) => {
      const isInGroup = groupDrinks.some(
        (groupDrink) => groupDrink === drink.strDrink
      );
      const instructions = drink.strInstructions || "No instructions available";
      const truncatedInstructions = instructions.substring(0, 15);

      return `
        <div class="col-md-6 col-lg-4">
            <div class="card drink-card">
                <img src="${drink.strDrinkThumb}" class="card-img-top" alt="${drink.strDrink}">
                <span class="badge bg-primary category-badge">${drink.strCategory || "Uncategorized"}</span>
                <div class="card-body">
                    <h5 class="card-title">${drink.strDrink}</h5>
                    <p class="card-text">${truncatedInstructions}...</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn ${isInGroup ? "btn-secondary" : "btn-primary"}" 
                                onclick="addToGroup(\`${drink.strDrink}\`)"
                                ${isInGroup ? "disabled" : ""}>
                            ${isInGroup ? "Already Added" : "Add to Group"}
                        </button>
                        <button class="btn btn-outline-primary" onclick="showDetails('${drink.idDrink}')">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    })
    .join("");
}

function addToGroup(drinkName) {
  if (groupDrinks.length >= MAX_GROUP_SIZE) {
    showToast("You cannot add more than 7 drinks to the group!", "warning");
    return;
  }

  if (!groupDrinks.includes(drinkName)) {
    groupDrinks.push(drinkName);
    updateGroupDisplay();

    const searchTerm = searchInput.value.trim() || "cocktail";
    searchDrinks(searchTerm);
    showToast(`${drinkName} added to group!`, "success");
  } else {
    showToast(`${drinkName} is already in your group!`, "warning");
  }
}

function updateGroupDisplay() {
  if (groupDrinks.length === 0) {
    groupList.innerHTML = `
            <li class="list-group-item text-center text-muted">
                No drinks selected
            </li>
        `;
  } else {
    groupList.innerHTML = groupDrinks
      .map(
        (drink) => `
            <li class="list-group-item group-item">
                <span>${drink}</span>
                <button class="btn btn-sm btn-danger" onclick="removeFromGroup(\`${drink}\`)">
                    <i class="fas fa-times"></i>
                </button>
            </li>
            `
      )
      .join("");
  }

  drinkCount.textContent = `${groupDrinks.length}/${MAX_GROUP_SIZE}`;
}

function removeFromGroup(drinkName) {
  try {
    groupDrinks = groupDrinks.filter(drink => drink !== drinkName);

    updateGroupDisplay();

    const searchTerm = searchInput.value.trim() || "cocktail";
    searchDrinks(searchTerm);

    showToast(`Drink removed from group!`, "error");
  } catch (error) {
    console.error("Error removing drink:", error);
    showToast("Error removing drink", "error");
  }
}


async function showDetails(drinkId) {
  try {
    const response = await fetch(
      `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
    );
    const data = await response.json();

    if (data.drinks && data.drinks[0]) {
      const drink = data.drinks[0];

      document.getElementById("modalImage").src = drink.strDrinkThumb;
      document.getElementById("modalTitle").textContent = drink.strDrink;

      const details = `
                <dl class="row">
                    <dt class="col-sm-4">Category</dt>
                    <dd class="col-sm-8">${drink.strCategory}</dd>
                    
                    <dt class="col-sm-4">Type</dt>
                    <dd class="col-sm-8">${drink.strAlcoholic}</dd>
                    
                    <dt class="col-sm-4">Glass</dt>
                    <dd class="col-sm-8">${drink.strGlass}</dd>
                    
                    <dt class="col-sm-4">Main Ingredient</dt>
                    <dd class="col-sm-8">${
                      drink.strIngredient1 || "Not specified"
                    }</dd>
                    
                    <dt class="col-sm-4">Instructions</dt>
                    <dd class="col-sm-8">${drink.strInstructions}</dd>
                </dl>
            `;

      document.getElementById("modalDetails").innerHTML = details;

      drinkModal.show();
    }
  } catch (error) {
    console.error("Error fetching drink details:", error);
  }
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const toastBody = toast.querySelector(".toast-body");

  toastBody.textContent = message;

  toast.className = "toast align-items-center border-0";
  switch (type) {
    case "success":
      toast.classList.add("bg-success", "text-white");
      break;
    case "warning":
      toast.classList.add("bg-warning", "text-dark");
      break;
    case "error":
      toast.classList.add("bg-danger", "text-white");
      break;
    default:
      toast.classList.add("bg-primary", "text-white");
  }

  const bsToast = new bootstrap.Toast(toast, {
    animation: true,
    autohide: true,
    delay: 3000,
  });
  bsToast.show();
}
