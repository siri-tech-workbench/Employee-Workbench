const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * POST /auth/logout
 * Logs out the currently authenticated employee by recording the logout time,
 * calculating total work duration (HH:MM:SS) since login, and clearing the auth token.
 *
 * Work duration is computed in Oracle using SYSDATE minus the stored login_time,
 * formatted as HH:MM:SS using LPAD and FLOOR to pad each time component.
 */
const logout = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { login_id } = req.user;

    // Update logout time, calculate work duration, and invalidate the auth token
    const query = `
      UPDATE login_details
      SET
        logout_time = TO_CHAR(SYSDATE, 'HH:MI:SS AM'),

        -- Calculate HH:MM:SS duration between login_time and now
        work_duration =
          LPAD(
            FLOOR(
              (SYSDATE - TO_DATE(TO_CHAR(SYSDATE, 'YYYY-MM-DD') || ' ' || login_time, 'YYYY-MM-DD HH:MI:SS AM')) * 24
            ), 2, '0'
          ) || ':' ||
          LPAD(
            FLOOR(
              MOD(
                (SYSDATE - TO_DATE(TO_CHAR(SYSDATE, 'YYYY-MM-DD') || ' ' || login_time, 'YYYY-MM-DD HH:MI:SS AM')) * 24 * 60,
                60
              )
            ), 2, '0'
          ) || ':' ||
          LPAD(
            FLOOR(
              MOD(
                (SYSDATE - TO_DATE(TO_CHAR(SYSDATE, 'YYYY-MM-DD') || ' ' || login_time, 'YYYY-MM-DD HH:MI:SS AM')) * 24 * 60 * 60,
                60
              )
            ), 2, '0'
          ),

        auth = NULL

      WHERE login_id = :login_id
    `;

    await db.executeQuery(query, { login_id }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, null, "Logged out successfully")
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Logout failed",
      error
    );
  }
});

module.exports = { logout };