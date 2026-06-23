// scripts/inspect-qj-api.js
const axios = require('axios');

async function run() {
  const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100";
  console.log("Fetching API products...");
  try {
    const { data: products } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const targets = products.filter(p => p.name.includes("SRT") || p.name.includes("SRK") || p.name.includes("V302C") || p.name.includes("RK 250") || p.name.includes("Outlook 300") || p.name.includes("Fort 4.0"));
    
    console.log(`Found ${targets.length} target products in the API response:`);
    targets.forEach(p => {
      console.log(`- ID: ${p.id} | Name: "${p.name}"`);
      console.log(`  Price (prices):`, p.prices);
      console.log(`  Price Range (price_range):`, p.price_range);
      console.log(`  Categories:`, p.categories.map(c => c.name).join(', '));
      console.log(`  Variations count:`, p.variations ? p.variations.length : 0);
    });
  } catch (e) {
    console.error(e.message);
  }
}

run();
