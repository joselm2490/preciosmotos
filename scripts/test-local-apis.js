// scripts/test-local-apis.js
require('dotenv').config();
const beraHandler = require('../api/bera.js');
const empireHandler = require('../api/empire.js');
const tvsHandler = require('../api/tvs.js');
const toroHandler = require('../api/toro.js');

async function runTest() {
  console.log("--- INICIANDO PRUEBAS DE APIS LOCALES CON SUPABASE ---");
  
  const mockRes = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  
  console.log("\n--- Probando api/bera.js ---");
  try {
    await beraHandler({}, mockRes);
    if (mockRes.statusCode === 200) {
      console.log(`✅ Exito: api/bera.js retornó ${mockRes.data.length} motos.`);
      if (mockRes.data.length > 0) {
        console.log("Ejemplo de producto Bera (primer registro):", JSON.stringify(mockRes.data[0], null, 2));
      }
    } else {
      console.error(`❌ Error en api/bera.js. Status Code: ${mockRes.statusCode}`, mockRes.data);
    }
  } catch (err) {
    console.error("❌ Excepción en api/bera.js:", err.message);
  }
  
  // Limpiar mockRes
  mockRes.headers = {};
  mockRes.statusCode = 200;
  mockRes.data = null;
  
  console.log("\n--- Probando api/empire.js ---");
  try {
    await empireHandler({}, mockRes);
    if (mockRes.statusCode === 200) {
      console.log(`✅ Exito: api/empire.js retornó ${mockRes.data.length} motos.`);
      if (mockRes.data.length > 0) {
        console.log("Ejemplo de producto Empire (primer registro):", JSON.stringify(mockRes.data[0], null, 2));
      }
    } else {
      console.error(`❌ Error en api/empire.js. Status Code: ${mockRes.statusCode}`, mockRes.data);
    }
  } catch (err) {
    console.error("❌ Excepción en api/empire.js:", err.message);
  }

  // Limpiar mockRes
  mockRes.headers = {};
  mockRes.statusCode = 200;
  mockRes.data = null;
  
  console.log("\n--- Probando api/tvs.js ---");
  try {
    await tvsHandler({}, mockRes);
    if (mockRes.statusCode === 200) {
      console.log(`✅ Exito: api/tvs.js retornó ${mockRes.data.length} motos.`);
      if (mockRes.data.length > 0) {
        console.log("Ejemplo de producto TVS (primer registro):", JSON.stringify(mockRes.data[0], null, 2));
      }
    } else {
      console.error(`❌ Error en api/tvs.js. Status Code: ${mockRes.statusCode}`, mockRes.data);
    }
  } catch (err) {
    console.error("❌ Excepción en api/tvs.js:", err.message);
  }

  // Limpiar mockRes
  mockRes.headers = {};
  mockRes.statusCode = 200;
  mockRes.data = null;
  
  console.log("\n--- Probando api/toro.js ---");
  try {
    await toroHandler({}, mockRes);
    if (mockRes.statusCode === 200) {
      console.log(`✅ Exito: api/toro.js retornó ${mockRes.data.length} motos.`);
      if (mockRes.data.length > 0) {
        console.log("Ejemplo de producto Toro (primer registro):", JSON.stringify(mockRes.data[0], null, 2));
      }
    } else {
      console.error(`❌ Error en api/toro.js. Status Code: ${mockRes.statusCode}`, mockRes.data);
    }
  } catch (err) {
    console.error("❌ Excepción en api/toro.js:", err.message);
  }
  
  console.log("\n--- PRUEBAS COMPLETADAS ---");
}

runTest();
