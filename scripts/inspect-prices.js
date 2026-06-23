// scripts/inspect-prices.js
const axios = require('axios');
const cheerio = require('cheerio');

async function checkPrice(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' 
      }
    });
    const $ = cheerio.load(html);
    const priceText = $('.summary .price').text().trim();
    const priceAmountEl = $('.summary .price amount').text().trim();
    const priceBdiEl = $('.summary .price bdi').text().trim();
    const insPrice = $('.summary .price ins').text().trim();
    
    console.log(`URL: ${url}`);
    console.log(`- priceText: "${priceText}"`);
    console.log(`- priceAmountEl: "${priceAmountEl}"`);
    console.log(`- priceBdiEl: "${priceBdiEl}"`);
    console.log(`- insPrice: "${insPrice}"`);
  } catch (e) {
    console.error(`Error checking ${url}:`, e.message);
  }
}

async function run() {
  await checkPrice("https://www.empirekeeway.com/productos/matrix-ii/");
  await checkPrice("https://www.empirekeeway.com/productos/matrix-lite/");
  await checkPrice("https://www.empirekeeway.com/productos/tx-ii-150/");
}

run();
