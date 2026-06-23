// scripts/search-api-for-prices.js
const axios = require('axios');

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100";
    console.log(`Fetching Empire API from: ${url}`);
    const { data: products } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const jsonStr = JSON.stringify(products);
    console.log(`JSON dump size: ${jsonStr.length} bytes`);
    
    const targets = ['1575', '1179', '1379', '1589'];
    targets.forEach(target => {
      const idx = jsonStr.indexOf(target);
      if (idx !== -1) {
        console.log(`Found target "${target}" at index ${idx}!`);
        // print context
        console.log(`Context: ...${jsonStr.substring(idx - 100, idx + 100)}...`);
      } else {
        console.log(`Target "${target}" NOT found in the API JSON.`);
      }
    });

    // Let's also check if there are other fields in the product prices block like raw_price, etc.
    const variableProducts = products.filter(p => p.type === 'variable' || p.variations?.length > 0);
    console.log(`\nFound ${variableProducts.length} variable products:`);
    variableProducts.forEach(p => {
      console.log(`- "${p.name}" (ID: ${p.id}) type: ${p.type} price: ${JSON.stringify(p.prices)}`);
    });

  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
