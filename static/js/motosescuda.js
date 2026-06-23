// static/js/motosescuda.js
// Backward compatibility forwarder
async function renderEscuda() {
    const brandSel = document.getElementById('filterBrand');
    if (brandSel) {
        brandSel.value = 'Escuda';
        brandSel.dispatchEvent(new Event('change'));
    }
}
