// api/_db.js
const { Pool } = require('pg');

let pool;

function getDbPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in the environment variables.");
    }
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Necessary for connection to Supabase hosted on AWS
      }
    });
  }
  return pool;
}

module.exports = { getDbPool };
