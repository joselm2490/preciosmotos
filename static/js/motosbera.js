// static/js/motosbera.js
// Backward compatibility forwarder
async function renderBera() {
    const brandSel = document.getElementById('filterBrand');
    if (brandSel) {
        brandSel.value = 'Bera';
        brandSel.dispatchEvent(new Event('change'));
    }
}