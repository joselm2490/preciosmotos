// static/js/motosempire.js
window.EmpireData = [];

async function renderEmpire() {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = "<h3>Cargando motos...</h3>";

    try {
        // Llamamos a la API que Vercel SÍ puede ejecutar
        const response = await fetch('/api/empire');
        const data = await response.json();

        // Ahora sí, llamamos al renderizador que ya tienes
        renderizarCatalogo(data, "Empire");
    } catch (e) {
        container.innerHTML = "Error al cargar Empire.";
    }
}