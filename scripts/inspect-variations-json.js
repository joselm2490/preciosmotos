// scripts/inspect-variations-json.js
const axios = require('axios');
const cheerio = require('cheerio');

async function checkVariations(name, url) {
  try {
    console.log(`\n========================================`);
    console.log(`Checking variations for ${name}: ${url}`);
    const { data: html } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    const form = $('form.variations_form');
    if (form.length > 0) {
      const variationsData = form.attr('data-product_variations');
      if (variationsData) {
        const variations = JSON.parse(variationsData);
        console.log(`Found ${variations.length} variations!`);
        variations.forEach((v, idx) => {
          console.log(`Variation ${idx + 1}:`);
          console.log(`  Attributes:`, v.attributes);
          console.log(`  Display Price: ${v.display_price}`);
          console.log(`  Display Regular Price: ${v.display_regular_price}`);
          console.log(`  Price HTML: ${v.price_html}`);
        });
      } else {
        console.log("No data-product_variations attribute found on form.");
      }
    } else {
      console.log("No form.variations_form found in HTML.");
    }
  } catch (e) {
    console.error(`Error:`, e.message);
  }
}

async function run() {
  await checkVariations("V302C", "https://www.empirekeeway.com/productos/v302c/");
  await checkVariations("RK 250", "https://www.empirekeeway.com/productos/rk-250/");
}

run();
