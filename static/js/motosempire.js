window.EmpireData = [];

// Esta función debe ir primero
async function cargarDataEmpire() {
    if (window.EmpireData.length > 0) return window.EmpireData;
    try {
        const response = await fetch('/api/empire');
        window.EmpireData = await response.json();
        return window.EmpireData;
    } catch (e) {
        console.error("Error al cargar datos:", e);
        return [];
    }
}

// Esta función usa a la anterior
async function renderEmpire() {
    const data = await cargarDataEmpire(); // Aquí es donde te da el error

    // ... resto de tu lógica de renderizado
    const datosNormalizados = data.map(m => ({
        nombre: m.nombre,
        precioUsd: m.precioUsd,
        precioVes: Math.round(m.precioUsd * window.tasaVesUsd),
        imagen: null
    }));
    renderizarCatalogo(datosNormalizados, "Empire");
}