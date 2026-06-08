window.tasaVesUsd = 36.5;
async function fetchTasaCambio() {
    try {
        const res = await fetch("/api/tasa");
        const data = await res.json();
        window.tasaVesUsd = data.tasa;
    } catch (e) { window.tasaVesUsd = 36.5; }
}