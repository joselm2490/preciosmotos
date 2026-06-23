// scripts/inspect-variation-api.js
const axios = require('axios');

async function testEndpoint(url) {
  try {
    console.log(`\nTesting endpoint: ${url}`);
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Success! Response keys:`, Object.keys(data));
    if (data.prices) {
      console.log(`Prices block:`, JSON.stringify(data.prices, null, 2));
    }
  } catch (e) {
    console.error(`Failed: ${e.message}`);
  }
}

async function run() {
  // Test if we can fetch a single product details
  await testEndpoint("https://www.empirekeeway.com/wp-json/wc/store/v1/products/9478");
  
  // Test if the variation ID itself works as a product ID
  await testEndpoint("https://www.empirekeeway.com/wp-json/wc/store/v1/products/9479");
  
  // Test typical WordPress REST API endpoints for variations
  await testEndpoint("https://www.empirekeeway.com/wp-json/wc/v3/products/9478/variations");
  await testEndpoint("https://www.empirekeeway.com/wp-json/wp/v2/product/9478");
}

run();
