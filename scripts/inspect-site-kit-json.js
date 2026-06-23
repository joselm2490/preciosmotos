// scripts/inspect-site-kit-json.js
const axios = require('axios');

async function checkPage(name, url) {
  try {
    console.log(`\n========================================`);
    console.log(`Checking page for ${name}: ${url}`);
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // Look for window._googlesitekit.wcdata.products
    const match = html.match(/window\._googlesitekit\.wcdata\.products\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      console.log("Found window._googlesitekit.wcdata.products!");
      const products = JSON.parse(match[1]);
      console.log("Site Kit products list:");
      products.forEach(p => {
        console.log(`- ID: ${p.id} | Name: "${p.name}" | Price: ${p.price}`);
      });
    } else {
      console.log("window._googlesitekit.wcdata.products not found in page HTML.");
    }

    // Let's also look for any other script tags containing JSON with the name of the product
    const lines = html.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('1575') || line.includes('1.575') || line.includes('1589') || line.includes('1.589') || line.includes('1379') || line.includes('1.379') || line.includes('1179') || line.includes('1.179')) {
        console.log(`Line ${idx + 1} contains target number:`);
        console.log(line.trim().substring(0, 150));
      }
    });

  } catch (e) {
    console.error(`Error checking page: ${e.message}`);
  }
}

async function run() {
  await checkPage("TX II 150", "https://www.empirekeeway.com/productos/tx-ii-150/");
  await checkPage("Matrix II", "https://www.empirekeeway.com/productos/matrix-ii/");
}

run();
