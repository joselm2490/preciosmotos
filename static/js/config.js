window.tasaVesUsd = 36.5;
async function fetchTasaCambio() {
    try {
        const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://open.er-api.com/v6/latest/USD"));
        const data = await res.json();
        window.tasaVesUsd = data.rates.VES || 36.5;
    } catch { window.tasaVesUsd = 36.5; }
}