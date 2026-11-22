// Creates and exports the PostgreSQL connection pool.
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// Hosted databases (Render, Neon, ...) need SSL. A local database usually does not.
const url = process.env.DATABASE_URL || "";
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
const useSsl = process.env.DATABASE_SSL ? process.env.DATABASE_SSL === "true" : !isLocal;

const pool = new Pool({
  connectionString: url,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

// An idle connection can drop; log it instead of crashing the server.
pool.on("error", (err) => console.error("Database pool error:", err.message));

module.exports = pool;
