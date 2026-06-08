// motosempire.js - Ajuste de lógica de precios
async function renderEmpire() {
    const data = await cargarDataEmpire();

    // Limpiamos los datos antes de renderizar
    const datosNormalizados = data.map(m => {
        // Limpiamos el precio: quitamos puntos, comas o letras si los hubiera
        // Esto evita que $1.033 se convierta en 1033 o en un error
        let precioLimpio = typeof m.precioUsd === 'string'
            ? parseFloat(m.precioUsd.replace(/[^0-9.]/g, ''))
            : m.precioUsd;

        return {
            nombre: m.nombre,
            precioUsd: precioLimpio,
            precioVes: Math.round(precioLimpio * window.tasaVesUsd),
            // Si no hay imagen, le damos una por defecto para que no se vea el hueco
            imagen: m.imagen || 'static/css/default-moto.png'
        };
    });

    renderizarCatalogo(datosNormalizados, "Empire");
}