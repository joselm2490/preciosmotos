// scripts/inspect-form-variations.js
const axios = require('axios');
const cheerio = require('cheerio');

async function run() {
  const url = "https://www.empirekeeway.com/productos/tx-ii-150/";
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(html);
    const form = $('.variations_form');
    if (form.length > 0) {
      console.log("Found variations form!");
      const variationsDataAttr = form.attr('data-product_variations');
      if (variationsDataAttr) {
        console.log("Found data-product_variations attribute!");
        const variations = JSON.parse(variationsDataAttr);
        console.log(`Parsed ${variations.length} variations:`);
        variations.forEach((v, index) => {
          console.log(`\nVariation #${index + 1}:`);
          console.log(`- ID: ${v.variation_id}`);
          console.log(`- Attributes:`, JSON.stringify(v.attributes));
          console.log(`- Price HTML: "${v.price_html}"`);
          console.log(`- display_price: ${v.display_price}`);
          console.log(`- display_regular_price: ${v.display_regular_price}`);
        });
      } else {
        console.log("No data-product_variations attribute found on the form.");
      }
    } else {
      console.log("No variations form found on the page.");
    }
  } catch (e) {
    console.error(e.message);
  }
}

run();
