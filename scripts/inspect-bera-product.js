// scripts/inspect-bera-product.js
const axios = require('axios');

async function inspect() {
  console.log("Fetching Bera product sample...");
  try {
    const response = await axios.get("https://beravirtual.com/wp-json/wc/store/v1/products?per_page=1", {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.data && response.data.length > 0) {
      const product = response.data[0];
      console.log("--- BERA PRODUCT SAMPLE ---");
      console.log("Product name:", product.name);
      console.log("Available keys:", Object.keys(product));
      
      console.log("\n--- PRICES ---");
      console.log(product.prices);
      
      console.log("\n--- IMAGES ---");
      console.log(product.images);
      
      console.log("\n--- CATEGORIES ---");
      console.log(product.categories);
      
      console.log("\n--- ATTRIBUTES ---");
      console.log(JSON.stringify(product.attributes, null, 2));

      console.log("\n--- DESCRIPTION ---");
      console.log(product.description);
      
      console.log("\n--- SHORT DESCRIPTION ---");
      console.log(product.short_description);
    } else {
      console.log("No Bera products found.");
    }
  } catch (error) {
    console.error("Error fetching Bera product:", error.message);
  }
}

inspect();
