const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * GET /holiday/list
 * Fetches all holidays for the currently active calendar year (STATUS = 'Y'),
 * ordered by holiday date ascending.
 */
const getHolidayList = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT
        h.HOLIDAY_ID                          AS "holiday_id",
        TO_CHAR(h.HOLIDAY_DATE, 'YYYY-MM-DD') AS "holiday_date",
        h.CAL_YEAR_ID                         AS "cal_year_id",
        h.TITLE                               AS "title"
      FROM HOLIDAYS h
      JOIN CALENDAR_YEAR c
        ON h.CAL_YEAR_ID = c.CAL_YEAR_ID
      WHERE c.STATUS = 'Y'
      ORDER BY h.HOLIDAY_DATE
    `;

        const result = await db.executeQuery(query, {}, "siri_db");

        return res.status(200).json(
            new ApiResponse(200, result.rows, "Holiday list fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching holiday list:", error);
        throw new ApiError(500, "Internal server error");
    }
});

module.exports = { getHolidayList };