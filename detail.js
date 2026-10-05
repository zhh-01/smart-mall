const detailRoot = document.querySelector("#detail-root");
const detailId = Number(new URLSearchParams(window.location.search).get("id"));
const detailProduct = window.SMART_MALL_PRODUCTS.find(item => item.id === detailId) || window.SMART_MALL_PRODUCTS[0];

document.title = `${detailProduct.name} | 寻羽小市`;
detailRoot.innerHTML = `<a class="back-link" href="products.html">← 返回全部商品</a><div class="detail-content"><div class="detail-visual"><img src="${detailProduct.image}" alt="${detailProduct.name}"></div><section class="detail-copy"><p class="eyebrow">${detailProduct.category} · PRODUCT DETAIL</p><h1>${detailProduct.name}</h1><p class="detail-sub">${detailProduct.sub}</p><strong class="detail-price">¥${detailProduct.price}</strong><p class="detail-description">为日常挑选的一件耐看好物。它不喧哗，却会在每一次使用时，为生活添上一点轻松和秩序。</p><dl class="detail-meta"><div><dt>商品分类</dt><dd>${detailProduct.category}</dd></div><div><dt>累计购买</dt><dd>${detailProduct.purchases} 人已购买</dd></div><div><dt>上架时间</dt><dd>${detailProduct.publishedAt}</dd></div></dl><button class="detail-buy" id="detail-buy">加入购物袋 <span>→</span></button></section></div>`;

document.querySelector("#detail-buy").addEventListener("click", () => {
	const bag = JSON.parse(localStorage.getItem("smartMallBag") || "[]");
	bag.push(detailProduct);
	localStorage.setItem("smartMallBag", JSON.stringify(bag));
	const button = document.querySelector("#detail-buy");
	button.textContent = "已加入购物袋";
	button.classList.add("added");
});