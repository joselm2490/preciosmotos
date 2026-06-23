// scripts/inspect-qj-motor-html.js
const axios = require('axios');

async function checkPage(name, url) {
  try {
    console.log(`\n========================================`);
    console.log(`Checking ${name}: ${url}`);
    const { data: html } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    console.log(`HTML length: ${html.length} characters.`);
    
    // Search for numbers like 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000
    // to see if there is any price hidden in the text or script blocks.
    const regex = /\b\d{4,5}\b/g;
    let match;
    const foundNumbers = new Set();
    while ((match = regex.exec(html)) !== null) {
      foundNumbers.add(match[0]);
    }
    console.log("Found 4 or 5-digit numbers in the HTML:", Array.from(foundNumbers).join(', '));
    
    // Let's also print all matches of script blocks that might contain JSON
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    let count = 0;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      if (scriptContent.includes('price') || scriptContent.includes('precio') || scriptContent.includes('valor')) {
        count++;
        console.log(`\nScript block ${count} containing "price"/"precio" (length ${scriptContent.length}):`);
        // print a slice of the script content containing "price"
        const idx = scriptContent.indexOf('price');
        console.log(scriptContent.substring(Math.max(0, idx - 100), Math.min(scriptContent.length, idx + 200)).trim());
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

async function run() {
  await checkPage("QJ MOTOR SRT700S", "https://www.empirekeeway.com/productos/qj-motor-srt700s/");
}

run();
