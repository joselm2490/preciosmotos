// scripts/inspect-bera-all-attributes.js
const axios = require('axios');

async function inspect() {
  console.log("Fetching multiple Bera products...");
  try {
    const response = await axios.get("https://beravirtual.com/wp-json/wc/store/v1/products?per_page=50", {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const attrNames = new Set();
    response.data.forEach(product => {
      if (product.attributes) {
        product.attributes.forEach(attr => {
          attrNames.add(attr.name);
        });
      }
    });
    
    console.log("--- BERA UNIQUE ATTRIBUTE NAMES ---");
    console.log(Array.from(attrNames));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

inspect();
