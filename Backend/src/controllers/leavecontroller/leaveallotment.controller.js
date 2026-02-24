const {
  asyncHandler,
  ApiError,
  ApiResponse,
  DatabaseHandler,
} = require("../../utils");
const oracledb = require("oracledb");

/**
 * GET /leave/calendar-year
 * Fetches the currently active calendar year(s) for use in leave allotment dropdowns.
 * Only returns years with STATUS = 'Y'.
 */
const getCalendarYearDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        CAL_YEAR_ID AS "cal_year_id",
        YEAR        AS "year"
      FROM CALENDAR_YEAR
      WHERE STATUS = 'Y'
      ORDER BY YEAR
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Calendar year list fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching calendar year dropdown:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /leave/apply-allotment
 * Allots leave for all active employees for a given calendar year and leave type.
 * Carries forward the previous year's remaining balance and adds the new allotment.
 *
 * Uses a PL/SQL block to:
 *   - Check if leave has already been allotted for the given year and leave type.
 *   - Loop through all WORKING employees and insert EMP_LEAVE_MAST records.
 *   - Carry forward previous year's BAL_LEAVE into the new year's ALLOTED and BAL_LEAVE.
 *   - Returns status (1 = success, 0 = failure) and a message via OUT binds.
 *
 * Note: oracledb is used directly here for BIND_OUT support which DatabaseHandler
 * does not abstract. This is intentional and should not be changed.
 */
const applyLeaveAllotment = asyncHandler(async (req, res) => {
  try {
    const { cal_year_id, leave_id, alloted } = req.body;

    // Validate all required fields are present
    if (cal_year_id == null || leave_id == null || alloted == null) {
      throw new ApiError(400, "Required fields missing: cal_year_id, leave_id, alloted");
    }

    const db = new DatabaseHandler();

    // PL/SQL block handles duplicate check, employee loop, carry-forward, and commit/rollback
    const plsql = `
      DECLARE
        CURSOR emp_cursor IS
          SELECT EMP_ID
          FROM EMP
          WHERE STATUS = 'WORKING';

        v_cal_year_id  NUMBER := :cal_year_id;
        v_prev_year_id NUMBER := :cal_year_id - 1;
        v_leave_id     NUMBER := :leave_id;
        v_alloted      NUMBER := NVL(:alloted, 0);

        v_emp_id       EMP.EMP_ID%TYPE;
        v_prev_bal     NUMBER := 0;

        v_status       NUMBER := 0;
        v_error        VARCHAR2(255);
        v_count        NUMBER;
      BEGIN
        -- Prevent duplicate allotment for the same year and leave type
        SELECT COUNT(*)
        INTO v_count
        FROM EMP_LEAVE_MAST
        WHERE CAL_YEAR_ID = v_cal_year_id
          AND LEAVE_ID    = v_leave_id;

        IF v_count > 0 THEN
          v_error  := 'Leave already allotted for this year';
          v_status := 0;
        ELSE
          OPEN emp_cursor;
          LOOP
            FETCH emp_cursor INTO v_emp_id;
            EXIT WHEN emp_cursor%NOTFOUND;

            -- Fetch previous year's remaining balance; default to 0 if not found
            BEGIN
              SELECT BAL_LEAVE
              INTO v_prev_bal
              FROM EMP_LEAVE_MAST
              WHERE CAL_YEAR_ID = v_prev_year_id
                AND LEAVE_ID    = v_leave_id
                AND EMP_ID      = v_emp_id;
            EXCEPTION
              WHEN NO_DATA_FOUND THEN
                v_prev_bal := 0;
            END;

            -- Insert new year record with carried-forward balance plus new allotment
            INSERT INTO EMP_LEAVE_MAST (
              CAL_YEAR_ID,
              LEAVE_ID,
              ALLOTED,
              BAL_LEAVE,
              EMP_ID,
              USED_LEAVE
            )
            VALUES (
              v_cal_year_id,
              v_leave_id,
              v_prev_bal + v_alloted,
              v_prev_bal + v_alloted,
              v_emp_id,
              0
            );
          END LOOP;

          CLOSE emp_cursor;
          COMMIT;

          v_status := 1;
          v_error  := 'Leave carry-forward completed successfully';
        END IF;

        :status := v_status;
        :error  := v_error;

      EXCEPTION
        WHEN OTHERS THEN
          ROLLBACK;
          :status := 0;
          :error  := SQLERRM;
      END;
    `;

    const binds = {
      cal_year_id: { val: Number(cal_year_id), type: oracledb.NUMBER },
      leave_id: { val: Number(leave_id), type: oracledb.NUMBER },
      alloted: { val: Number(alloted), type: oracledb.NUMBER },
      status: {
        dir: oracledb.BIND_OUT,
        type: oracledb.NUMBER,
      },
      error: {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: 4000,
      },
    };

    const result = await db.executeQuery(plsql, binds, "siri_db");

    // PL/SQL signals failure via status = 0 with an error message in the out bind
    if (result.outBinds.status === 0) {
      throw new ApiError(400, result.outBinds.error);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: result.outBinds.status,
          message: result.outBinds.error,
        },
        "Leave allotment applied successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Leave allotment failed",
      error
    );
  }
});

module.exports = {
  getCalendarYearDropdown,
  applyLeaveAllotment
};