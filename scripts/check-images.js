// scripts/check-images.js
require('dotenv').config();
const { getDbPool } = require('../api/_db.js');

async function run() {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT nombre, precio, imagen, imagenes FROM public.motos WHERE marca = 'Empire' AND active = true`
    );
    console.log(`Checking ${result.rows.length} active Empire products:`);
    result.rows.forEach((row, i) => {
      console.log(`[${i+1}] Name: "${row.nombre}"`);
      console.log(`    Price: $${row.precio}`);
      console.log(`    Main Image: "${row.imagen}"`);
      console.log(`    Gallery: ${JSON.stringify(row.imagenes)}`);
    });
  } catch (e) {
    console.error(e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
