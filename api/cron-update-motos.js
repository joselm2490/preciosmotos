// api/cron-update-motos.js
const { sync } = require('../scripts/db-sync.js');

module.exports = async function handler(req, res) {
  // Asegurar que solo peticiones autorizadas puedan ejecutar el cron en producción
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    console.log("--- Cron: Ejecutando sincronización de motos ---");
    await sync();
    return res.status(200).json({ 
      success: true, 
      message: "Sincronización de base de datos de motos completada." 
    });
  } catch (error) {
    console.error("--- Cron Error: ---", error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
