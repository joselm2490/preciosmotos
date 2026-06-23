// scripts/inspect-specific-api-prices.js
const axios = require('axios');

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100";
    console.log(`Fetching Empire API...`);
    const { data: products } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const targets = ['matrix ii', 'matrix lite', 'ek xpress lite', 'tx ii 150'];
    products.forEach(p => {
      const nameLower = p.name.toLowerCase();
      if (targets.some(target => nameLower.includes(target))) {
        console.log(`\n========================================`);
        console.log(`Name: "${p.name}" (ID: ${p.id})`);
        console.log(`Permalink: ${p.permalink}`);
        console.log(`Prices Block:`, JSON.stringify(p.prices, null, 2));
        console.log(`Variations count: ${p.variations?.length || 0}`);
        if (p.variations && p.variations.length > 0) {
          console.log(`Variations:`, JSON.stringify(p.variations, null, 2));
        }
      }
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
