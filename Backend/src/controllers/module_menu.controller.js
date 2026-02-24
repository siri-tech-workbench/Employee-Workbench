const { DatabaseHandler, ApiError, ApiResponse, asyncHandler } = require("../utils");

/**
 * GET /module
 * Returns all module menu entries (id, name, icon).
 */
const getModules = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT
        module_menu_id AS "module_menu_id",
        module_name    AS "module_name",
        icon           AS "icon"
      FROM module_menu
    `;

        const result = await db.executeQuery(query, {}, "siri_db");
        const rows = result.rows || [];

        return res.status(200).json(new ApiResponse(200, rows, "Modules fetched successfully"));
    } catch (err) {
        throw new ApiError(500, "Error fetching modules", err.message);
    }
});

/**
 * POST /module
 * Inserts a new module menu entry.
 *
 * @body {string} module_name
 * @body {string} icon
 */
const insertModule = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { module_name, icon } = req.body;

        const data = {
            MODULE_NAME: module_name ?? null,
            ICON: icon ?? null,
        };

        const query = `
      INSERT INTO MODULE_MENU
        (MODULE_NAME, ICON)
      VALUES
        (:MODULE_NAME, :ICON)
    `;

        await db.executeQuery(query, data, "siri_db");

        return res.status(200).json(new ApiResponse(200, { module_name }, "Module inserted successfully"));
    } catch (err) {
        throw new ApiError(500, "Error inserting module", err.message);
    }
});

/**
 * PUT /module/:id
 * Updates an existing module menu entry by MODULE_MENU_ID.
 * Returns 404 if no matching record is found.
 *
 * @param {number} id - MODULE_MENU_ID from route params
 * @body {string} module_name
 * @body {string} icon
 */
const updateModule = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { id } = req.params;
        const { module_name, icon } = req.body;

        const data = {
            MODULE_MENU_ID: id,
            MODULE_NAME: module_name ?? null,
            ICON: icon ?? null,
        };

        const query = `
      UPDATE MODULE_MENU
      SET
        MODULE_NAME    = :MODULE_NAME,
        ICON           = :ICON
      WHERE MODULE_MENU_ID = :MODULE_MENU_ID
    `;

        const result = await db.executeQuery(query, data, "siri_db");

        if (result.rowsAffected === 0) {
            throw new ApiError(404, `Module ID ${id} not found`);
        }

        return res.status(200).json(new ApiResponse(200, { id, module_name }, "Module updated successfully"));
    } catch (err) {
        // Re-throw known ApiErrors (e.g. 404) without wrapping them
        if (err instanceof ApiError) throw err;

        throw new ApiError(500, "Error updating module", err.message);
    }
});

/**
 * DELETE /module/:id
 * Deletes a module menu entry by MODULE_MENU_ID.
 * Returns 404 if no matching record is found.
 *
 * @param {number} id - MODULE_MENU_ID from route params
 */
const deleteModule = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { id } = req.params;

        const query = `
      DELETE FROM MODULE_MENU
      WHERE MODULE_MENU_ID = :id
    `;

        const result = await db.executeQuery(query, { id }, "siri_db");

        if (result.rowsAffected === 0) {
            throw new ApiError(404, "Module not found");
        }

        return res.status(200).json(new ApiResponse(200, { id }, "Module deleted successfully"));
    } catch (err) {
        // Re-throw known ApiErrors (e.g. 404) without wrapping them
        if (err instanceof ApiError) throw err;

        throw new ApiError(500, "Error deleting module", err.message);
    }
});

module.exports = {
    getModules,
    insertModule,
    updateModule,
    deleteModule,
};