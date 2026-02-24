const {
    asyncHandler,
    ApiError,
    ApiResponse,
    DatabaseHandler,
} = require("../utils");

/**
 * GET /group-master
 * Returns all user groups ordered alphabetically by group name.
 */
const getGroupMaster = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT GROUP_ID, GROUP_NAME
      FROM user_group_master
      ORDER BY GROUP_NAME
    `;

        const result = await db.executeQuery(query, {}, "siri_db");
        const rows = result.rows || [];

        return res.status(200).json(new ApiResponse(200, rows, "Group list fetched successfully"));
    } catch (err) {
        throw new ApiError(500, "Error fetching group list", err.message);
    }
});

/**
 * POST /group-master
 * Inserts a new user group with the given name.
 *
 * @body {string} GROUP_NAME - Name of the group to create
 */
const postGroupMaster = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { GROUP_NAME } = req.body;

        const query = `
      INSERT INTO user_group_master (GROUP_NAME)
      VALUES (:GROUP_NAME)
    `;

        const result = await db.executeQuery(query, { GROUP_NAME }, "siri_db");

        return res.status(200).json(
            new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Group added successfully")
        );
    } catch (err) {
        throw new ApiError(500, "Error inserting group", err.message);
    }
});

/**
 * DELETE /group-master/:id
 * Deletes a user group by GROUP_ID.
 * Returns 404 if no matching group is found.
 *
 * @param {number} id - GROUP_ID from route params
 */
const deleteGroupMaster = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const GROUP_ID = req.params.id;

        const query = `
      DELETE FROM user_group_master
      WHERE GROUP_ID = :GROUP_ID
    `;

        const result = await db.executeQuery(query, { GROUP_ID }, "siri_db");

        if (result.rowsAffected === 0) {
            return res.status(404).json(new ApiResponse(404, {}, "Group not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Group deleted successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error deleting group", error.message);
    }
});

/**
 * PUT /group-master/:id
 * Updates the name of an existing user group by GROUP_ID.
 * Returns 404 if no matching group is found.
 *
 * @param {number} id - GROUP_ID from route params
 * @body {string} GROUP_NAME - New name for the group
 */
const updateGroupMaster = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const GROUP_ID = req.params.id;
        const { GROUP_NAME } = req.body;

        const query = `
      UPDATE user_group_master
      SET GROUP_NAME = :GROUP_NAME
      WHERE GROUP_ID = :GROUP_ID
    `;

        const result = await db.executeQuery(query, { GROUP_NAME, GROUP_ID }, "siri_db");

        if (result.rowsAffected === 0) {
            return res.status(404).json(new ApiResponse(404, {}, "Group not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, { rowsAffected: result.rowsAffected }, "Group updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error updating group", error.message);
    }
});

module.exports = {
    getGroupMaster,
    postGroupMaster,
    deleteGroupMaster,
    updateGroupMaster,
};