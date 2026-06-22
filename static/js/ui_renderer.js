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

async function actualizarBaseDeDatos() {
    const btn = document.getElementById('btnActualizarDb');
    if (!btn) return;
    
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Sincronizando...";
    btn.style.backgroundColor = "#7f8c8d";
    
    try {
        const response = await fetch('/api/cron-update-motos');
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert("✅ Sincronización exitosa: Base de datos actualizada.");
            
            // Recargar la vista actual
            const header = document.querySelector('#catalogContainer h1');
            if (header && header.innerText.includes("Bera")) {
                await renderBera();
            } else {
                await renderEmpire();
            }
        } else {
            alert("❌ Error al actualizar: " + (data.error || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error al disparar cron:", error);
        alert("❌ Error de conexión al intentar sincronizar.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
        btn.style.backgroundColor = "#27ae60";
    }
}