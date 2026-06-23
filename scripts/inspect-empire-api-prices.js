// scripts/inspect-empire-api-prices.js
const axios = require('axios');

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100";
    console.log(`Fetching Empire API from: ${url}`);
    const { data: products } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    console.log(`Fetched ${products.length} products from API.`);
    products.forEach(p => {
      console.log(`ID: ${p.id} | Name: "${p.name}"`);
      console.log(`- Price block:`, JSON.stringify(p.prices));
      console.log(`- WooCommerce permalink: ${p.permalink}`);
    });
  } catch (e) {
    console.error("Error fetching Empire API:", e.message);
  }
}

run();
