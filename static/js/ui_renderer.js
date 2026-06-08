// ui_renderer.js
function renderizarCatalogo(listaMotos, marca) {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = `<h1>Catálogo ${marca}</h1>` +
        `<div class="catalog-grid">` +
        listaMotos.map(moto => `
        <div class="product-card">
            ${moto.imagen ? `<img src="${moto.imagen}" class="product-image">` : `<div class="no-image">Sin imagen</div>`}
            <h3>${moto.nombre}</h3>
            <p class="price-tag">$${moto.precioUsd}</p>
            <p class="price-ves">${moto.precioVes.toLocaleString()} Bs.</p>
        </div>
    `).join('') + `</div>`;
}