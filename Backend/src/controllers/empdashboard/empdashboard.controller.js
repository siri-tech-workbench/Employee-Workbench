const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * GET /session/info
 * Fetches the current session details for the logged-in user,
 * including login type, device, OS, and location coordinates.
 */
const getSessionInfo = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { user_id, login_id } = req.user;

    const query = `
      SELECT
        U.LOGIN_ID    AS "user_name",
        L.LOGIN_TYPE  AS "logged_from",
        L.DEVICE_TYPE AS "device",
        L.LOGIN_OS    AS "os",
        L.LATTITUDE   AS "latitude",
        L.LONGITUDE   AS "longitude"
      FROM LOGIN_DETAILS L
      JOIN USER_MAST U
        ON U.USER_ID = L.USER_ID
      WHERE L.LOGIN_ID = :login_id
        AND L.USER_ID  = :user_id
    `;

    const result = await db.executeQuery(
      query,
      { login_id, user_id },
      "siri_db"
    );

    if (!result.rows.length) {
      throw new ApiError(404, "Session info not found");
    }

    return res.status(200).json(
      new ApiResponse(200, result.rows[0], "Session info fetched successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Failed to fetch session info", err.message);
  }
});

module.exports = { getSessionInfo };