// scripts/inspect-tx-ii-json.js
const axios = require('axios');
const fs = require('fs');

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products/9478";
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // Save to a file so we can view it
    fs.writeFileSync('tx_ii_150_api.json', JSON.stringify(data, null, 2));
    console.log("Saved JSON to tx_ii_150_api.json");
  } catch (e) {
    console.error(e.message);
  }
}

run();
