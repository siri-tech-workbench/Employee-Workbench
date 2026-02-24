const {
  DatabaseHandler,
  ApiError,
  ApiResponse,
  asyncHandler,
} = require("../utils");

/**
 * GET /sub-menu
 * Returns all sub menu items ordered by name.
 *
 * Note: Column names like SUB_MENUE_ITEM_ID, SUB_MENUE_NAME, MENUE_ITEMS_ID
 * reflect the actual database schema spelling and must not be changed.
 */
const getSubMenuData = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        sub_menue_item_id    AS "sub_menue_item_id",
        sub_menue_name       AS "sub_menue_name",
        page_name_navigation AS "page_name_navigation",
        icon                 AS "icon",
        menue_items_id       AS "menue_items_id",
        position             AS "position"
      FROM sub_menue_items
      ORDER BY sub_menue_name
    `;

    const result = await db.executeQuery(query, {}, "siri_db");
    const rows = result.rows || [];

    return res.status(200).json(new ApiResponse(200, rows, "Sub menu list fetched successfully"));
  } catch (err) {
    console.error("Error fetching sub menu data:", err);
    throw new ApiError(500, "Error fetching sub menu data", err.message);
  }
});

/**
 * GET /sub-menu/grid
 * Returns all sub menu items joined with their parent menu item name,
 * for use in the admin data grid view.
 */
const getSubMenuGrid = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        a.sub_menue_item_id    AS "sub_menue_item_id",
        a.sub_menue_name       AS "sub_menue_name",
        a.page_name_navigation AS "page_name_navigation",
        a.icon                 AS "icon",
        a.position             AS "position",
        b.menue_item_name      AS "menue_item_name",
        b.menue_item_id        AS "menue_item_id"
      FROM sub_menue_items a
      JOIN menue_items b ON b.menue_item_id = a.menue_items_id
    `;

    const result = await db.executeQuery(query, {}, "siri_db");
    const rows = result.rows || [];

    return res.status(200).json(new ApiResponse(200, rows, "Sub menu grid fetched successfully"));
  } catch (err) {
    console.error("Error fetching sub menu grid:", err);
    throw new ApiError(500, "Error fetching sub menu grid", err.message);
  }
});

/**
 * GET /sub-menu/menu-items
 * Returns all menu items as a dropdown list (id + name).
 */
const getMenuItemDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        menue_item_name AS "menue_item_name",
        menue_item_id   AS "menue_item_id"
      FROM menue_items
    `;

    const result = await db.executeQuery(query, {}, "siri_db");
    const rows = result.rows || [];

    return res.status(200).json(new ApiResponse(200, rows, "Menu item dropdown fetched successfully"));
  } catch (err) {
    console.error("Error fetching menu item dropdown:", err);
    throw new ApiError(500, "Error fetching menu item dropdown", err.message);
  }
});

/**
 * POST /sub-menu
 * Inserts a new sub menu item.
 * Validates that the position is not already taken within the same parent menu item.
 *
 * @body {string} SUB_MENUE_NAME
 * @body {string} PAGE_NAME_NAVIGATION
 * @body {string} ICON
 * @body {number} MENUE_ITEMS_ID - Parent menu item ID
 * @body {number} POSITION
 */
const postSubMenuItems = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { SUB_MENUE_NAME, PAGE_NAME_NAVIGATION, ICON, MENUE_ITEMS_ID, POSITION } = req.body;

    // Check if the position is already taken within the same parent menu item
    const checkQuery = `
      SELECT COUNT(*) AS CNT
      FROM SUB_MENUE_ITEMS
      WHERE MENUE_ITEMS_ID = :MENUE_ITEMS_ID
        AND POSITION = :POSITION
    `;

    const checkResult = await db.executeQuery(checkQuery, { MENUE_ITEMS_ID, POSITION }, "siri_db");

    // Handle both object-keyed and array-indexed row formats from the DB driver
    const count = checkResult.rows?.[0]?.CNT ?? checkResult.rows?.[0]?.[0] ?? 0;

    if (Number(count) > 0) {
      throw new ApiError(400, "Position already exists for this menu");
    }

    const insertQuery = `
      INSERT INTO SUB_MENUE_ITEMS (
        SUB_MENUE_NAME,
        PAGE_NAME_NAVIGATION,
        ICON,
        MENUE_ITEMS_ID,
        POSITION
      ) VALUES (
        :SUB_MENUE_NAME,
        :PAGE_NAME_NAVIGATION,
        :ICON,
        :MENUE_ITEMS_ID,
        :POSITION
      )
    `;

    const result = await db.executeQuery(insertQuery, {
      SUB_MENUE_NAME,
      PAGE_NAME_NAVIGATION,
      ICON,
      MENUE_ITEMS_ID,
      POSITION,
    }, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, { rowsAffected: result.rowsAffected }, "Sub menu inserted successfully")
    );
  } catch (err) {
    console.error("Error inserting sub menu:", err);

    // Re-throw known ApiErrors (e.g. 400 position check) without wrapping them
    if (err instanceof ApiError) throw err;

    // Handle Oracle unique constraint violation as a user-facing 400
    if (err.message?.includes("ORA-00001")) {
      throw new ApiError(400, "Position already exists for this menu");
    }

    throw new ApiError(err.statusCode || 500, err.message || "Error inserting sub menu");
  }
});

/**
 * PUT /sub-menu/:id
 * Updates an existing sub menu item by SUB_MENUE_ITEM_ID.
 * Validates that no other sub menu with the same name, parent, and position exists.
 * Returns 404 if no matching record is found.
 *
 * @param {number} id - SUB_MENUE_ITEM_ID from route params
 * @body {string} SUB_MENUE_NAME
 * @body {string} PAGE_NAME_NAVIGATION
 * @body {string} ICON
 * @body {number} MENUE_ITEMS_ID
 * @body {number} POSITION
 */
const updateSubMenuItems = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const ID = req.params.id;

    if (!ID) {
      throw new ApiError(400, "ID is required");
    }

    const { SUB_MENUE_NAME, PAGE_NAME_NAVIGATION, ICON, MENUE_ITEMS_ID, POSITION } = req.body;

    // Check for a duplicate sub menu with same name, parent, and position (excluding current record)
    const checkQuery = `
      SELECT COUNT(*) AS COUNT
      FROM SUB_MENUE_ITEMS
      WHERE SUB_MENUE_NAME   = :SUB_MENUE_NAME
        AND MENUE_ITEMS_ID   = :MENUE_ITEMS_ID
        AND POSITION         = :POSITION
        AND SUB_MENUE_ITEM_ID != :ID
    `;

    const checkResult = await db.executeQuery(checkQuery, {
      SUB_MENUE_NAME,
      MENUE_ITEMS_ID,
      POSITION,
      ID,
    }, "siri_db");

    if (checkResult.rows[0].COUNT > 0) {
      throw new ApiError(400, "Sub menu already exists with the same menu and position");
    }

    const updateQuery = `
      UPDATE SUB_MENUE_ITEMS
      SET
        SUB_MENUE_NAME       = :SUB_MENUE_NAME,
        PAGE_NAME_NAVIGATION = :PAGE_NAME_NAVIGATION,
        ICON                 = :ICON,
        MENUE_ITEMS_ID       = :MENUE_ITEMS_ID,
        POSITION             = :POSITION
      WHERE SUB_MENUE_ITEM_ID = :ID
    `;

    const result = await db.executeQuery(updateQuery, {
      ID,
      SUB_MENUE_NAME,
      PAGE_NAME_NAVIGATION,
      ICON,
      MENUE_ITEMS_ID,
      POSITION,
    }, "siri_db");

    if (result.rowsAffected === 0) {
      throw new ApiError(404, "Sub menu not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Sub menu updated successfully")
    );
  } catch (err) {
    console.error("Error updating sub menu:", err);

    // Re-throw known ApiErrors (e.g. 400, 404) without wrapping them
    if (err instanceof ApiError) throw err;

    throw new ApiError(500, "Error updating sub menu", err.message);
  }
});

/**
 * DELETE /sub-menu/:id
 * Deletes a sub menu item by SUB_MENUE_ITEM_ID.
 * Returns 400 if the ID is not a valid number.
 * Returns 404 if no matching record is found.
 *
 * @param {number} id - SUB_MENUE_ITEM_ID from route params
 */
const deleteSubMenuItems = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const ID = Number(req.params.id);

    if (isNaN(ID)) {
      throw new ApiError(400, "Invalid ID");
    }

    const deleteQuery = `
      DELETE FROM SUB_MENUE_ITEMS
      WHERE SUB_MENUE_ITEM_ID = :ID
    `;

    const result = await db.executeQuery(deleteQuery, { ID }, "siri_db");

    if (result.rowsAffected === 0) {
      throw new ApiError(404, "Sub menu not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Sub menu deleted successfully")
    );
  } catch (err) {
    console.error("Error deleting sub menu:", err);

    // Re-throw known ApiErrors (e.g. 400, 404) without wrapping them
    if (err instanceof ApiError) throw err;

    throw new ApiError(500, "Error deleting sub menu", err.message);
  }
});

module.exports = {
  getSubMenuData,
  getSubMenuGrid,
  getMenuItemDropdown,
  postSubMenuItems,
  updateSubMenuItems,
  deleteSubMenuItems,
};