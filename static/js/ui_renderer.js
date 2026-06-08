// static/js/ui_renderer.js

function renderizarCatalogo(datos, marca) {
    const container = document.getElementById('catalogContainer');
    if (!container) return;

    // Convert to array if single object
    const listaMotos = Array.isArray(datos) ? datos : [datos];

    container.innerHTML = `<h1>Catálogo ${marca}</h1>` +
        `<div class="catalog-grid">` +
        listaMotos.map(moto => {
            const precioUsd = moto.precio || moto.precioUsd || 0;
            const tasa = window.tasaVesUsd || 36.5;
            const precioVes = moto.precioVes || (parseFloat(precioUsd) * tasa);
            const imagen = moto.imagen || '';
            const nombre = moto.nombre || '';

            return `
            <div class="product-card">
                ${imagen ? `<img src="${imagen}" class="product-image" alt="${nombre}">` : `<div class="no-image">Sin imagen</div>`}
                <h3>${nombre}</h3>
                <p class="price-tag">$${precioUsd}</p>
                <p class="price-ves">${Math.round(precioVes).toLocaleString()} Bs.</p>
            </div>
            `;
        }).join('') + `</div>`;
}

async function iniciarApp() {
    console.log("Iniciando renderizado de catálogo...");
    try {
        // Asegurar que la tasa se cargue primero
        if (typeof fetchTasaCambio === 'function') {
            await fetchTasaCambio();
        }
        
        // Cargar Empire por defecto
        if (typeof renderEmpire === 'function') {
            await renderEmpire();
        }
    } catch (error) {
        console.error("Error grave en iniciarApp:", error);
        const container = document.getElementById('catalogContainer');
        if (container) {
            container.innerHTML = `<p style="color:red">Error al cargar: ${error.message}</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);