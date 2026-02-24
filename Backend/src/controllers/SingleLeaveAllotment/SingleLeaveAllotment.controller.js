const {
  asyncHandler,
  ApiError,
  ApiResponse,
  DatabaseHandler,
} = require("../../utils");
const oracledb = require("oracledb");

/**
 * GET /leave-allotment/employees
 * Returns employee dropdown list filtered to the currently active calendar year.
 * Active year is determined by CALENDAR_YEAR.status = 'Y'.
 */
const getEmployeeDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT e.emp_id,
             e.name
      FROM emp e
      WHERE EXTRACT(YEAR FROM e.doj) = (
        SELECT year
        FROM calendar_year
        WHERE status = 'Y'
      )
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Employee dropdown list fetched")
    );
  } catch (error) {
    console.error("Get employee dropdown error:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /leave-allotment/grid
 * Returns the leave allotment grid for all employees in the latest calendar year.
 * Pivots leave types (CL, EL, ML) into columns using conditional aggregation.
 *
 * Leave ID mapping: 1 = Casual Leave (CL), 2 = Medical Leave (ML), 3 = Earned Leave (EL)
 */
const getEmployeeLeaveGrid = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    // Fetch the most recent calendar year ID from the leave master
    const yearResult = await db.executeQuery(
      `SELECT MAX(CAL_YEAR_ID) AS CAL_YEAR_ID FROM EMP_LEAVE_MAST`,
      {},
      "siri_db"
    );

    const CAL_YEAR_ID = yearResult.rows[0].CAL_YEAR_ID;

    if (!CAL_YEAR_ID) {
      throw new ApiError(404, "No calendar year data found");
    }

    const query = `
      SELECT
        e.EMP_ID,
        e.NAME        AS EMPLOYEE_NAME,
        elm.CAL_YEAR_ID,
        cy.YEAR,
        MAX(CASE WHEN elm.LEAVE_ID = 1 THEN elm.ALLOTED END) AS CASUAL_LEAVE,
        MAX(CASE WHEN elm.LEAVE_ID = 3 THEN elm.ALLOTED END) AS EARNED_LEAVE,
        MAX(CASE WHEN elm.LEAVE_ID = 2 THEN elm.ALLOTED END) AS MEDICAL_LEAVE
      FROM EMP_LEAVE_MAST elm
      JOIN EMP          e  ON e.EMP_ID       = elm.EMP_ID
      JOIN CALENDAR_YEAR cy ON cy.CAL_YEAR_ID = elm.CAL_YEAR_ID
      WHERE elm.CAL_YEAR_ID = :CAL_YEAR_ID
      GROUP BY
        e.EMP_ID,
        e.NAME,
        elm.CAL_YEAR_ID,
        cy.YEAR
      ORDER BY e.NAME
    `;

    const result = await db.executeQuery(query, { CAL_YEAR_ID }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Employee leave grid fetched")
    );
  } catch (error) {
    console.error("Get employee leave grid error:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /leave-allotment/calendar-years
 * Returns all calendar years as a dropdown list, ordered latest first.
 */
const getCalendarYearDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        CAL_YEAR_ID,
        YEAR
      FROM CALENDAR_YEAR
      ORDER BY YEAR DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Calendar year list fetched")
    );
  } catch (error) {
    console.error("Get calendar year dropdown error:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /leave-allotment/single
 * Allots CL, EL, and ML leaves to a single employee for a given calendar year.
 * Each leave type is inserted only if not already allotted (no duplicate allotment).
 *
 * Leave ID mapping: CL = 1, EL = 3, ML = 2
 *
 * @body {number} EMP_ID
 * @body {number} CAL_YEAR_ID
 * @body {number} [CL] - Casual leave days
 * @body {number} [EL] - Earned leave days
 * @body {number} [ML] - Medical leave days
 */
const postLeaveSingleEmployee = asyncHandler(async (req, res) => {
  const { EMP_ID, CAL_YEAR_ID, CL, EL, ML } = req.body;

  if (!EMP_ID || !CAL_YEAR_ID) {
    throw new ApiError(400, "EMP_ID and CAL_YEAR_ID are required");
  }

  try {
    const db = new DatabaseHandler();

    // PL/SQL block: inserts leave allotment records for each leave type if not already present.
    // Uses an internal procedure (assign_leave) to check existence and insert.
    const plsql = `
      DECLARE
        v_emp_id      NUMBER := :emp_id;
        v_cal_year_id NUMBER := :cal_year_id;

        v_cl NUMBER := :cl;
        v_el NUMBER := :el;
        v_ml NUMBER := :ml;

        v_status_cl NUMBER := 0;
        v_status_el NUMBER := 0;
        v_status_ml NUMBER := 0;

        v_msg_cl VARCHAR2(255);
        v_msg_el VARCHAR2(255);
        v_msg_ml VARCHAR2(255);

        v_cnt NUMBER;

        -- Inserts a leave allotment row if one does not already exist for this employee/year/type
        PROCEDURE assign_leave(
          p_leave_id NUMBER,
          p_alloted  NUMBER,
          p_status   OUT NUMBER,
          p_msg      OUT VARCHAR2
        ) IS
        BEGIN
          SELECT COUNT(*)
          INTO v_cnt
          FROM emp_leave_mast
          WHERE emp_id      = v_emp_id
            AND cal_year_id = v_cal_year_id
            AND leave_id    = p_leave_id;

          IF v_cnt > 0 THEN
            p_status := 0;
            p_msg    := 'Leave already allotted';
          ELSE
            INSERT INTO emp_leave_mast
              (cal_year_id, emp_id, leave_id, alloted, used_leave, bal_leave)
            VALUES
              (v_cal_year_id, v_emp_id, p_leave_id, p_alloted, 0, p_alloted);

            p_status := 1;
            p_msg    := 'Leave allotted successfully';
          END IF;
        END;

      BEGIN
        -- CL maps to LEAVE_ID = 1
        IF v_cl IS NOT NULL THEN
          assign_leave(1, v_cl, v_status_cl, v_msg_cl);
        END IF;

        -- EL maps to LEAVE_ID = 3
        IF v_el IS NOT NULL THEN
          assign_leave(3, v_el, v_status_el, v_msg_el);
        END IF;

        -- ML maps to LEAVE_ID = 2
        IF v_ml IS NOT NULL THEN
          assign_leave(2, v_ml, v_status_ml, v_msg_ml);
        END IF;

        :status_cl := v_status_cl;
        :status_el := v_status_el;
        :status_ml := v_status_ml;

        :msg_cl := v_msg_cl;
        :msg_el := v_msg_el;
        :msg_ml := v_msg_ml;
      END;
    `;

    const binds = {
      emp_id: EMP_ID,
      cal_year_id: CAL_YEAR_ID,
      cl: CL,
      el: EL,
      ml: ML,
      status_cl: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      status_el: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      status_ml: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      msg_cl: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
      msg_el: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
      msg_ml: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
    };

    const result = await db.executeQuery(plsql, binds, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, {
        CL: { status: result.outBinds.status_cl, message: result.outBinds.msg_cl },
        EL: { status: result.outBinds.status_el, message: result.outBinds.msg_el },
        ML: { status: result.outBinds.status_ml, message: result.outBinds.msg_ml },
      })
    );
  } catch (error) {
    console.error("Post leave allotment error:", error);
    throw new ApiError(500, error.message);
  }
});

/**
 * PUT /leave-allotment/single
 * Updates or inserts leave allotment for CL, EL, ML for a single employee.
 *
 * Business rules enforced in PL/SQL:
 * - Leave reduction is blocked (new allotment cannot be less than current)
 * - If allotment is increased, current-month LOP records are converted to paid leave first
 * - Balance is recalculated as: new_allotted - used + locked_lop (past months only)
 * - If no record exists for a leave type, it is inserted fresh
 *
 * Leave ID mapping: CL = 1, EL = 3, ML = 2
 *
 * @body {number} EMP_ID
 * @body {number} CAL_YEAR_ID
 * @body {number} [CL] - Casual leave days
 * @body {number} [EL] - Earned leave days
 * @body {number} [ML] - Medical leave days
 */
const updateLeaveSingleEmployee = asyncHandler(async (req, res) => {
  const { EMP_ID, CAL_YEAR_ID, CL, EL, ML } = req.body;

  if (!EMP_ID || !CAL_YEAR_ID) {
    throw new ApiError(400, "EMP_ID and CAL_YEAR_ID are required");
  }

  try {
    const db = new DatabaseHandler();

    // PL/SQL block: upserts leave allotment with balance recalculation and LOP conversion.
    // Two internal procedures:
    //   convert_lop_to_paid — deletes/reduces current-month LOP records when allotment increases
    //   upsert_leave        — updates existing record or inserts new one
    const plsql = `
      DECLARE
        v_emp_id      NUMBER := :emp_id;
        v_cal_year_id NUMBER := :cal_year_id;

        v_cl NUMBER := :cl;
        v_el NUMBER := :el;
        v_ml NUMBER := :ml;

        v_cnt         NUMBER := 0;
        v_used        NUMBER := 0;
        v_old_alloted NUMBER := 0;
        v_locked_lop  NUMBER := 0;

        v_status_cl NUMBER := 0;
        v_status_el NUMBER := 0;
        v_status_ml NUMBER := 0;

        v_msg_cl VARCHAR2(255);
        v_msg_el VARCHAR2(255);
        v_msg_ml VARCHAR2(255);

        -- Converts current-month LOP records to paid leave when allotment is increased.
        -- Deletes full LOP rows or reduces partial ones until the increase is absorbed.
        PROCEDURE convert_lop_to_paid(
          p_leave_id    NUMBER,
          p_old_alloted NUMBER,
          p_new_alloted NUMBER
        ) IS
          v_convert NUMBER := 0;
        BEGIN
          v_convert := p_new_alloted - p_old_alloted;

          IF v_convert <= 0 THEN
            RETURN;
          END IF;

          FOR rec IN (
            SELECT EMP_LOP_ID, NO_OF_LOP_DAYS
            FROM EMP_LOP
            WHERE EMP_ID      = v_emp_id
              AND CAL_YEAR_ID = v_cal_year_id
              AND LEAVE_ID    = p_leave_id
              AND FROM_DATE  >= TRUNC(SYSDATE, 'MM')
              AND FROM_DATE  <  ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
            ORDER BY FROM_DATE
          )
          LOOP
            EXIT WHEN v_convert <= 0;

            IF rec.NO_OF_LOP_DAYS <= v_convert THEN
              -- Entire LOP row is absorbed — delete it
              DELETE FROM EMP_LOP WHERE EMP_LOP_ID = rec.EMP_LOP_ID;
              v_convert := v_convert - rec.NO_OF_LOP_DAYS;
            ELSE
              -- Partial LOP row — reduce it by the remaining convert amount
              UPDATE EMP_LOP
              SET NO_OF_LOP_DAYS = rec.NO_OF_LOP_DAYS - v_convert
              WHERE EMP_LOP_ID = rec.EMP_LOP_ID;
              v_convert := 0;
            END IF;
          END LOOP;
        END;

        -- Upserts a leave allotment record.
        -- If record exists: validates no reduction, converts LOP, recalculates balance, then updates.
        -- If record does not exist: inserts fresh with full allotment as balance.
        PROCEDURE upsert_leave(
          p_leave_id NUMBER,
          p_alloted  NUMBER,
          p_status   OUT NUMBER,
          p_msg      OUT VARCHAR2
        ) IS
        BEGIN
          SELECT COUNT(*)
          INTO v_cnt
          FROM EMP_LEAVE_MAST
          WHERE EMP_ID      = v_emp_id
            AND CAL_YEAR_ID = v_cal_year_id
            AND LEAVE_ID    = p_leave_id;

          IF v_cnt > 0 THEN
            SELECT ALLOTED, USED_LEAVE
            INTO v_old_alloted, v_used
            FROM EMP_LEAVE_MAST
            WHERE EMP_ID      = v_emp_id
              AND CAL_YEAR_ID = v_cal_year_id
              AND LEAVE_ID    = p_leave_id;

            -- Locked LOP: past months only — these are already finalised and cannot be reversed
            SELECT NVL(SUM(NO_OF_LOP_DAYS), 0)
            INTO v_locked_lop
            FROM EMP_LOP
            WHERE EMP_ID      = v_emp_id
              AND CAL_YEAR_ID = v_cal_year_id
              AND LEAVE_ID    = p_leave_id
              AND FROM_DATE  < TRUNC(SYSDATE, 'MM');

            -- Business rule: leave reduction is never allowed
            IF p_alloted < v_old_alloted THEN
              RAISE_APPLICATION_ERROR(-20004, 'Leave reduction is not allowed');
            END IF;

            -- Convert current-month LOP to paid if allotment increased
            convert_lop_to_paid(p_leave_id, v_old_alloted, p_alloted);

            -- Balance formula: new_allotted - used_leaves + locked_lop (floored at 0)
            UPDATE EMP_LEAVE_MAST
            SET ALLOTED   = p_alloted,
                BAL_LEAVE = CASE
                              WHEN p_alloted - v_used + v_locked_lop < 0 THEN 0
                              ELSE p_alloted - v_used + v_locked_lop
                            END
            WHERE EMP_ID      = v_emp_id
              AND CAL_YEAR_ID = v_cal_year_id
              AND LEAVE_ID    = p_leave_id;

            p_status := 1;
            p_msg    := 'Leave updated successfully';

          ELSE
            INSERT INTO EMP_LEAVE_MAST
              (CAL_YEAR_ID, EMP_ID, LEAVE_ID, ALLOTED, USED_LEAVE, BAL_LEAVE)
            VALUES
              (v_cal_year_id, v_emp_id, p_leave_id, p_alloted, 0, p_alloted);

            p_status := 1;
            p_msg    := 'Leave allotted successfully';
          END IF;
        END;

      BEGIN
        -- CL maps to LEAVE_ID = 1
        IF v_cl IS NOT NULL THEN
          upsert_leave(1, v_cl, v_status_cl, v_msg_cl);
        END IF;

        -- EL maps to LEAVE_ID = 3
        IF v_el IS NOT NULL THEN
          upsert_leave(3, v_el, v_status_el, v_msg_el);
        END IF;

        -- ML maps to LEAVE_ID = 2
        IF v_ml IS NOT NULL THEN
          upsert_leave(2, v_ml, v_status_ml, v_msg_ml);
        END IF;

        :status_cl := v_status_cl;
        :status_el := v_status_el;
        :status_ml := v_status_ml;

        :msg_cl := v_msg_cl;
        :msg_el := v_msg_el;
        :msg_ml := v_msg_ml;
      END;
    `;

    const binds = {
      emp_id: EMP_ID,
      cal_year_id: CAL_YEAR_ID,
      cl: CL,
      el: EL,
      ml: ML,
      status_cl: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      status_el: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      status_ml: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      msg_cl: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
      msg_el: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
      msg_ml: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 255 },
    };

    const result = await db.executeQuery(plsql, binds, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, {
        CL: { status: result.outBinds.status_cl, message: result.outBinds.msg_cl },
        EL: { status: result.outBinds.status_el, message: result.outBinds.msg_el },
        ML: { status: result.outBinds.status_ml, message: result.outBinds.msg_ml },
      })
    );
  } catch (error) {
    console.error("Leave update error:", error);

    // Extract the human-readable message from Oracle errors (ORA-XXXXX: <message>)
    // This avoids leaking raw Oracle internals to the client
    let cleanMessage = "Something went wrong";
    if (error?.message) {
      const match = error.message.match(/ORA-\d+:\s*(.*)/);
      if (match && match[1]) {
        cleanMessage = match[1];
      }
    }

    throw new ApiError(400, cleanMessage);
  }
});

module.exports = {
  getEmployeeDropdown,
  getEmployeeLeaveGrid,
  getCalendarYearDropdown,
  postLeaveSingleEmployee,
  updateLeaveSingleEmployee,
};