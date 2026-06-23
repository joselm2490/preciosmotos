// scripts/test-smart-quotes.js
const axios = require('axios');

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products/9478";
    const { data: p } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const desc = p.description;
    const idx = desc.indexOf('Caucho trasero');
    if (idx !== -1) {
      console.log("Raw string around 'Caucho trasero':");
      console.log(desc.substring(idx - 50, idx + 200));
    }
  } catch (e) {
    console.error(e.message);
  }
}

run();
