// scripts/verify-prices.js
require('dotenv').config();
const { getDbPool } = require('../api/_db.js');

async function run() {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT nombre, precio, categoria, imagen FROM public.motos 
       WHERE nombre IN ('V302C', 'RK 250', 'QJ MOTOR SRT700S', 'Fort 4.0') AND active = true`
    );
    console.log("Database values:");
    result.rows.forEach(row => {
      console.log(`- Name: "${row.nombre}" | Price: $${row.precio} | Category: "${row.categoria}"`);
      console.log(`  Image: "${row.imagen}"`);
    });
  } catch (e) {
    console.error(e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
