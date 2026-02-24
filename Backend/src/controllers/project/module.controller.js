const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * POST /module/create
 * Inserts a new module record with the provided module name.
 */
const insertModule = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { MODULE_NAME } = req.body;

    const query = `
      INSERT INTO MODULE (MODULE_NAME)
      VALUES (:MODULE_NAME)
    `;

    await db.executeQuery(query, { MODULE_NAME }, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, null, "Module created successfully")
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Insert failed",
      error
    );
  }
});

/**
 * GET /module/list
 * Fetches all module records ordered by module ID descending.
 */
const getModules = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        MODULE_ID   AS "module_id",
        MODULE_NAME AS "module_name"
      FROM MODULE
      ORDER BY MODULE_ID DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Modules fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * PUT /module/:id
 * Updates the name of an existing module by ID.
 * Returns 404 if no module is found for the given ID.
 */
const updateModule = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { id } = req.params;
    const { MODULE_NAME } = req.body;

    if (!MODULE_NAME) {
      throw new ApiError(400, "Module name is required");
    }

    const query = `
      UPDATE MODULE
      SET MODULE_NAME = :MODULE_NAME
      WHERE MODULE_ID = :MODULE_ID
    `;

    const result = await db.executeQuery(
      query,
      { MODULE_NAME, MODULE_ID: id },
      "siri_db"
    );

    if (result.rowsAffected === 0) {
      throw new ApiError(404, "Module not found");
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Module updated successfully")
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Update failed",
      error
    );
  }
});

module.exports = { insertModule, getModules, updateModule };