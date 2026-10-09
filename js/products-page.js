const allProducts = window.SMART_MALL_PRODUCTS.filter(item => item.listed);
const catalogGrid = document.querySelector("#catalog-grid");
const visibleCount = document.querySelector("#visible-count");
const loader = document.querySelector("#catalog-loader");
const catalogEnd = document.querySelector("#catalog-end");
const productCount = document.querySelector("#product-count");
let currentFilter = "全部";
let currentSort = "popular";
let shownCount = 0;
const pageSize = 8;

function catalogMarkup(item) {
  return `<article class="product-card"><a class="product-card-link" href="detail.html?id=${item.id}" aria-label="查看${item.name}详情"><div class="product-image">${item.tag ? `<span class="product-tag">${item.tag}</span>` : ""}<img src="${item.image}" alt="${item.name}" loading="lazy"><span class="detail-hint">查看详情 ↗</span></div><div class="product-info"><div><strong>${item.name}</strong><p>${item.sub}</p></div><span class="product-price">¥${item.price}</span></div></a><button class="add-button" data-id="${item.id}" aria-label="将${item.name}加入购物袋">+</button></article>`;
}

function sortedProducts() {
  return allProducts.filter(item => currentFilter === "全部" || item.category === currentFilter).sort((first, second) => currentSort === "popular" ? second.purchases - first.purchases : new Date(second.publishedAt) - new Date(first.publishedAt));
}

function renderCatalog(reset = false) {
  const items = sortedProducts();
  if (reset) { shownCount = 0; catalogGrid.innerHTML = ""; }
  const nextItems = items.slice(shownCount, shownCount + pageSize);
  catalogGrid.insertAdjacentHTML("beforeend", nextItems.map(catalogMarkup).join(""));
  shownCount += nextItems.length;
  productCount.textContent = allProducts.length;
  visibleCount.textContent = `${shownCount} / ${items.length}`;
  loader.hidden = shownCount >= items.length;
  catalogEnd.hidden = shownCount < items.length;
  bindCatalogButtons();
}

function bindCatalogButtons() {
  catalogGrid.querySelectorAll(".add-button:not([data-bound])").forEach(button => {
    button.dataset.bound = "true";
    button.addEventListener("click", () => addToBag(Number(button.dataset.id)));
  });
}

let bag = [];
function addToBag(id) {
  const item = allProducts.find(product => product.id === id);
  if (!item) return;
  bag.push(item);
  renderBag();
  const toast = document.querySelector("#toast");
  toast.classList.add("show");
  clearTimeout(window.catalogToastTimer);
  window.catalogToastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderBag() {
  document.querySelector("#bag-count").textContent = bag.length;
  document.querySelector("#bag-items").innerHTML = bag.length ? bag.map((item, index) => `<div class="bag-row"><img src="${item.image}" alt="${item.name}"><div><strong>${item.name}</strong><p>${item.category}</p><strong>¥${item.price}</strong></div><button class="remove-item" data-index="${index}" aria-label="移除${item.name}">×</button></div>`).join("") : "<div class=\"empty-bag\">还没有喜欢的东西。<br>去逛逛，也许会遇见它。</div>";
  document.querySelector("#bag-total").textContent = `¥${bag.reduce((sum, item) => sum + item.price, 0)}`;
  document.querySelectorAll(".remove-item").forEach(button => button.addEventListener("click", () => { bag.splice(Number(button.dataset.index), 1); renderBag(); }));
}

function toggleBag(open) {
  document.querySelector("#bag-drawer").classList.toggle("open", open);
  document.querySelector("#drawer-overlay").classList.toggle("visible", open);
}

document.querySelectorAll(".catalog-filter").forEach(button => button.addEventListener("click", () => {
  document.querySelector(".catalog-filter.active").classList.remove("active");
  button.classList.add("active");
  currentFilter = button.dataset.filter;
  renderCatalog(true);
}));
document.querySelector("#sort-select").addEventListener("change", event => { currentSort = event.target.value; renderCatalog(true); });
document.querySelector("#bag-toggle").addEventListener("click", () => toggleBag(true));
document.querySelector("#bag-close").addEventListener("click", () => toggleBag(false));
document.querySelector("#drawer-overlay").addEventListener("click", () => toggleBag(false));
window.addEventListener("scroll", () => { if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 320 && shownCount < sortedProducts().length) renderCatalog(); });
renderCatalog(true);