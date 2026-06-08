window.tasaVesUsd = 36.5;

async function cargarCatalogo() {
    const container = document.getElementById('catalogContainer');
    const url = "https://corsproxy.io/?url=" + encodeURIComponent("https://beravirtual.com/wp-json/wc/store/v1/products?per_page=100");

    try {
        const response = await fetch(url);
        const products = await response.json();

        const categorias = {};
        products.forEach(moto => {
            const cat = moto.categories[0]?.name || "Otros";
            if (!categorias[cat]) categorias[cat] = [];
            categorias[cat].push(moto);
        });

        container.innerHTML = Object.keys(categorias).map(cat => `
            <section class="category-section">
                <h2 class="category-title">${cat}</h2>
                <div class="catalog-grid">
                    ${categorias[cat].map(moto => `
                        <div class="product-card">
                            ${moto.images.length > 0
                ? `<img src="${moto.images[0].src}" class="product-image">`
                : `<div class="no-image">Imagen no disponible</div>`}
                            <h3>${moto.name}</h3>
                            <p class="price-tag">$${moto.prices.price}</p>
                            <p class="price-ves">${Math.round(moto.prices.price * window.tasaVesUsd).toLocaleString()} Bs.</p>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('');
    } catch (e) {
        container.innerHTML = "❌ Error al cargar los productos.";
    }
}
cargarCatalogo();