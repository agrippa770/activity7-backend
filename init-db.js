// Creates the table if it is missing and inserts the starting records ONLY when the
// table is newly created. Runs automatically when the server starts.
// You can also run it by hand with:  npm run setup
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

async function initDb() {
  const found = await pool.query("SELECT to_regclass('public.records') AS t");
  const existed = found.rows[0].t !== null;
  await pool.query(read("schema.sql"));
  if (!existed) await pool.query(read("seed.sql"));
  return { created: !existed };
}

module.exports = initDb;

if (require.main === module) {
  initDb()
    .then((r) => console.log(r.created ? "Table created and 8 records added." : "Table already exists. Nothing changed."))
    .catch((err) => { console.error("Setup failed:", err.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
