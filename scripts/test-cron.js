// scripts/test-cron.js
require('dotenv').config();
const cronHandler = require('../api/cron-update-motos.js');

async function testCron() {
  console.log("--- PROBANDO MANEJADOR DEL CRON LOCALMENTE ---");
  
  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  
  // Enviamos una petición mock (sin cabecera Authorization porque localmente CRON_SECRET no está definido)
  try {
    await cronHandler({ headers: {} }, mockRes);
    console.log(`Resultado del Cron: Status Code ${mockRes.statusCode}`);
    console.log("Cuerpo de respuesta:", JSON.stringify(mockRes.data, null, 2));
  } catch (err) {
    console.error("❌ Excepción al ejecutar el cron:", err.message);
  }
}

testCron();
