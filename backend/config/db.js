// config/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Supabase Connection Pooler handles SSL differently. 
// We pass the parameters directly or let the pooler handle the handshake natively.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Removing the rigid nested ssl object allows PgBouncer on port 6543 to connect cleanly
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Supabase PostgreSQL pool connected successfully at:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Supabase PostgreSQL connection failed:", err.message);
    process.exit(1); 
  }
};

module.exports = { pool, testConnection };