require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const initDb = require("./init-db");
const guide = require("./guide");

const app = express();
app.set("trust proxy", 1); // so https is detected behind Render's proxy

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json());

// GET / : API guide for the marker
app.get("/", (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  res.status(200).type("html").send(guide(baseUrl));
});

// GET /health : server and database check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database is not responding." });
  }
});

app.use("/api/records", require("./routes/records"));

// Unknown routes (any method) -> JSON 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (four parameters). Details go to the server log only.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in the request body." });
  }
  if (error.type === "entity.too.large") {
    return res.status(400).json({ message: "Request body is too large." });
  }
  console.error("Unexpected error:", error);
  res.status(500).json({ message: "Unexpected server error. Please try again." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  // Create the table (and seed it once) if needed. A failure is logged, not fatal.
  initDb()
    .then((r) => console.log(r.created ? "Table created and starting records added." : "Database ready."))
    .catch((err) => console.error("Database setup failed:", err.message));
});
