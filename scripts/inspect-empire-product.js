// scripts/inspect-empire-product.js
const axios = require('axios');
const cheerio = require('cheerio');

async function inspect() {
  const url = "https://www.empirekeeway.com/productos/atlas/";
  console.log(`Fetching ${url}...`);
  try {
    const { data: html } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' 
      }
    });
    
    const $ = cheerio.load(html);
    
    console.log("--- HTML OF TAB-MOTOR ---");
    console.log($('#tab-motor').html());
    
    console.log("\n--- HTML OF TAB-TRANSMISION ---");
    console.log($('#tab-transmision').html());

  } catch (error) {
    console.error("Error inspecting:", error.message);
  }
}

inspect();
