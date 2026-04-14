const { Pool } = require("pg");

let pool;

function getPool() {
  if (pool) {
    return pool;
  }

  const sslEnabled = String(process.env.DB_SSL || "true") === "true";
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 10),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false
  });

  return pool;
}

async function query(text, params = []) {
  const db = getPool();
  return db.query(text, params);
}

module.exports = {
  getPool,
  query
};
