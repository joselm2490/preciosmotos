// scripts/inspect-html-for-price.js
const axios = require('axios');

async function run() {
  const url = "https://www.empirekeeway.com/productos/tx-ii-150/";
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    console.log(`Checking HTML size: ${html.length} bytes`);
    
    // Look for any occurrences of "price", "amount", "1.", "0.", etc.
    // Let's search for script tags containing JSON or arrays
    const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes('price') || scriptContent.includes('amount') || scriptContent.includes('variation')) {
        count++;
        console.log(`\n--- Script Tag #${count} (length: ${scriptContent.length}) ---`);
        // print a slice of the script content containing the keyword
        const idx = scriptContent.indexOf('price');
        console.log(scriptContent.substring(Math.max(0, idx - 200), Math.min(scriptContent.length, idx + 400)));
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

run();
