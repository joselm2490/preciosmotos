// static/js/ui_renderer.js
async function iniciarApp() {
    const contenedor = document.getElementById('contenedor-motos');
    console.log("Iniciando renderizado de catálogo...");

    try {
        // 1. Cargar Tasa
        console.log("Consultando /api/tasa...");
        const resTasa = await fetch('/api/tasa');
        const dataTasa = await resTasa.json();
        console.log("Tasa recibida:", dataTasa);

        // 2. Cargar Motos de Empire
        console.log("Consultando /api/empire...");
        const resEmpire = await fetch('/api/empire');
        const empire = await resEmpire.json();
        console.log("Datos Empire recibidos:", empire);

        // 3. Renderizar
        if (empire && empire.nombre) {
            contenedor.innerHTML = `
                <div class="moto-card">
                    <h2>${empire.nombre}</h2>
                    <img src="${empire.imagen}" alt="${empire.nombre}" style="width: 200px;">
                    <p>Precio USD: ${empire.precio}</p>
                    <p>Precio Bs: ${(parseFloat(empire.precio) * dataTasa.tasa).toFixed(2)}</p>
                </div>
            `;
            console.log("Renderizado finalizado con éxito.");
        } else {
            console.warn("No se pudo renderizar: estructura de datos incorrecta");
        }

    } catch (error) {
        console.error("Error grave en ui_renderer.js:", error);
        contenedor.innerHTML = `<p style="color:red">Error al cargar: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);