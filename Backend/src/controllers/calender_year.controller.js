const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../utils");

/**
 * GET /calendar
 * Returns all calendar years with human-readable status and posted labels.
 * 'Y' is displayed as 'ACTIVE', anything else as 'INACTIVE'.
 */
const getCalendar = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        cal_year_id AS "cal_year_id",
        year        AS "year",
        CASE status WHEN 'Y' THEN 'ACTIVE' ELSE 'INACTIVE' END AS "status",
        CASE posted WHEN 'Y' THEN 'ACTIVE' ELSE 'INACTIVE' END AS "posted"
      FROM calendar_year
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result?.rows));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /calendar
 * Inserts a new calendar year record.
 *
 * @body {number} year
 * @body {string} posted - 'Y' or 'N'
 * @body {string} status - 'Y' or 'N'
 */
const insertCalendar = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { year, posted, status } = req.body;

    const data = {
      YEAR: year,
      POSTED: posted,
      STATUS: status,
    };

    const query = `
      INSERT INTO CALENDAR_YEAR
        (YEAR, POSTED, STATUS)
      VALUES
        (:YEAR, :POSTED, :STATUS)
    `;

    await db.executeQuery(query, data, "siri_db");

    return res.status(200).json(new ApiResponse(200, "Calendar inserted successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Insert failed",
      error
    );
  }
});

/**
 * PUT /calendar/:id
 * Updates an existing calendar year record by CAL_YEAR_ID.
 *
 * @param {number} id - Calendar year ID from route params
 * @body {number} year
 * @body {string} posted - 'Y' or 'N'
 * @body {string} status - 'Y' or 'N'
 */
const updateCalendar = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { id } = req.params;
    const { year, posted, status } = req.body;

    const data = {
      CAL_YEAR_ID: id,
      YEAR: year,
      POSTED: posted,
      STATUS: status,
    };

    const query = `
      UPDATE CALENDAR_YEAR
      SET
        YEAR   = :YEAR,
        POSTED = :POSTED,
        STATUS = :STATUS
      WHERE CAL_YEAR_ID = :CAL_YEAR_ID
    `;

    await db.executeQuery(query, data, "siri_db");

    return res.status(200).json(new ApiResponse(200, "Calendar updated successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Update failed",
      error
    );
  }
});

module.exports = { getCalendar, insertCalendar, updateCalendar };