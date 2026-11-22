// The five record routes. All SQL uses placeholders ($1, $2 ...) so user input
// can never become part of the SQL text.
const router = require("express").Router();
const pool = require("../db");

const COLUMNS = "id, title, category, description, status";
const STATUSES = ["Pending", "In progress", "Completed"];
const TEXT_FIELDS = [
  ["title", "Title", 3, 80],
  ["category", "Category", 2, 40],
  ["description", "Description", 5, 300]
];
const MAX_ID = 2147483647; // largest value the id column can hold

// id must be a positive whole number. A valid but huge id simply does not exist.
function readId(value) {
  if (!/^[1-9]\d*$/.test(value)) return { error: "Id must be a positive whole number." };
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > MAX_ID) return { notFound: true };
  return { id };
}

// Checks the four editable fields. Any client-supplied id is ignored.
function validate(body) {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const clean = {};

  for (const [key, label, min, max] of TEXT_FIELDS) {
    const raw = source[key];
    if (raw === undefined || raw === null) return { error: `${label} is required.` };
    if (typeof raw !== "string") return { error: `${label} must be text.` };
    const value = raw.trim();
    if (value.length === 0) return { error: `${label} is required.` };
    if (value.length < min || value.length > max) {
      return { error: `${label} must have ${min} to ${max} characters.` };
    }
    clean[key] = value;
  }

  const rawStatus = source.status;
  if (rawStatus === undefined || rawStatus === null) return { error: "Status is required." };
  if (typeof rawStatus !== "string") return { error: "Status must be text." };
  const status = rawStatus.trim();
  if (!STATUSES.includes(status)) {
    return { error: "Status must be Pending, In progress or Completed." };
  }
  clean.status = status;

  return { value: clean };
}

const notFound = (res) => res.status(404).json({ message: "Record not found." });

// GET /api/records : all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id : one record
router.get("/:id", async (req, res, next) => {
  try {
    const parsed = readId(req.params.id);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (parsed.notFound) return notFound(res);

    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [parsed.id]);
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records : create
router.post("/", async (req, res, next) => {
  try {
    const checked = validate(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });

    const { title, category, description, status } = checked.value;
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [title, category, description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id : replace the four editable fields
router.put("/:id", async (req, res, next) => {
  try {
    const parsed = readId(req.params.id);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const checked = validate(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    if (parsed.notFound) return notFound(res);

    const { title, category, description, status } = checked.value;
    const result = await pool.query(
      `UPDATE records SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${COLUMNS}`,
      [title, category, description, status, parsed.id]
    );
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id : delete
router.delete("/:id", async (req, res, next) => {
  try {
    const parsed = readId(req.params.id);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (parsed.notFound) return notFound(res);

    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [parsed.id]);
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
