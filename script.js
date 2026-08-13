// Connexion API
const API_URL = "https://fakestoreapi.com/products";

// Récupère la liste complète des produits depuis l'API.
async function getProducts() {
  const response = await fetch(API_URL);

  // fetch() ne lance pas d'erreur automatiquement sur un code HTTP
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des produits.");
  }
  return await response.json();
}

// Récupère la liste des catégories disponibles.
async function getCategories() {
  const response = await fetch(`${API_URL}/categories`);

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des catégories.");
  }

  return await response.json();
}

// les variable
let tousProduits = [];   
let cart = [];            
let activeCategory = "tousles"; 
let searchQuery = "";        

// AFFICHAGE (DOM)

function afficheLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

function afficheError(message) {
  const errorBox = document.getElementById("error-message");
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

const pFCFA = 575;
function formatPrixFCFA(usdPrice){
    const fcfa = Math.round(usdPrice * pFCFA);
    return fcfa.toLocaleString("fr-FR") + " FCFA ";
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("product-card");

  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p class="price">${formatPrixFCFA(product.price)}</p>
    <button class="add-to-cart" data-id="${product.id}">Ajouter au panier</button>
  `;

  return card;
}

function renderProducts(products) {
  const grid = document.getElementById("produits-grid");
  grid.innerHTML = "";
  products.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

function updateCartCounter() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = totalItems;
}

//le contenu du tiroir panier : une ligne par produit, avec boutons +/- pour la quantité et bouton de suppression.Calcule aussi le total.
function renderCart() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Votre panier est vide.</p>";
  }

  let total = 0;

  cart.forEach(item => {
    const lineTotal = item.product.price * item.quantity;
    total += lineTotal;

    const line = document.createElement("div");
    line.classList.add("cart-item");
    line.innerHTML = `
      <p>${item.product.title}</p>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="decrease" data-id="${item.product.id}">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" data-action="increase" data-id="${item.product.id}">+</button>
        <button class="remove-btn" data-id="${item.product.id}"></button>
      </div>
      <p>${formatPrixFCFA(lineTotal)}</p>
    `;
    container.appendChild(line);
  });

  document.getElementById("cart-total").textContent = formatPrixFCFA(total);
}

// les boutons de filtre à partir de la liste de catégories reçue de l'API.
function renderCategories(categories) {
  const container = document.getElementById("category-list");
  container.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.textContent = "Toutes";
  allButton.classList.add("category-btn", "active"); // active par défaut
  allButton.dataset.category = "all";
  container.appendChild(allButton);

  categories.forEach(category => {
    const button = document.createElement("button");
    button.textContent = category;
    button.classList.add("category-btn");
    button.dataset.category = category;
    container.appendChild(button);
  });
}
// Applique à la fois le filtre de catégorie ET la recherche textesur allProducts, puis met à jour l'affichage
function applyFilters() {
  let result = tousProduits;

  if (activeCategory !== "tousles") {
    result = result.filter(p => p.category === activeCategory);
  }
  if (searchQuery !== "") {
    result = result.filter(p =>
      p.title.toLowerCase().includes(searchQuery)
    );
  }
  renderProducts(result);
}

function handleSearch(event) {
  searchQuery = event.target.value.toLowerCase();
  applyFilters();
}

function handleCategoryClick(event) {
  if (!event.target.classList.contains("category-btn")) return;

  activeCategory = event.target.dataset.category;

  // Mettre à jour visuellement quel bouton est actif
  document.querySelectorAll(".category-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  event.target.classList.add("active");

  applyFilters();
}

function handleGridClick(event) {
  if (!event.target.classList.contains("add-to-cart")) return;

  const id = Number(event.target.dataset.id);
  addToCart(id);
}
// Ajoute un produit au panier.
function addToCart(id) {
  const existingItem = cart.find(item => item.product.id === id);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    const product = tousProduits.find(p => p.id === id);
    cart.push({ product, quantity: 1 });
  }
  updateCartCounter();
  renderCart();
  saveCartToStorage();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.product.id !== id);
  updateCartCounter();
  renderCart();
  saveCartToStorage();
}

function changeQuantity(id, delta) {
  const item = cart.find(item => item.product.id === id);
  if (!item) return;
  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    updateCartCounter();
    renderCart();
    saveCartToStorage();
  }
}
function openCart() {
  document.getElementById("cart-panier").classList.remove("hidden");
}

function closeCart() {
     document.getElementById("cart-panier").classList.add("hidden");
}
// Sauvegarde le panier dans le localStorage.
function saveCartToStorage() {
  localStorage.setItem("devshop-cart", JSON.stringify(cart));
}
// Recharge le panier sauvegardé au démarrage de la page.
function loadCartFromStorage() {
  const saved = localStorage.getItem("devshop-cart");
  cart = saved ? JSON.parse(saved) : [];
}
//  les clics sur +, -, sont tous créés dynamiqueme
function handleCartClick(event) {
  const id = Number(event.target.dataset.id);
  if (!id) return;
  if (event.target.classList.contains("remove-btn")) {
    removeFromCart(id);
  } else if (event.target.dataset.action === "increase") {
    changeQuantity(id, 1);
  } else if (event.target.dataset.action === "decrease") {
    changeQuantity(id, -1);
  }
}

// INITIALISATION
document.addEventListener("DOMContentLoaded", async () => {
  afficheLoader();
  loadCartFromStorage();
  updateCartCounter();
  renderCart();

  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories()
    ]);

    tousProduits = products;
    renderProducts(tousProduits);
    renderCategories(categories);
  } catch (error) {
    afficheError(error.message);
  } finally {
    hideLoader();
  }

  document.getElementById("barre-recherche").addEventListener("input", handleSearch);
  document.getElementById("produits-grid").addEventListener("click", handleGridClick);
  document.getElementById("category-list").addEventListener("click", handleCategoryClick);
  document.getElementById("cart-ouvrir").addEventListener("click", openCart);
  document.getElementById("cart-fermer").addEventListener("click", closeCart);
  document.getElementById("cart-items").addEventListener("click", handleCartClick);
});
