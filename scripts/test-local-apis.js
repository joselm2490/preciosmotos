// scripts/test-local-apis.js
require('dotenv').config();
const beraHandler = require('../api/bera.js');
const empireHandler = require('../api/empire.js');

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
  
  // Limpiar mockRes para la siguiente prueba
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
  
  console.log("\n--- PRUEBAS COMPLETADAS ---");
}

runTest();
