// static/js/ui_renderer.js

// Global state
window.allMotos = [];
window.filteredMotos = [];

async function iniciarApp() {
    console.log("Iniciando catálogo unificado...");
    
    // Bind change/input events for filters
    const searchName = document.getElementById('searchName');
    const filterBrand = document.getElementById('filterBrand');
    const filterCategory = document.getElementById('filterCategory');
    const filterMinPrice = document.getElementById('filterMinPrice');
    const filterMaxPrice = document.getElementById('filterMaxPrice');
    
    if (searchName) searchName.addEventListener('input', filtrarYRenderizar);
    if (filterBrand) filterBrand.addEventListener('change', filtrarYRenderizar);
    if (filterCategory) filterCategory.addEventListener('change', filtrarYRenderizar);
    if (filterMinPrice) filterMinPrice.addEventListener('input', filtrarYRenderizar);
    if (filterMaxPrice) filterMaxPrice.addEventListener('input', filtrarYRenderizar);

    // Bind Excel export button
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) btnExportExcel.addEventListener('click', exportarExcel);

    try {
        // Cargar tasa de cambio
        if (typeof fetchTasaCambio === 'function') {
            await fetchTasaCambio();
        }
        
        // Actualizar indicador de tasa
        const rateIndicator = document.getElementById('rateIndicator');
        if (rateIndicator) {
            rateIndicator.innerText = `Tasa: 1 USD = ${window.tasaVesUsd} VES`;
        }

        // Cargar datos de todas las marcas en paralelo
        const container = document.getElementById('catalogContainer');
        if (container) {
            container.innerHTML = `
                <div class="loader-container">
                    <div class="spinner"></div>
                    <p>Consultando base de datos (Bera, Empire, TVS, Toro, AVA y Escuda)...</p>
                </div>
            `;
        }

        const [resBera, resEmpire, resTvs, resToro, resAva, resEscuda] = await Promise.all([
            fetch('/api/bera').then(r => r.json()).catch(err => {
                console.error("Error al cargar Bera:", err);
                return [];
            }),
            fetch('/api/empire').then(r => r.json()).catch(err => {
                console.error("Error al cargar Empire:", err);
                return [];
            }),
            fetch('/api/tvs').then(r => r.json()).catch(err => {
                console.error("Error al cargar TVS:", err);
                return [];
            }),
            fetch('/api/toro').then(r => r.json()).catch(err => {
                console.error("Error al cargar Toro:", err);
                return [];
            }),
            fetch('/api/ava').then(r => r.json()).catch(err => {
                console.error("Error al cargar AVA:", err);
                return [];
            }),
            fetch('/api/escuda').then(r => r.json()).catch(err => {
                console.error("Error al cargar Escuda:", err);
                return [];
            })
        ]);

        // Normalizar y consolidar motos en la lista global
        const beraMotos = resBera.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'Bera',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        const empireMotos = resEmpire.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'Empire',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        const tvsMotos = resTvs.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'TVS',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        const toroMotos = resToro.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'Toro',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        const avaMotos = resAva.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'Ava',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        const escudaMotos = resEscuda.map(p => ({
            id: p.id,
            name: p.name || p.nombre,
            brand: 'Escuda',
            price: parseFloat(p.prices?.price || 0),
            precio_min: p.precio_min != null ? parseFloat(p.precio_min) : parseFloat(p.prices?.price || 0),
            precio_max: p.precio_max != null ? parseFloat(p.precio_max) : parseFloat(p.prices?.price || 0),
            precio_fuente: p.precio_fuente || 'api',
            category: p.categories?.[0]?.name || 'Otros',
            image: p.images?.[0]?.src || p.imagen || '',
            url: p.permalink || p.enlace || '',
            
            // Especificaciones técnicas para exportar
            motor: p.motor || '',
            cilindrada: p.cilindrada || '',
            potencia: p.potencia || '',
            torque: p.torque || '',
            enfriamiento: p.enfriamiento || '',
            transmision: p.transmision || '',
            embrague: p.embrague || '',
            suspension_delantera: p.suspension_delantera || '',
            suspension_trasera: p.suspension_trasera || '',
            frenos_delanteros: p.frenos_delanteros || '',
            frenos_traseros: p.frenos_traseros || '',
            caucho_delantero: p.caucho_delantero || '',
            caucho_trasero: p.caucho_trasero || '',
            capacidad_combustible: p.capacidad_combustible || '',
            colores: p.colores || '',
            sistema_arranque: p.sistema_arranque || p.encendido || '',
            peso: p.peso || '',
            capacidad_carga: p.capacidad_carga || '',
            garantia: p.garantia || '',
            velocidad_maxima: p.velocidad_maxima || '',
            rendimiento_gasolina: p.rendimiento_gasolina || ''
        }));

        window.allMotos = [...beraMotos, ...empireMotos, ...tvsMotos, ...toroMotos, ...avaMotos, ...escudaMotos];
        console.log(`Cargadas ${window.allMotos.length} motos en total.`);

        // Primer filtrado y renderizado
        filtrarYRenderizar();

    } catch (e) {
        console.error("Error al iniciarApp:", e);
        const container = document.getElementById('catalogContainer');
        if (container) {
            container.innerHTML = `<p style="color:red; text-align:center; padding: 40px;">Error al cargar datos: ${e.message}</p>`;
        }
    }
}

function filtrarYRenderizar() {
    const searchVal = document.getElementById('searchName')?.value.toLowerCase().trim() || '';
    const brandVal = document.getElementById('filterBrand')?.value || 'Todos';
    const catVal = document.getElementById('filterCategory')?.value || 'Todas';
    const minPriceVal = parseFloat(document.getElementById('filterMinPrice')?.value) || 0;
    const maxPriceVal = parseFloat(document.getElementById('filterMaxPrice')?.value) || Infinity;

    // Aplicar filtros
    window.filteredMotos = window.allMotos.filter(moto => {
        // 1. Filtro por nombre
        const matchesSearch = moto.name.toLowerCase().includes(searchVal);
        
        // 2. Filtro por marca
        const matchesBrand = (brandVal === 'Todos') || 
                             (brandVal === 'Bera' && moto.brand === 'Bera') || 
                             (brandVal === 'Empire' && moto.brand === 'Empire') ||
                             (brandVal === 'TVS' && moto.brand === 'TVS') ||
                             (brandVal === 'Toro' && moto.brand === 'Toro') ||
                             (brandVal === 'Ava' && moto.brand === 'Ava') ||
                             (brandVal === 'Escuda' && moto.brand === 'Escuda');
        
        // 3. Filtro por categoría
        const matchesCategory = (catVal === 'Todas') || (moto.category === catVal);
        
        // 4. Filtro por precios
        const matchesPrice = moto.price >= minPriceVal && moto.price <= maxPriceVal;

        return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
    });

    // Actualizar indicador total
    const totalIndicator = document.getElementById('totalIndicator');
    if (totalIndicator) {
        totalIndicator.innerText = `Motos: ${window.filteredMotos.length} filtradas (de ${window.allMotos.length})`;
    }

    // Renderizar
    const container = document.getElementById('catalogContainer');
    if (!container) return;

    if (window.filteredMotos.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>No se encontraron resultados</h3>
                <p>Prueba ajustando los filtros o el rango de precios.</p>
            </div>
        `;
        return;
    }

    // Agrupar por categoría
    const categorias = {};
    window.filteredMotos.forEach(moto => {
        const cat = moto.category || 'Otros';
        if (!categorias[cat]) categorias[cat] = [];
        categorias[cat].push(moto);
    });

    // Construir HTML por categorías
    container.innerHTML = Object.keys(categorias).map(catName => {
        const motosEnCat = categorias[catName];
        return `
            <section class="category-section">
                <h2 class="category-title">${catName} (${motosEnCat.length})</h2>
                <div class="catalog-grid">
                    ${motosEnCat.map(moto => {
                        const precioUsd = moto.price;
                        const precioVes = Math.round(precioUsd * window.tasaVesUsd);
                        
                        return `
                            <div class="product-card" onclick="mostrarDetalle('${moto.brand}', '${moto.name.replace(/'/g, "\\'")}')">
                                <span class="brand-badge ${moto.brand.toLowerCase()}">${moto.brand}</span>
                                <div class="product-image-container">
                                    ${moto.image 
                                        ? `<img src="${moto.image}" class="product-image" alt="${moto.name}" loading="lazy">` 
                                        : `<div class="no-image">Imagen no disponible</div>`}
                                </div>
                                <h3>${moto.name}</h3>
                                <div class="price-container">
                                    <p class="price-tag">$${precioUsd.toLocaleString()}</p>
                                    <p class="price-ves">${precioVes.toLocaleString()} Bs.</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }).join('');
}

function exportarExcel() {
    if (window.filteredMotos.length === 0) {
        alert("⚠️ No hay motocicletas en el catálogo con los filtros actuales para exportar.");
        return;
    }

    try {
        console.log("Generando archivo Excel...");
        const dataRows = window.filteredMotos.map(moto => {
            const precioVes = Math.round(moto.price * window.tasaVesUsd);
            
            return {
                'Marca': moto.brand,
                'Nombre Modelo': moto.name,
                'Categoría': moto.category,
                'Precio (USD)': moto.price,
                'Precio (VES)': precioVes,
                'Motor': moto.motor,
                'Cilindrada': moto.cilindrada,
                'Potencia': moto.potencia,
                'Torque': moto.torque,
                'Enfriamiento': moto.enfriamiento,
                'Transmisión': moto.transmision,
                'Embrague': moto.embrague,
                'Suspensión Delantera': moto.suspension_delantera,
                'Suspensión Trasera': moto.suspension_trasera,
                'Frenos Delanteros': moto.frenos_delanteros,
                'Frenos Traseros': moto.frenos_traseros,
                'Caucho Delantero': moto.caucho_delantero,
                'Caucho Trasero': moto.caucho_trasero,
                'Capacidad Combustible': moto.capacidad_combustible,
                'Colores Disponibles': moto.colores,
                'Sistema Arranque': moto.sistema_arranque,
                'Peso (kg)': moto.peso,
                'Capacidad Carga (kg)': moto.capacidad_carga,
                'Garantía': moto.garantia,
                'Velocidad Máxima': moto.velocidad_maxima,
                'Rendimiento Combustible': moto.rendimiento_gasolina,
                'Enlace Oficial': moto.url
            };
        });

        // Crear hoja de Excel
        const worksheet = XLSX.utils.json_to_sheet(dataRows);
        
        // Ajustar ancho de las columnas de forma automática
        const columnWidths = Object.keys(dataRows[0]).map(key => {
            let maxLen = key.length;
            dataRows.forEach(row => {
                const val = row[key] ? row[key].toString() : '';
                if (val.length > maxLen) maxLen = val.length;
            });
            return { wch: Math.min(30, maxLen + 2) }; // Max 30 chars wide
        });
        worksheet['!cols'] = columnWidths;

        // Crear el libro de trabajo (workbook)
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo Motos');

        // Generar archivo y forzar descarga
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `catalogo_motos_venezuela_${dateStr}.xlsx`);
        console.log("Excel descargado correctamente.");

    } catch (e) {
        console.error("Error al exportar Excel:", e);
        alert("❌ Error al intentar generar el archivo Excel: " + e.message);
    }
}

// Bind load event
document.addEventListener('DOMContentLoaded', iniciarApp);

// Compatibility wrappers for legacy window function calls
window.renderBera = function() {
    const brandSel = document.getElementById('filterBrand');
    if (brandSel) {
        brandSel.value = 'Bera';
        brandSel.dispatchEvent(new Event('change'));
    }
};

window.renderEmpire = function() {
    const brandSel = document.getElementById('filterBrand');
    if (brandSel) {
        brandSel.value = 'Empire';
        brandSel.dispatchEvent(new Event('change'));
    }
};

async function actualizarBaseDeDatos() {
    const btn = document.getElementById('btnActualizarDb');
    if (!btn) return;
    
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerText = "Sincronizando...";
    btn.style.backgroundColor = "#64748b";
    
    try {
        const response = await fetch('/api/cron-update-motos');
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert("✅ Sincronización exitosa: Base de datos y catálogo actualizados.");
            // Recargar datos e inicializar
            await iniciarApp();
        } else {
            alert("❌ Error al actualizar: " + (data.error || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error al disparar cron:", error);
        alert("❌ Error de conexión al intentar sincronizar.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        btn.style.backgroundColor = ""; // Reset to CSS default
    }
}

// Modal control functions
window.mostrarDetalle = function(brand, name) {
    const moto = window.allMotos.find(m => m.brand === brand && m.name === name);
    if (!moto) return;
    
    // Fill basic details
    document.getElementById('modalTitle').innerText = moto.name;
    
    // Brand badge
    const badge = document.getElementById('modalBrandBadge');
    badge.innerText = moto.brand;
    badge.className = `brand-badge ${moto.brand.toLowerCase()}`;
    
    // Image
    const modalImg = document.getElementById('modalImage');
    modalImg.src = moto.image || '';
    modalImg.alt = moto.name;
    
    // Price
    const precioUsd = moto.price;
    const precioVes = Math.round(precioUsd * window.tasaVesUsd);
    document.getElementById('modalPriceUsd').innerText = `$${precioUsd.toLocaleString()}`;
    document.getElementById('modalPriceVes').innerText = `${precioVes.toLocaleString()} Bs.`;
    
    // Rango de precio
    const rangeContainer = document.getElementById('modalPriceRangeContainer');
    const sourceBadge = document.getElementById('modalPriceSourceBadge');
    const minSpan = document.getElementById('modalPriceMin');
    const maxSpan = document.getElementById('modalPriceMax');
    const barDot = document.getElementById('rangeBarDot');
    const reasoningDiv = document.getElementById('modalPriceReasoning');

    const pMin = moto.precio_min != null ? moto.precio_min : precioUsd;
    const pMax = moto.precio_max != null ? moto.precio_max : precioUsd;
    const pFuente = moto.precio_fuente || 'api';

    if (rangeContainer && minSpan && maxSpan && sourceBadge && barDot && reasoningDiv) {
        if (pMin < pMax) {
            rangeContainer.style.display = 'block';
            minSpan.innerText = `$${Math.round(pMin).toLocaleString()}`;
            maxSpan.innerText = `$${Math.round(pMax).toLocaleString()}`;
            
            if (pFuente === 'agente_ia') {
                sourceBadge.innerText = "Agente IA";
                sourceBadge.className = "range-badge ia";
                reasoningDiv.style.display = 'block';
                reasoningDiv.innerHTML = `El agente de IA encontró un rango de precios entre <strong>$${Math.round(pMin).toLocaleString()}</strong> y <strong>$${Math.round(pMax).toLocaleString()}</strong> en distribuidores de Venezuela. El precio mostrado arriba es el promedio.`;
            } else {
                sourceBadge.innerText = "Oficial";
                sourceBadge.className = "range-badge";
                reasoningDiv.style.display = 'none';
            }
            
            // Posicionar el indicador visual
            const pct = Math.max(0, Math.min(100, ((precioUsd - pMin) / (pMax - pMin)) * 100));
            barDot.style.left = `${pct}%`;
            document.getElementById('rangeBarContainer').style.display = 'block';
        } else if (pFuente === 'agente_ia') {
            // El agente encontró un precio único
            rangeContainer.style.display = 'block';
            minSpan.innerText = `$${Math.round(pMin).toLocaleString()}`;
            maxSpan.innerText = `$${Math.round(pMax).toLocaleString()}`;
            sourceBadge.innerText = "Agente IA";
            sourceBadge.className = "range-badge ia";
            reasoningDiv.style.display = 'block';
            reasoningDiv.innerHTML = `Precio único de mercado de <strong>$${Math.round(pMin).toLocaleString()}</strong> detectado por el agente de IA en distribuidores venezolanos.`;
            
            // Ocultar la barra deslizadora ya que es un valor único
            document.getElementById('rangeBarContainer').style.display = 'none';
        } else {
            // Precio fijo oficial sin rango
            rangeContainer.style.display = 'none';
        }
    }
    
    // Link
    const modalLink = document.getElementById('modalLink');
    if (moto.url) {
        modalLink.href = moto.url;
        modalLink.style.display = 'inline-flex';
    } else {
        modalLink.style.display = 'none';
    }
    
    // Specifications list - dynamic
    const specsGrid = document.getElementById('modalSpecsGrid');
    specsGrid.innerHTML = '';
    
    // All relevant spec properties we care about
    const specFields = [
        { label: 'Motor', val: moto.motor },
        { label: 'Cilindrada', val: moto.cilindrada },
        { label: 'Potencia', val: moto.potencia },
        { label: 'Torque', val: moto.torque },
        { label: 'Enfriamiento', val: moto.enfriamiento },
        { label: 'Transmisión', val: moto.transmision },
        { label: 'Embrague', val: moto.embrague },
        { label: 'Suspensión Delantera', val: moto.suspension_delantera },
        { label: 'Suspensión Trasera', val: moto.suspension_trasera },
        { label: 'Freno Delantero', val: moto.frenos_delanteros },
        { label: 'Freno Trasero', val: moto.frenos_traseros },
        { label: 'Caucho Delantero', val: moto.caucho_delantero },
        { label: 'Caucho Trasero', val: moto.caucho_trasero },
        { label: 'Capacidad de Combustible', val: moto.capacidad_combustible },
        { label: 'Colores Disponibles', val: moto.colores },
        { label: 'Sistema de Arranque', val: moto.sistema_arranque },
        { label: 'Peso (Kg)', val: moto.peso },
        { label: 'Capacidad de Carga', val: moto.capacidad_carga },
        { label: 'Garantía', val: moto.garantia },
        { label: 'Velocidad Máxima', val: moto.velocidad_maxima },
        { label: 'Rendimiento de Gasolina', val: moto.rendimiento_gasolina }
    ];
    
    let hasSpecs = false;
    specFields.forEach(field => {
        if (field.val && field.val !== 'null' && field.val !== '') {
            hasSpecs = true;
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.innerHTML = `
                <span class="spec-label">${field.label}</span>
                <span class="spec-value">${field.val}</span>
            `;
            specsGrid.appendChild(row);
        }
    });
    
    if (!hasSpecs) {
        specsGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay especificaciones adicionales registradas para este modelo.</p>';
    }
    
    // Open modal
    document.getElementById('motoModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable page scrolling
};

window.cerrarModal = function() {
    document.getElementById('motoModal').classList.remove('active');
    document.body.style.overflow = ''; // Re-enable page scrolling
};

// Lightbox control functions
window.ampliarImagen = function() {
    const modalImg = document.getElementById('modalImage');
    if (!modalImg || !modalImg.src) return;
    
    const lightboxImg = document.getElementById('lightboxImage');
    lightboxImg.src = modalImg.src;
    lightboxImg.alt = modalImg.alt;
    
    document.getElementById('imageLightbox').classList.add('active');
};

window.cerrarLightbox = function() {
    document.getElementById('imageLightbox').classList.remove('active');
};

// Keyboard listener for Escape key to close modal or lightbox
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const lightbox = document.getElementById('imageLightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            window.cerrarLightbox();
        } else {
            window.cerrarModal();
        }
    }
});