// scripts/test-parse-description.js
const axios = require('axios');

function parseShortcodes(description) {
  const specs = {};
  if (!description) return specs;
  
  // Robust regex that accounts for smart quotes U+00BB (»), standard quotes, and the WordPress double prime bug (&#8243;)
  const regex = /col_1_content=[»"'](.*?)(?:[»"']|&#8243;)\s+col_2_content=[»"'](.*?)(?:[»"']|&#8243;)/g;
  let match;
  while ((match = regex.exec(description)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    specs[key] = value;
  }
  return specs;
}

async function run() {
  try {
    const url = "https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100";
    console.log(`Fetching products from API...`);
    const { data: products } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // Filter out accessories
    const excludedKeywords = ['espejo', 'retrovisor', 'portabanda', 'repuesto', 'accesorio', 'repuestos', 'tapa', 'stop', 'tanque'];
    const filtered = products.filter(p => {
      const nameLower = p.name.toLowerCase();
      return !excludedKeywords.some(keyword => nameLower.includes(keyword));
    });
    
    console.log(`Filtered to ${filtered.length} bikes.`);
    
    filtered.slice(0, 4).forEach(p => {
      console.log(`\nName: "${p.name}"`);
      const specs = parseShortcodes(p.description);
      console.log("Parsed specs:", JSON.stringify(specs, null, 2));
    });
  } catch (e) {
    console.error(e.message);
  }
}

run();
