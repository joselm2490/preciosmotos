// scripts/test-endpoints.js
require('dotenv').config();
const beraHandler = require('../api/bera.js');
const empireHandler = require('../api/empire.js');

function mockResponse() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  res.setHeader = (name, val) => {
    res.headers = res.headers || {};
    res.headers[name] = val;
  };
  return res;
}

async function run() {
  console.log("=== TESTING BERA HANDLER ===");
  const reqBera = {};
  const resBera = mockResponse();
  await beraHandler(reqBera, resBera);
  
  if (resBera.statusCode === 200) {
    console.log(`✅ Bera success! Loaded ${resBera.jsonData.length} products.`);
    if (resBera.jsonData.length > 0) {
      const p = resBera.jsonData[0];
      console.log(`Sample Bera product: name="${p.name}", price=${p.prices?.price}, categories=${JSON.stringify(p.categories)}`);
    }
  } else {
    console.error(`❌ Bera failed with status ${resBera.statusCode}`, resBera.jsonData);
  }

  console.log("\n=== TESTING EMPIRE HANDLER ===");
  const reqEmpire = {};
  const resEmpire = mockResponse();
  await empireHandler(reqEmpire, resEmpire);
  
  if (resEmpire.statusCode === 200) {
    console.log(`✅ Empire success! Loaded ${resEmpire.jsonData.length} products.`);
    if (resEmpire.jsonData.length > 0) {
      const p = resEmpire.jsonData[0];
      console.log(`Sample Empire product: name="${p.name}", price=${p.prices?.price}, categories=${JSON.stringify(p.categories)}`);
    }
  } else {
    console.error(`❌ Empire failed with status ${resEmpire.statusCode}`, resEmpire.jsonData);
  }
  
  // Force exit as pg connections might keep event loop open
  process.exit(0);
}

run();
