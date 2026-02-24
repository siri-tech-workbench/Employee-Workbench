const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../utils");

/**
 * GET /main-menu/modules
 * Returns all module menus as a dropdown list (id + name).
 */
const getMainMenusSelectModuleDD = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        module_menu_id AS "module_menu_id",
        module_name    AS "module_name"
      FROM module_menu
    `;

    const result = await db.executeQuery(query, {}, "siri_db");
    const rows = result.rows || [];

    return res.status(200).json(new ApiResponse(200, rows, "Module menu fetched successfully"));
  } catch (err) {
    console.error("Error fetching module menu:", err);
    throw new ApiError(500, "Error fetching module menu", err.message);
  }
});

/**
 * GET /main-menu
 * Returns all main menus with their parent module name, ordered by position ascending.
 */
const getAllMainMenus = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        a.main_menu_id          AS "main_menu_id",
        a.main_menu_name        AS "main_menu_name",
        a.icon                  AS "icon",
        a.module_menu_id        AS "module_menu_id",
        a.page_name_navigation  AS "page_name_navigation",
        a.position              AS "position",
        b.module_name           AS "module_name"
      FROM main_menu a
      JOIN module_menu b ON b.module_menu_id = a.module_menu_id
      ORDER BY a.position ASC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");
    const rows = result.rows || [];

    return res.status(200).json(new ApiResponse(200, rows, "Main menu fetched successfully"));
  } catch (err) {
    console.error("Error fetching main menu:", err);
    throw new ApiError(500, "Error fetching main menu", err.message);
  }
});

/**
 * POST /main-menu
 * Inserts a new main menu entry.
 * Validates that the given position is not already taken before inserting.
 *
 * @body {string} main_menu_name
 * @body {string} icon
 * @body {number} module_menu_id
 * @body {string} page_name_navigation
 * @body {number} position
 */
const postMainMenus = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { main_menu_name, icon, module_menu_id, page_name_navigation, position } = req.body;

    // Check if the requested position is already occupied by another menu item
    const checkQuery = `
      SELECT COUNT(*) AS count
      FROM main_menu
      WHERE position = :position
    `;

    const checkResult = await db.executeQuery(checkQuery, { position }, "siri_db");

    if (checkResult.rows[0].COUNT > 0) {
      throw new ApiError(400, "Position already exists");
    }

    // Insert the new main menu entry
    const insertQuery = `
      INSERT INTO main_menu (
        main_menu_name,
        icon,
        module_menu_id,
        page_name_navigation,
        position
      ) VALUES (
        :main_menu_name,
        :icon,
        :module_menu_id,
        :page_name_navigation,
        :position
      )
    `;

    const result = await db.executeQuery(insertQuery, {
      main_menu_name,
      icon,
      module_menu_id,
      page_name_navigation,
      position,
    }, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, { rowsAffected: result.rowsAffected }, "Main menu inserted successfully")
    );
  } catch (err) {
    console.error("Error inserting main menu:", err);
    throw new ApiError(
      err.statusCode || 500,
      err.message || "Error inserting main menu",
      err.details || err.message
    );
  }
});

/**
 * PUT /main-menu/:main_menu_id
 * Updates an existing main menu entry by main_menu_id.
 * Returns 404 if no matching record is found.
 *
 * @param {number} main_menu_id - from route params
 * @body {string} main_menu_name
 * @body {string} icon
 * @body {number} module_menu_id
 * @body {string} page_name_navigation
 * @body {number} position
 */
const updateMainMenus = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { main_menu_id } = req.params;
    const { main_menu_name, icon, module_menu_id, page_name_navigation, position } = req.body;

    const query = `
      UPDATE main_menu
      SET
        main_menu_name       = :main_menu_name,
        icon                 = :icon,
        module_menu_id       = :module_menu_id,
        page_name_navigation = :page_name_navigation,
        position             = :position
      WHERE main_menu_id = :main_menu_id
    `;

    const result = await db.executeQuery(query, {
      main_menu_id,
      main_menu_name,
      icon,
      module_menu_id,
      page_name_navigation,
      position,
    }, "siri_db");

    if (result.rowsAffected === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "Main menu not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Main menu updated successfully")
    );
  } catch (err) {
    console.error("Error updating main menu:", err);
    throw new ApiError(500, "Error updating main menu", err.message);
  }
});

/**
 * DELETE /main-menu/:main_menu_id
 * Deletes a main menu entry by main_menu_id.
 * Returns 404 if no matching record is found.
 *
 * @param {number} main_menu_id - from route params
 */
const deleteMainMenus = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { main_menu_id } = req.params;

    const query = `
      DELETE FROM main_menu
      WHERE main_menu_id = :main_menu_id
    `;

    const result = await db.executeQuery(query, { main_menu_id }, "siri_db");

    if (result.rowsAffected === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "Main menu not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Main menu deleted successfully")
    );
  } catch (err) {
    console.error("Error deleting main menu:", err);
    throw new ApiError(500, "Error deleting main menu", err.message);
  }
});

module.exports = {
  getMainMenusSelectModuleDD,
  getAllMainMenus,
  postMainMenus,
  updateMainMenus,
  deleteMainMenus,
};