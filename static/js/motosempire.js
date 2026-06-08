window.EmpireData = [];
async function cargarDataEmpire() {
    if (window.EmpireData.length > 0) return window.EmpireData;
    try {
        const response = await fetch('/api/empire');
        window.EmpireData = await response.json();
        return window.EmpireData;
    } catch (e) { return []; }
}
async function renderEmpire() {
    await fetchTasaCambio();
    const data = await cargarDataEmpire();
    const datosNormalizados = data.map(m => ({
        nombre: m.nombre,
        precioUsd: m.precioUsd,
        precioVes: Math.round(m.precioUsd * window.tasaVesUsd),
        imagen: null
    }));
    renderizarCatalogo(datosNormalizados, "Empire");
}