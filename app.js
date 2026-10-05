const products = window.SMART_MALL_PRODUCTS;
const homeProducts = products.slice(0, 8);
let bag = [];
const grid = document.querySelector("#product-grid");
const bagCount = document.querySelector("#bag-count");
const bagItems = document.querySelector("#bag-items");
const total = document.querySelector("#bag-total");
const toast = document.querySelector("#toast");

function productMarkup(item) {
	return `<article class="product-card"><a class="product-card-link" href="detail.html?id=${item.id}" aria-label="查看${item.name}详情"><div class="product-image">${item.tag ? `<span class="product-tag">${item.tag}</span>` : ""}<img src="${item.image}" alt="${item.name}" loading="lazy"><span class="detail-hint">查看详情 ↗</span></div><div class="product-info"><div><strong>${item.name}</strong><p>${item.sub}</p></div><span class="product-price">¥${item.price}</span></div></a><button class="add-button" data-id="${item.id}" aria-label="将${item.name}加入购物袋">+</button></article>`;
}

function bindAddButtons() {
	grid.querySelectorAll(".add-button").forEach(button => button.addEventListener("click", () => addToBag(Number(button.dataset.id))));
}

function renderProducts(category = "全部") {
	const visibleProducts = homeProducts.filter(item => category === "全部" || item.category === category);
	grid.innerHTML = visibleProducts.map(productMarkup).join("");
	bindAddButtons();
}

function addToBag(id) {
	const item = products.find(product => product.id === id);
	if (!item) return;
	bag.push(item);
	renderBag();
	toast.classList.add("show");
	clearTimeout(window.toastTimer);
	window.toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderBag() {
	bagCount.textContent = bag.length;
	bagItems.innerHTML = bag.length ? bag.map((item, index) => `<div class="bag-row"><img src="${item.image}" alt="${item.name}"><div><strong>${item.name}</strong><p>${item.category}</p><strong>¥${item.price}</strong></div><button class="remove-item" data-index="${index}" aria-label="移除${item.name}">×</button></div>`).join("") : "<div class=\"empty-bag\">还没有喜欢的东西。<br>去逛逛，也许会遇见它。</div>";
	total.textContent = `¥${bag.reduce((sum, item) => sum + item.price, 0)}`;
	bagItems.querySelectorAll(".remove-item").forEach(button => button.addEventListener("click", () => { bag.splice(Number(button.dataset.index), 1); renderBag(); }));
}

function toggleBag(open) {
	document.querySelector("#bag-drawer").classList.toggle("open", open);
	document.querySelector("#drawer-overlay").classList.toggle("visible", open);
}

function filterBySearch(value) {
	const query = value.trim().toLowerCase();
	const results = homeProducts.filter(item => `${item.name}${item.sub}${item.category}`.toLowerCase().includes(query));
	grid.innerHTML = results.length ? results.map(productMarkup).join("") : "<p>暂时没有找到相关好物。</p>";
	bindAddButtons();
}

document.querySelectorAll(".category").forEach(button => button.addEventListener("click", () => {
	document.querySelector(".category.active").classList.remove("active");
	button.classList.add("active");
	renderProducts(button.dataset.category);
	document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
}));
document.querySelector("#bag-toggle").addEventListener("click", () => toggleBag(true));
document.querySelector("#bag-close").addEventListener("click", () => toggleBag(false));
document.querySelector("#drawer-overlay").addEventListener("click", () => toggleBag(false));
document.querySelector("#search-toggle").addEventListener("click", () => {
	const panel = document.querySelector("#search-panel");
	panel.classList.toggle("open");
	if (panel.classList.contains("open")) document.querySelector("#search-input").focus();
});
document.querySelector("#search-close").addEventListener("click", () => document.querySelector("#search-panel").classList.remove("open"));
document.querySelector("#search-input").addEventListener("input", event => filterBySearch(event.target.value));

const carouselTrack = document.querySelector("#carousel-track");
const carouselDots = document.querySelector("#carousel-dots");
const carousel = document.querySelector("#product-carousel");
const carouselProducts = products.slice(0, 5);
let carouselIndex = 0;
let carouselTimer;

function renderCarousel() {
	carouselTrack.innerHTML = carouselProducts.map((item, index) => `<a class="carousel-slide ${index === carouselIndex ? "active" : ""}" href="detail.html?id=${item.id}" aria-label="查看${item.name}详情"><img src="${item.image}" alt="${item.name}"><div class="carousel-copy"><p class="eyebrow">FEATURED ${String(index + 1).padStart(2, "0")}</p><h3>${item.name}</h3><p>${item.sub}</p><strong>¥${item.price}</strong></div></a>`).join("");
	carouselDots.innerHTML = carouselProducts.map((item, index) => `<button class="carousel-dot ${index === carouselIndex ? "active" : ""}" data-index="${index}" aria-label="查看第 ${index + 1} 个商品"></button>`).join("");
	carouselDots.querySelectorAll(".carousel-dot").forEach(dot => dot.addEventListener("click", () => { carouselIndex = Number(dot.dataset.index); renderCarousel(); }));
}

function moveCarousel(step) {
	carouselIndex = (carouselIndex + step + carouselProducts.length) % carouselProducts.length;
	renderCarousel();
}

document.querySelector("#carousel-prev").addEventListener("click", () => moveCarousel(-1));
document.querySelector("#carousel-next").addEventListener("click", () => moveCarousel(1));

function startCarousel() {
	clearInterval(carouselTimer);
	carouselTimer = setInterval(() => moveCarousel(1), 1500);
}

carousel.addEventListener("mouseenter", () => clearInterval(carouselTimer));
carousel.addEventListener("mouseleave", startCarousel);
renderCarousel();
startCarousel();

renderProducts();
