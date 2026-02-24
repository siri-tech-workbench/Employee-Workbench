const {
    DatabaseHandler,
    ApiError,
    ApiResponse,
    asyncHandler,
} = require("../utils");

/**
 * GET /drag-and-drop/users
 * Returns all users from USER_MAST as a dropdown list, ordered by login ID.
 */
const getDragAndDropUsers = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT USER_ID, LOGIN_ID
      FROM user_mast
      ORDER BY LOGIN_ID
    `;

        const result = await db.executeQuery(query, {}, "siri_db");

        res.status(200).json(
            new ApiResponse(200, result.rows || [], "Users list fetched successfully")
        );
    } catch (err) {
        throw new ApiError(500, "Error fetching users list", err.message);
    }
});

/**
 * GET /drag-and-drop/actions
 * Returns all allowed actions from ALLOWED_ACTIONS, ordered by action name.
 */
const getDragAndDropUserActions = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT ACTION, ACTION_NAME
      FROM allowed_actions
      ORDER BY ACTION_NAME
    `;

        const result = await db.executeQuery(query, {}, "siri_db");

        res.status(200).json(
            new ApiResponse(200, result.rows || [], "Actions fetched successfully")
        );
    } catch (err) {
        throw new ApiError(500, "Error fetching actions", err.message);
    }
});

/**
 * POST /drag-and-drop/users
 * Upserts user menu access permissions.
 * Accepts a single row object or an array of rows.
 *
 * For each row: deletes any existing access record matching the user and menu level,
 * then inserts the new access record. NULL-safe DELETE is handled via dynamic SQL
 * since Oracle does not allow bind params for IS NULL conditions.
 *
 * @body {object|object[]} rows - Permission row(s) containing menu IDs, action ID, and user ID
 */
const postDragAndDropUsers = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        // Normalises a field value to a number or null — handles undefined, empty string, and "null" string
        const normalize = (v) =>
            v === undefined || v === null || v === "null" || v === "" ? null : Number(v);

        // Accept both single object and array payloads
        const rows = Array.isArray(req.body) ? req.body : [req.body];

        for (const row of rows) {
            const MODULE_MENU_ID = normalize(row.MODULE_MENU_ID);
            const MAIN_MENU_ID = normalize(row.MAIN_MENU_ID);
            const MENU_ITEM_ID = normalize(row.MENU_ITEM_ID);
            const SUB_MENU_ITEM_ID = normalize(row.SUB_MENU_ITEM_ID);
            const ACTION_ID = normalize(row.ACTION_ID);
            const USER_ID = normalize(row.USER_ID);

            // Delete existing access record for this user and menu path before re-inserting.
            // NULL columns use IS NULL in the WHERE clause (bind params cannot represent IS NULL in Oracle).
            const deleteQuery = `
        DELETE FROM user_menu_access
        WHERE USER_ID = :USER_ID
          AND ${MODULE_MENU_ID === null ? "MODULE_MENU_ID IS NULL" : "MODULE_MENU_ID = :MODULE_MENU_ID"}
          AND ${MAIN_MENU_ID === null ? "MAIN_MENU_ID IS NULL" : "MAIN_MENU_ID = :MAIN_MENU_ID"}
          AND ${MENU_ITEM_ID === null ? "MENU_ITEM_ID IS NULL" : "MENU_ITEM_ID = :MENU_ITEM_ID"}
          AND ${SUB_MENU_ITEM_ID === null ? "SUB_MENU_ITEM_ID IS NULL" : "SUB_MENU_ITEM_ID = :SUB_MENU_ITEM_ID"}
      `;

            const deleteParams = {
                USER_ID,
                ...(MODULE_MENU_ID !== null && { MODULE_MENU_ID }),
                ...(MAIN_MENU_ID !== null && { MAIN_MENU_ID }),
                ...(MENU_ITEM_ID !== null && { MENU_ITEM_ID }),
                ...(SUB_MENU_ITEM_ID !== null && { SUB_MENU_ITEM_ID }),
            };

            await db.executeQuery(deleteQuery, deleteParams, "siri_db");

            // Insert the new access record with the updated action
            const insertQuery = `
        INSERT INTO user_menu_access (
          MODULE_MENU_ID, MAIN_MENU_ID, MENU_ITEM_ID, SUB_MENU_ITEM_ID,
          ACTION_ID, USER_ID
        ) VALUES (
          :MODULE_MENU_ID, :MAIN_MENU_ID, :MENU_ITEM_ID, :SUB_MENU_ITEM_ID,
          :ACTION_ID, :USER_ID
        )
      `;

            await db.executeQuery(
                insertQuery,
                { MODULE_MENU_ID, MAIN_MENU_ID, MENU_ITEM_ID, SUB_MENU_ITEM_ID, ACTION_ID, USER_ID },
                "siri_db"
            );
        }

        res.status(200).json(new ApiResponse(200, {}, "Permissions updated successfully"));
    } catch (err) {
        throw new ApiError(500, "Upsert error", err.message);
    }
});

/**
 * DELETE /drag-and-drop/users
 * Deletes user menu access records at a specified menu hierarchy level.
 *
 * @body {string} level - One of: "module" | "main" | "item" | "sub"
 * @body {number} USER_ID
 * @body {number} [MODULE_MENU_ID] - Required for level: module, main, item, sub
 * @body {number} [MAIN_MENU_ID]   - Required for level: main, item, sub
 * @body {number} [MENU_ITEM_ID]   - Required for level: item, sub
 * @body {number} [SUB_MENU_ITEM_ID] - Required for level: sub
 */
const deleteDragAndDropUsers = asyncHandler(async (req, res) => {
    const { level, MODULE_MENU_ID, MAIN_MENU_ID, MENU_ITEM_ID, SUB_MENU_ITEM_ID, USER_ID } = req.body;

    if (!level || !USER_ID) {
        throw new ApiError(400, "Missing required fields: level or USER_ID");
    }

    try {
        const db = new DatabaseHandler();

        // Base DELETE — additional WHERE clauses are appended based on the requested level
        let query = `
      DELETE FROM user_menu_access
      WHERE USER_ID = :USER_ID
    `;

        const params = { USER_ID };

        // Each case adds progressively more specific WHERE conditions down the menu hierarchy
        switch (level) {
            case "module":
                query += ` AND MODULE_MENU_ID = :MODULE_MENU_ID`;
                params.MODULE_MENU_ID = MODULE_MENU_ID;
                break;

            case "main":
                query += `
          AND MODULE_MENU_ID = :MODULE_MENU_ID
          AND MAIN_MENU_ID   = :MAIN_MENU_ID
        `;
                params.MODULE_MENU_ID = MODULE_MENU_ID;
                params.MAIN_MENU_ID = MAIN_MENU_ID;
                break;

            case "item":
                query += `
          AND MODULE_MENU_ID = :MODULE_MENU_ID
          AND MAIN_MENU_ID   = :MAIN_MENU_ID
          AND MENU_ITEM_ID   = :MENU_ITEM_ID
        `;
                params.MODULE_MENU_ID = MODULE_MENU_ID;
                params.MAIN_MENU_ID = MAIN_MENU_ID;
                params.MENU_ITEM_ID = MENU_ITEM_ID;
                break;

            case "sub":
                query += `
          AND MODULE_MENU_ID   = :MODULE_MENU_ID
          AND MAIN_MENU_ID     = :MAIN_MENU_ID
          AND MENU_ITEM_ID     = :MENU_ITEM_ID
          AND SUB_MENU_ITEM_ID = :SUB_MENU_ITEM_ID
        `;
                params.MODULE_MENU_ID = MODULE_MENU_ID;
                params.MAIN_MENU_ID = MAIN_MENU_ID;
                params.MENU_ITEM_ID = MENU_ITEM_ID;
                params.SUB_MENU_ITEM_ID = SUB_MENU_ITEM_ID;
                break;

            default:
                throw new ApiError(400, "Invalid level provided");
        }

        const result = await db.executeQuery(query, params, "siri_db");

        res.status(200).json(
            new ApiResponse(200, result, `${level} permission(s) deleted successfully`)
        );
    } catch (err) {
        throw new ApiError(500, "Error deleting menu access", err.message);
    }
});

/**
 * GET /drag-and-drop/group/:group_id
 * Returns all users belonging to a specific group, ordered by login ID.
 *
 * @param {number} group_id - Group ID from route params
 */
const getUsersByGroupId = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { group_id } = req.params;

        const query = `
      SELECT USER_ID, LOGIN_ID
      FROM USER_MAST
      WHERE GROUP_ID = :GROUP_ID
      ORDER BY LOGIN_ID
    `;

        const result = await db.executeQuery(query, { group_id: Number(group_id) }, "siri_db");

        res.status(200).json(
            new ApiResponse(200, result.rows || [], "Users list fetched successfully")
        );
    } catch (err) {
        throw new ApiError(500, "Error fetching users list", err.message);
    }
});

module.exports = {
    getDragAndDropUsers,
    getDragAndDropUserActions,
    postDragAndDropUsers,
    deleteDragAndDropUsers,
    getUsersByGroupId,
};