// scripts/search-html-prices.js
const axios = require('axios');
const cheerio = require('cheerio');

async function searchPage(url) {
  try {
    console.log(`\n========================================`);
    console.log(`Fetching page: ${url}`);
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    
    // Remove scripts and style tags to inspect visible text
    $('script, style, noscript').remove();
    
    const bodyText = $('body').text();
    
    // Find all occurrences of '$' or words like 'precio', 'costo', 'dolar', 'dólar', 'usd'
    console.log("Searching for '$' sign and surrounding text:");
    const regex = /(?:precio|costo|ref|usd|\$)\s*:?\s*([\d.,]+)/gi;
    let match;
    const matches = [];
    while ((match = regex.exec(bodyText)) !== null) {
      matches.push(match[0]);
    }
    console.log("Matches found:", matches.slice(0, 15));
    
    // Print all occurrences of numbers between 1000 and 15000
    console.log("\nSearching for any 4-digit or 5-digit number in visible text:");
    const numRegex = /\b\d{4,5}(?:\.\d{2})?\b/g;
    const numMatches = [];
    while ((match = numRegex.exec(bodyText)) !== null) {
      numMatches.push(match[0]);
    }
    console.log("Numeric matches:", Array.from(new Set(numMatches)));
  } catch (e) {
    console.error(e.message);
  }
}

async function run() {
  await searchPage("https://www.empirekeeway.com/productos/v302c/");
  await searchPage("https://www.empirekeeway.com/productos/tx-ii-150/");
}

run();
