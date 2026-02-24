const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");
const fs = require("fs");
const path = require("path");

/**
 * GET /kt/list
 * Fetches knowledge transfer records with optional filters for topic and employee.
 * If no filters are provided, defaults to records from the last 10 days.
 * Supports partial, case-insensitive topic search using LIKE.
 */
const getEmpKT = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { topic, emp_id } = req.query;

    let query = `
      SELECT
        ks.K_ID          AS "k_id",
        ks.K_DATE        AS "k_date",
        ks.K_TOPIC       AS "k_topic",
        ks.K_DESCRIPTION AS "k_description",
        ks.K_FILE_NAME   AS "k_file_name",
        ks.EMP_ID        AS "emp_id",
        e.NAME           AS "name"
      FROM KNOWLEDGE_SHARING ks
      JOIN EMP e
        ON e.EMP_ID = ks.EMP_ID
      WHERE 1 = 1
    `;

    const bindParams = {};

    // Determine if any search filter is active
    const isSearch = !!(topic?.trim() || emp_id);

    // If no filters provided, limit results to the last 10 days
    if (!isSearch) {
      query += ` AND ks.K_DATE >= TRUNC(SYSDATE) - 10`;
    }

    // Filter by topic using partial case-insensitive match
    if (topic?.trim()) {
      query += ` AND UPPER(ks.K_TOPIC) LIKE UPPER(:TOPIC)`;
      bindParams.TOPIC = `%${topic.trim()}%`;
    }

    // Filter by employee ID if provided
    if (emp_id?.toString().trim()) {
      query += ` AND ks.EMP_ID = :EMP_ID`;
      bindParams.EMP_ID = Number(emp_id);
    }

    query += ` ORDER BY ks.K_DATE DESC, ks.K_ID DESC`;

    const result = await db.executeQuery(query, bindParams, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "KT list fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching KT list:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /kt/employees
 * Fetches a dropdown list of all employees (ID and name) for the KT filter,
 * ordered alphabetically by name.
 */
const getEmpKTDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        EMP_ID AS "emp_id",
        NAME   AS "name"
      FROM EMP
      ORDER BY NAME
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Employee dropdown fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching employee dropdown:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /kt/create
 * Creates a new knowledge transfer record.
 * Prevents duplicate entries for the same date.
 * Optionally stores an uploaded file name if a file is attached.
 */
const postEmpKT = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { K_DATE, K_TOPIC, K_DESCRIPTION, EMP_ID } = req.body;

    // Store uploaded file name if present, otherwise null
    const K_FILE_NAME = req.file ? req.file.filename : null;

    // Prevent duplicate KT entries for the same date
    const checkQuery = `
      SELECT COUNT(*) AS CNT
      FROM KNOWLEDGE_SHARING
      WHERE K_DATE = TO_DATE(:K_DATE, 'DD-MM-YY')
    `;

    const checkResult = await db.executeQuery(checkQuery, { K_DATE }, "siri_db");

    if (checkResult.rows[0].CNT > 0) {
      throw new ApiError(400, "A KT already exists for this date");
    }

    const insertQuery = `
      INSERT INTO KNOWLEDGE_SHARING (
        K_DATE,
        K_TOPIC,
        K_DESCRIPTION,
        K_FILE_NAME,
        EMP_ID
      )
      VALUES (
        TO_DATE(:K_DATE, 'DD-MM-YY'),
        :K_TOPIC,
        :K_DESCRIPTION,
        :K_FILE_NAME,
        :EMP_ID
      )
    `;

    const result = await db.executeQuery(
      insertQuery,
      { K_DATE, K_TOPIC, K_DESCRIPTION, K_FILE_NAME, EMP_ID },
      "siri_db"
    );

    return res.status(201).json(
      new ApiResponse(201, { rowsAffected: result.rowsAffected }, "Knowledge transfer created successfully")
    );
  } catch (err) {
    console.error("Error inserting KT record:", err);
    throw new ApiError(
      err.statusCode || 500,
      err.message || "Error inserting knowledge",
      err.details || err.message
    );
  }
});

/**
 * GET /kt/download/:id
 * Downloads the KT document file associated with a given employee ID.
 * Validates that the ID is numeric, checks the DB for a file record,
 * then verifies the file exists on disk before streaming it.
 */
const downloadKTFile = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { id } = req.params;

  // Validate that the provided ID is a valid number
  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, "Invalid KT ID");
  }

  const result = await db.executeQuery(
    `SELECT K_FILE_NAME FROM KNOWLEDGE_SHARING WHERE EMP_ID = :EMP_ID`,
    { EMP_ID: Number(id) },
    "siri_db"
  );

  if (!result.rows.length) {
    throw new ApiError(404, "File record not found in database");
  }

  let fileName = result.rows[0].K_FILE_NAME?.trim();

  // Ensure the file has a .pdf extension before resolving the path
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    fileName += ".pdf";
  }

  const filePath = path.join(__dirname, "../../../uploads/kt_docs", fileName);

  // Check that the file physically exists on the server before attempting download
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File not found on server");
  }

  res.download(filePath, fileName);
});

module.exports = { getEmpKT, postEmpKT, getEmpKTDropdown, downloadKTFile };