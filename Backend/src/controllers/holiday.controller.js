const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../utils");

/**
 * GET /holiday/years
 * Returns all calendar years as a dropdown list (id + year).
 */
const getYearDropdown = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT
        cal_year_id AS "cal_year_id",
        year        AS "year"
      FROM calendar_year
    `;

        const result = await db.executeQuery(query, {}, "siri_db");

        return res.status(200).json(new ApiResponse(200, result?.rows));
    } catch (error) {
        throw new ApiError(500, "Internal server error");
    }
});

/**
 * GET /holiday
 * Returns all holidays belonging to the currently active calendar year.
 * Active year is determined by CALENDAR_YEAR.status = 'Y'.
 * Results are ordered by holiday date ascending.
 */
const getHolidayList = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();

        const query = `
      SELECT
        h.holiday_id   AS "holiday_id",
        h.holiday_date AS "holiday_date",
        h.cal_year_id  AS "cal_year_id",
        h.title        AS "title"
      FROM holidays h
      JOIN calendar_year c ON c.cal_year_id = h.cal_year_id
      WHERE c.status = 'Y'
      ORDER BY h.holiday_date
    `;

        const result = await db.executeQuery(query, {}, "siri_db");

        return res.status(200).json(new ApiResponse(200, result?.rows));
    } catch (error) {
        throw new ApiError(500, "Internal server error");
    }
});

/**
 * POST /holiday
 * Inserts a new holiday record.
 *
 * @body {string} holiday_date - ISO date string
 * @body {number} cal_year_id
 * @body {string} title - Holiday name/description
 */
const insertHoliday = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { holiday_date, cal_year_id, title } = req.body;

        const query = `
      INSERT INTO HOLIDAYS
        (HOLIDAY_DATE, CAL_YEAR_ID, TITLE)
      VALUES
        (:HOLIDAY_DATE, :CAL_YEAR_ID, :TITLE)
    `;

        const data = {
            HOLIDAY_DATE: new Date(holiday_date),
            CAL_YEAR_ID: cal_year_id,
            TITLE: title,
        };

        await db.executeQuery(query, data, "siri_db");

        return res.status(200).json(new ApiResponse(200, "Holiday inserted successfully"));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Insert failed",
            error
        );
    }
});

/**
 * PUT /holiday/:id
 * Updates an existing holiday record by HOLIDAY_ID.
 *
 * @param {number} id - HOLIDAY_ID from route params
 * @body {string} holiday_date - ISO date string
 * @body {number} cal_year_id
 * @body {string} title - Holiday name/description
 */
const updateHoliday = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { id } = req.params;
        const { holiday_date, cal_year_id, title } = req.body;

        const query = `
      UPDATE HOLIDAYS
      SET
        HOLIDAY_DATE = :HOLIDAY_DATE,
        CAL_YEAR_ID  = :CAL_YEAR_ID,
        TITLE        = :TITLE
      WHERE HOLIDAY_ID = :HOLIDAY_ID
    `;

        const data = {
            HOLIDAY_ID: id,
            HOLIDAY_DATE: new Date(holiday_date),
            CAL_YEAR_ID: cal_year_id,
            TITLE: title,
        };

        await db.executeQuery(query, data, "siri_db");

        return res.status(200).json(new ApiResponse(200, "Holiday updated successfully"));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Update failed",
            error
        );
    }
});

/**
 * DELETE /holiday/:id
 * Deletes a holiday record by HOLIDAY_ID.
 * Returns 404 if no matching holiday is found.
 *
 * @param {number} id - HOLIDAY_ID from route params
 */
const deleteHoliday = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const { id } = req.params;

        const query = `
      DELETE FROM HOLIDAYS
      WHERE HOLIDAY_ID = :HOLIDAY_ID
    `;

        const result = await db.executeQuery(query, { HOLIDAY_ID: id }, "siri_db");

        // Return 404 if no row was deleted — prevents silent failure on invalid IDs
        if (result.rowsAffected === 0) {
            return res.status(404).json(new ApiResponse(404, {}, "Holiday not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Holiday deleted successfully"));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Delete failed",
            error
        );
    }
});

module.exports = {
    getYearDropdown,
    getHolidayList,
    insertHoliday,
    updateHoliday,
    deleteHoliday,
};