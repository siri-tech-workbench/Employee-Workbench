const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");
const oracledb = require("oracledb");
const fs = require("fs");
const path = require("path");

/**
 * Helper: Returns true if the given leave name is an Earned Leave type.
 * Used across multiple functions to branch logic for EL continuity rules.
 */
const isEarnedLeave = (leaveName = "") =>
  leaveName.toLowerCase().includes("earned");

/**
 * POST /leave/apply
 * Applies a leave request for the logged-in employee.
 *
 * - Checks for overlapping leave requests on the same date range.
 * - Validates that the selected range contains working days.
 * - For non-Earned Leave: excludes Sundays and public holidays from day count.
 * - For Comp-Off: validates sufficient balance before applying.
 * - For Medical Leave > 2 days: requires at least one uploaded document.
 * - Inserts the leave request and stores any attached documents.
 * - Records excluded holidays/Sundays in DEC_HOLIDAYS for reference.
 */
const applyLeave = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  try {
    const {
      leave_id,
      req_leave_from,
      req_leave_to,
      no_of_days,
      leave_reason,
      half_day,
      emer_contact_no,
    } = req.body;

    // Step 1: Check if a non-rejected/cancelled leave already exists for this date range
    const overlap = await db.executeQuery(
      `
      SELECT COUNT(*) CNT
      FROM EMP_LEAVE_DETAIL
      WHERE EMP_ID = :EMP_ID
        AND NVL(STATUS, 0) NOT IN (2, 3)
        AND (
          TRUNC(REQ_LEAVE_FROM) <= TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
          AND TRUNC(REQ_LEAVE_TO) >= TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD'))
        )
      `,
      {
        EMP_ID: req.user.emp_id,
        FROM_DATE: req_leave_from,
        TO_DATE: req_leave_to,
      },
      "siri_db"
    );

    if (overlap.rows[0].CNT > 0) {
      return res.status(409).json(
        new ApiResponse(409, null, "Leave already applied for selected date range")
      );
    }

    const totalDays = Number(no_of_days);

    // Step 2: Reject if the provided day count is invalid
    if (isNaN(totalDays) || totalDays <= 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Leave cannot be applied for Sundays or holidays")
      );
    }

    // Step 3: Fetch leave type metadata to determine EL/Comp-Off/Medical rules
    const leaveMeta = await db.executeQuery(
      `
      SELECT LEAVE_NAME
      FROM LEAVE_MASTER
      WHERE LEAVE_ID = :ID
      `,
      { ID: leave_id },
      "siri_db"
    );

    if (!leaveMeta.rows.length) {
      throw new ApiError(400, "Invalid leave type");
    }

    const leaveName = leaveMeta.rows[0].LEAVE_NAME;

    // Step 4: Block application if this leave type has not been allotted to the employee
    const allotRes = await db.executeQuery(
      `
      SELECT COUNT(*) CNT
      FROM EMP_LEAVE_MAST
      WHERE EMP_ID = :EMP_ID
        AND LEAVE_ID = :LEAVE_ID
        AND CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID
          FROM CALENDAR_YEAR
          WHERE STATUS = 'Y'
        )
      `,
      { EMP_ID: req.user.emp_id, LEAVE_ID: leave_id },
      "siri_db"
    );

    if (allotRes.rows[0].CNT === 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Leave is not allotted for this employee. Please contact HR.")
      );
    }

    // Step 5: For non-Earned Leave, calculate working days by excluding Sundays and holidays.
    // Records excluded dates in DEC_HOLIDAYS as "YYYY-MM-DD:Type" pairs for audit.
    const isEL = isEarnedLeave(leaveName);
    let workingDays = totalDays;
    let decHolidayArr = [];

    if (!isEL) {
      const dateRes = await db.executeQuery(
        `
        SELECT
          TO_CHAR(DT, 'YYYY-MM-DD') AS DT_STR,
          CASE
            WHEN MOD(TRUNC(DT) - TRUNC(DT, 'IW'), 7) = 6 THEN 'Sunday'
            WHEN EXISTS (
              SELECT 1 FROM HOLIDAYS h WHERE TRUNC(h.HOLIDAY_DATE) = DT
            ) THEN 'Holiday'
            ELSE 'Working Day'
          END AS DAY_TYPE
        FROM (
          SELECT TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) + LEVEL - 1 DT
          FROM dual
          CONNECT BY LEVEL <= (
            TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
            - TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) + 1
          )
        )
        `,
        { FROM_DATE: req_leave_from, TO_DATE: req_leave_to },
        "siri_db"
      );

      workingDays = 0;

      for (const row of dateRes.rows) {
        if (row.DAY_TYPE === "Working Day") {
          workingDays++;
        } else {
          decHolidayArr.push(`${row.DT_STR}:${row.DAY_TYPE}`);
        }
      }
    }

    const decHolidayValue = decHolidayArr.length > 0 ? decHolidayArr.join(",") : null;

    if (workingDays <= 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Selected date range does not contain any working days")
      );
    }

    // Determine final requested days — capped to 0.5 for half-day requests
    const requestedDays = half_day && half_day.toUpperCase() === "Y" ? 0.5 : workingDays;

    // Step 6: For Comp-Off leave, validate that sufficient balance is available
    const isCompOff = leaveName.toLowerCase().includes("comp");

    if (isCompOff) {
      const compAvailRes = await db.executeQuery(
        `
        SELECT NVL(BAL_LEAVE, 0) AS AVAILABLE_DAYS
        FROM EMP_LEAVE_MAST
        WHERE EMP_ID = :EMP_ID
          AND LEAVE_ID = (
            SELECT LEAVE_ID FROM LEAVE_MASTER WHERE SHORT_NAME = 'CF'
          )
          AND CAL_YEAR_ID = (
            SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
          )
        `,
        { EMP_ID: req.user.emp_id },
        "siri_db"
      );

      const available = Number(compAvailRes.rows[0]?.AVAILABLE_DAYS || 0);

      if (requestedDays > available) {
        throw new ApiError(
          400,
          `Insufficient Comp-Off balance. Available: ${available}, Requested: ${requestedDays}`
        );
      }
    }

    // Step 7: Medical Leave exceeding 2 working days requires at least one uploaded document
    if (
      leaveName.toLowerCase().includes("medical") &&
      workingDays > 2 &&
      (!req.files || req.files.length === 0)
    ) {
      throw new ApiError(400, "Medical certificate required for medical leave exceeding 2 days");
    }

    // Step 8: Insert the leave request and retrieve the generated leave detail ID
    const insertResult = await db.executeQuery(
      `
      INSERT INTO EMP_LEAVE_DETAIL (
        EMP_ID, LEAVE_ID,
        REQ_LEAVE_FROM, REQ_LEAVE_TO,
        NO_OF_DAYS, HALF_DAY,
        LEAVE_REASON, EMER_CONTACT_NO,
        DEC_HOLIDAYS,
        REQUESTED_ON, APPLIED_TIME
      )
      VALUES (
        :EMP_ID, :LEAVE_ID,
        TO_DATE(:FROM_DATE, 'YYYY-MM-DD'),
        TO_DATE(:TO_DATE, 'YYYY-MM-DD'),
        :NO_OF_DAYS, :HALF_DAY,
        :REASON, :CONTACT, :DEC_HOLIDAYS,
        SYSDATE, TO_CHAR(SYSDATE, 'HH12:MI')
      )
      RETURNING EMP_LEAVE_DETAIL_ID INTO :LEAVE_DETAIL_ID
      `,
      {
        EMP_ID: req.user.emp_id,
        LEAVE_ID: leave_id,
        FROM_DATE: req_leave_from,
        TO_DATE: req_leave_to,
        NO_OF_DAYS: requestedDays,
        DEC_HOLIDAYS: decHolidayValue,
        HALF_DAY: half_day,
        REASON: leave_reason,
        CONTACT: emer_contact_no,
        LEAVE_DETAIL_ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      "siri_db"
    );

    const leaveDetailId = insertResult.outBinds.LEAVE_DETAIL_ID[0];

    // Step 9: Insert each uploaded document record linked to this leave request
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.executeQuery(
          `
          INSERT INTO EMP_LEAVE_DOCS (EMP_LEAVE_DETAIL_ID, DOC_NAME)
          VALUES (:DETAIL_ID, :DOC_NAME)
          `,
          { DETAIL_ID: leaveDetailId, DOC_NAME: file.filename },
          "siri_db"
        );
      }
    }

    return res.status(201).json(
      new ApiResponse(201, {
        no_of_days: requestedDays,
        dec_holidays: decHolidayValue,
      }, "Leave applied successfully")
    );

  } catch (err) {
    console.error("Error applying leave:", err);

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(500, "Apply leave failed");
  }
});

/**
 * GET /leave/types
 * Fetches all leave types with the employee's current balance for each type.
 * Used to populate the leave type dropdown on the apply leave form.
 */
const getLeaveTypeDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        lm.LEAVE_ID   AS "leave_id",
        lm.LEAVE_NAME AS "leave_name",
        NVL(em.BAL_LEAVE, 0) AS "bal_leave"
      FROM LEAVE_MASTER lm
      LEFT JOIN (
        SELECT EMP_ID, LEAVE_ID, BAL_LEAVE
        FROM EMP_LEAVE_MAST
        WHERE CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
        )
      ) em
        ON em.LEAVE_ID = lm.LEAVE_ID
       AND em.EMP_ID   = :EMP_ID
      ORDER BY lm.LEAVE_NAME
    `;

    const result = await db.executeQuery(query, { EMP_ID: req.user.emp_id }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Leave types fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching leave type dropdown:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /leave/remaining/:leave_id
 * Returns the remaining leave balance for the logged-in employee
 * for a specific leave type in the current calendar year.
 */
const getRemainingLeave = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { leave_id } = req.params;

    const query = `
      SELECT BAL_LEAVE
      FROM EMP_LEAVE_MAST
      WHERE EMP_ID = :EMP_ID
        AND LEAVE_ID = :LEAVE_ID
        AND CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
        )
    `;

    const result = await db.executeQuery(
      query,
      { EMP_ID: req.user.emp_id, LEAVE_ID: leave_id },
      "siri_db"
    );

    return res.status(200).json(
      new ApiResponse(200, result.rows?.[0]?.BAL_LEAVE ?? 0, "Remaining leave fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching remaining leave:", error);
    throw new ApiError(500, "Failed to fetch remaining leave");
  }
});

/**
 * POST /leave/calculate-days
 * Calculates the number of leave days for a given date range and leave type.
 *
 * - For Casual/Medical: counts only working days (excludes Sundays and holidays).
 * - For Earned Leave: counts all calendar days, and adds gap days between consecutive
 *   EL periods if the gap contains no working days (continuity rule).
 */
const calculateLeaveDays = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { from_date, to_date, leave_id } = req.body;

  if (!from_date || !to_date || !leave_id) {
    throw new ApiError(400, "Missing required fields: from_date, to_date, leave_id");
  }

  // Step 1: Fetch leave type to determine day calculation rules
  const leaveMeta = await db.executeQuery(
    `
    SELECT LEAVE_NAME
    FROM LEAVE_MASTER
    WHERE LEAVE_ID = :ID
    `,
    { ID: leave_id },
    "siri_db"
  );

  if (!leaveMeta.rows.length) {
    throw new ApiError(400, "Invalid leave type");
  }

  const leaveName = leaveMeta.rows[0].LEAVE_NAME;
  const isEL = isEarnedLeave(leaveName);

  let totalDays = 0;

  if (!isEL) {
    // Step 2: For Casual/Medical — count only working days (exclude Sundays and holidays)
    const daysRes = await db.executeQuery(
      `
      SELECT COUNT(*) CNT
      FROM (
        SELECT TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) + LEVEL - 1 DT
        FROM dual
        CONNECT BY LEVEL <= (
          TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
          - TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) + 1
        )
      )
      WHERE
        MOD(TRUNC(DT) - TRUNC(DT, 'IW'), 7) <> 6
        AND NOT EXISTS (
          SELECT 1 FROM HOLIDAYS h WHERE TRUNC(h.HOLIDAY_DATE) = DT
        )
      `,
      { FROM_DATE: from_date, TO_DATE: to_date },
      "siri_db"
    );

    totalDays = daysRes.rows[0].CNT;

  } else {
    // Step 3: For Earned Leave — count all calendar days in the range
    const baseRes = await db.executeQuery(
      `
      SELECT (
        TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
        - TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) + 1
      ) CNT
      FROM dual
      `,
      { FROM_DATE: from_date, TO_DATE: to_date },
      "siri_db"
    );

    totalDays = baseRes.rows[0].CNT;

    // Step 4: Check if there is a previous EL period ending before the current from_date
    const prevRes = await db.executeQuery(
      `
      SELECT REQ_LEAVE_TO
      FROM (
        SELECT e.REQ_LEAVE_TO
        FROM EMP_LEAVE_DETAIL e
        JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = e.LEAVE_ID
        WHERE e.EMP_ID = :EMP_ID
          AND NVL(e.STATUS, 0) NOT IN (2, 3)
          AND LOWER(lm.LEAVE_NAME) LIKE '%earned%'
          AND TRUNC(e.REQ_LEAVE_TO) < TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD'))
        ORDER BY e.REQ_LEAVE_TO DESC
      )
      WHERE ROWNUM = 1
      `,
      { EMP_ID: req.user.emp_id, FROM_DATE: from_date },
      "siri_db"
    );

    if (prevRes.rows.length) {
      const prevTo = prevRes.rows[0].REQ_LEAVE_TO;

      // Step 5: Count working days in the gap between previous EL end and current EL start
      // (excluding Sundays, holidays, and days already covered by another leave)
      const workingGapRes = await db.executeQuery(
        `
        SELECT COUNT(*) CNT
        FROM (
          SELECT TRUNC(:PREV_TO) + LEVEL DT
          FROM dual
          CONNECT BY LEVEL <= (
            TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) - TRUNC(:PREV_TO) - 1
          )
        )
        WHERE
          MOD(TRUNC(DT) - TRUNC(DT, 'IW'), 7) <> 6
          AND NOT EXISTS (
            SELECT 1 FROM HOLIDAYS h WHERE TRUNC(h.HOLIDAY_DATE) = DT
          )
          AND NOT EXISTS (
            SELECT 1
            FROM EMP_LEAVE_DETAIL e
            WHERE e.EMP_ID = :EMP_ID
              AND NVL(e.STATUS, 0) NOT IN (2, 3)
              AND TRUNC(DT) BETWEEN TRUNC(e.REQ_LEAVE_FROM) AND TRUNC(e.REQ_LEAVE_TO)
          )
        `,
        { EMP_ID: req.user.emp_id, PREV_TO: prevTo, FROM_DATE: from_date },
        "siri_db"
      );

      // Step 6: If the gap has no working days, add all gap days to the total (EL continuity rule)
      if (workingGapRes.rows[0].CNT === 0) {
        const gapDaysRes = await db.executeQuery(
          `
          SELECT COUNT(*) CNT
          FROM (
            SELECT TRUNC(:PREV_TO) + LEVEL DT
            FROM dual
            CONNECT BY LEVEL <= (
              TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) - TRUNC(:PREV_TO) - 1
            )
          )
          `,
          { PREV_TO: prevTo, FROM_DATE: from_date },
          "siri_db"
        );

        totalDays += gapDaysRes.rows[0].CNT;
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, totalDays, "Leave days calculated successfully")
  );
});

/**
 * GET /leave/my-history
 * Fetches the full leave request history for the logged-in employee,
 * including leave type, status, requested and approved date ranges,
 * ordered by most recently requested.
 */
const getEmployeeLeaveDetail = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const empId = req.user.emp_id;

    const query = `
      SELECT
        e.NAME,
        eld.EMP_LEAVE_DETAIL_ID,
        eld.EMP_ID,
        lm.LEAVE_NAME,
        eld.STATUS,
        eld.REQ_LEAVE_FROM,
        eld.REQ_LEAVE_TO,
        eld.APPROVED_FROM,
        eld.APPROVED_TO,
        eld.NO_OF_DAYS,
        eld.REQUESTED_ON,
        eld.APPROVED_ON,
        eld.LEAVE_REASON,
        eld.HALF_DAY
      FROM EMP_LEAVE_DETAIL eld
      JOIN LEAVE_MASTER lm ON eld.LEAVE_ID = lm.LEAVE_ID
      JOIN EMP e ON e.EMP_ID = eld.EMP_ID
      WHERE eld.EMP_ID = :EMP_ID
      ORDER BY eld.REQUESTED_ON DESC
    `;

    const result = await db.executeQuery(query, { EMP_ID: empId }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Employee leave history fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching employee leave detail:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /leave/balance-cards
 * Fetches leave balance summary cards for the logged-in employee
 * for the current calendar year.
 * Includes allotted, used, remaining, expired comp-off, and carry-forward EL balance.
 */
const getEmployeeLeaveCards = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const empId = req.user.emp_id;

    const query = `
      SELECT
        lm.LEAVE_NAME,
        elm.ALLOTED     AS ALLOTED,
        elm.USED_LEAVE  AS USED_LEAVE,
        elm.BAL_LEAVE   AS BAL_LEAVE,
        elm.EXP_COMPOFF AS EXP_COMPOFF,

        -- Previous calendar year EL balance for carry-forward display (EL only)
        CASE
          WHEN LOWER(lm.LEAVE_NAME) LIKE '%earned%' THEN (
            SELECT NVL(prev.BAL_LEAVE, 0)
            FROM EMP_LEAVE_MAST prev
            WHERE prev.EMP_ID    = elm.EMP_ID
              AND prev.LEAVE_ID  = elm.LEAVE_ID
              AND prev.CAL_YEAR_ID = elm.CAL_YEAR_ID - 1
          )
          ELSE 0
        END AS CARRY_FORWARD

      FROM EMP_LEAVE_MAST elm
      JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = elm.LEAVE_ID
      WHERE elm.EMP_ID = :EMP_ID
        AND elm.CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
        )
    `;

    const result = await db.executeQuery(query, { EMP_ID: empId }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Leave balance cards fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching leave cards:", error);
    throw new ApiError(500, "Failed to fetch leave cards");
  }
});

/**
 * GET /leave/document/preview/:docId
 * Streams a leave document file inline to the browser for preview.
 * Looks up the document name by ID from EMP_LEAVE_DOCS,
 * then resolves the physical file path and pipes it to the response.
 */
const previewLeaveDocument = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { docId } = req.params;

  const result = await db.executeQuery(
    `
    SELECT DOC_NAME
    FROM EMP_LEAVE_DOCS
    WHERE EMP_LEAVE_DOC_ID = :DOC_ID
    `,
    { DOC_ID: docId },
    "siri_db"
  );

  if (!result.rows.length) {
    throw new ApiError(404, "Document not found");
  }

  const { DOC_NAME } = result.rows[0];

  const filePath = path.join(
    __dirname, "..", "..", "..",
    "uploads", "leave_docs", DOC_NAME
  );

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File not found on server");
  }

  // Set Content-Disposition to inline so the browser previews instead of downloading
  res.setHeader("Content-Disposition", `inline; filename="${DOC_NAME}"`);
  fs.createReadStream(filePath).pipe(res);
});

/**
 * GET /leave/lop-days
 * Fetches Loss of Pay (LOP) day totals grouped by leave type
 * for the logged-in employee in the current calendar year.
 */
const getEmployeeLopDays = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const emp_id = req.user.emp_id;

    const query = `
      SELECT
        lm.LEAVE_NAME,
        SUM(el.NO_OF_LOP_DAYS) AS LOP_DAYS
      FROM EMP_LOP el
      JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = el.LEAVE_ID
      WHERE el.EMP_ID = :EMP_ID
        AND el.CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
        )
      GROUP BY lm.LEAVE_NAME
    `;

    const result = await db.executeQuery(query, { EMP_ID: emp_id }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "LOP days fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching LOP days:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /leave/check-overlap
 * Checks if the logged-in employee has any existing leave (non-rejected/cancelled)
 * that overlaps with the provided date range.
 * Returns a boolean hasOverlap flag for frontend validation.
 */
const checkLeaveOverlap = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { from_date, to_date } = req.body;

  if (!from_date || !to_date) {
    throw new ApiError(400, "Both from_date and to_date are required");
  }

  const overlap = await db.executeQuery(
    `
    SELECT COUNT(*) CNT
    FROM EMP_LEAVE_DETAIL
    WHERE EMP_ID = :EMP_ID
      AND NVL(STATUS, 0) NOT IN (2, 3)
      AND (
        TRUNC(REQ_LEAVE_FROM) <= TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
        AND TRUNC(REQ_LEAVE_TO) >= TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD'))
      )
    `,
    {
      EMP_ID: req.user.emp_id,
      FROM_DATE: from_date,
      TO_DATE: to_date,
    },
    "siri_db"
  );

  return res.status(200).json(
    new ApiResponse(200, { hasOverlap: overlap.rows[0].CNT > 0 }, "Overlap check completed")
  );
});

/**
 * GET /leave/today-approved
 * Admin-only route that returns all employees currently on approved leave today.
 * Checks if today's date falls within the approved leave date range.
 */
const getTodayApprovedLeavesForAdmin = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  const result = await db.executeQuery(
    `
    SELECT
      e.NAME,
      eld.EMP_ID,
      lm.LEAVE_NAME,
      eld.APPROVED_FROM,
      eld.APPROVED_TO
    FROM EMP_LEAVE_DETAIL eld
    JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = eld.LEAVE_ID
    JOIN EMP e ON e.EMP_ID = eld.EMP_ID
    WHERE NVL(eld.STATUS, 0) = 1
      AND TRUNC(SYSDATE)
          BETWEEN TRUNC(eld.APPROVED_FROM)
              AND TRUNC(NVL(eld.APPROVED_TO, eld.APPROVED_FROM))
    `,
    {},
    "siri_db"
  );

  return res.status(200).json(
    new ApiResponse(200, result.rows, "Today's approved leaves fetched successfully")
  );
});

module.exports = {
  getLeaveTypeDropdown,
  applyLeave,
  getRemainingLeave,
  calculateLeaveDays,
  getEmployeeLeaveDetail,
  getEmployeeLeaveCards,
  previewLeaveDocument,
  getEmployeeLopDays,
  checkLeaveOverlap,
  getTodayApprovedLeavesForAdmin,
};