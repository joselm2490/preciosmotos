// static/js/motosempire.js
// Backward compatibility forwarder
async function renderEmpire() {
    const brandSel = document.getElementById('filterBrand');
    if (brandSel) {
        brandSel.value = 'Empire';
        brandSel.dispatchEvent(new Event('change'));
    }
}