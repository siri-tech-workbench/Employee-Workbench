const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");
const { EmailService } = require("../../utils");

// Initialize email service instance for sending leave approval/rejection notifications
const emailService = new EmailService();

/**
 * GET /leave/pending
 * Fetches all pending leave requests (STATUS = 0) across all employees.
 * Aggregates attached document IDs and names using LISTAGG for each request.
 * Results are ordered by requested leave start date ascending.
 */
const getPendingLeaves = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        eld.EMP_LEAVE_DETAIL_ID AS "emp_leave_detail_id",
        eld.LEAVE_ID            AS "leave_id",
        e.NAME                  AS "employee_name",
        lm.LEAVE_NAME           AS "leave_name",
        eld.REQ_LEAVE_FROM      AS "from_date",
        eld.REQ_LEAVE_TO        AS "to_date",
        eld.NO_OF_DAYS          AS "no_of_days",
        eld.LEAVE_REASON        AS "leave_reason",
        eld.EMER_CONTACT_NO     AS "emer_contact_no",

        -- Concatenates doc ID and doc name pairs as "id:name" separated by commas
        LISTAGG(
          ed.EMP_LEAVE_DOC_ID || ':' || ed.DOC_NAME, ','
        ) WITHIN GROUP (ORDER BY ed.EMP_LEAVE_DOC_ID) AS "doc_names",

        COUNT(ed.EMP_LEAVE_DOC_ID) AS "doc_count"

      FROM EMP_LEAVE_DETAIL eld
      JOIN LEAVE_MASTER lm
        ON lm.LEAVE_ID = eld.LEAVE_ID
      JOIN EMP e
        ON e.EMP_ID = eld.EMP_ID
      LEFT JOIN EMP_LEAVE_DOCS ed
        ON ed.EMP_LEAVE_DETAIL_ID = eld.EMP_LEAVE_DETAIL_ID

      WHERE NVL(eld.STATUS, 0) = 0

      GROUP BY
        eld.EMP_LEAVE_DETAIL_ID,
        eld.LEAVE_ID,
        e.NAME,
        lm.LEAVE_NAME,
        eld.REQ_LEAVE_FROM,
        eld.REQ_LEAVE_TO,
        eld.NO_OF_DAYS,
        eld.LEAVE_REASON,
        eld.EMER_CONTACT_NO

      ORDER BY eld.REQ_LEAVE_FROM ASC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Pending leave list fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /leave/status-dropdown
 * Fetches all available leave approval statuses for the approval action dropdown
 * (e.g., Approved, Rejected, etc.), ordered by status ID.
 */
const getLeaveApproveStatusDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        STATUS_ID  AS "status_id",
        APR_STATUS AS "apr_status"
      FROM LEAVE_STATUS
      ORDER BY STATUS_ID
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Status list fetched successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Error fetching status", err.message);
  }
});

/**
 * POST /leave/approve
 * Approves or rejects a pending leave request.
 *
 * REJECT FLOW (APR_STATUS = 'REJECTED'):
 *   - Updates leave status and remarks.
 *   - Sends rejection email with current leave balances.
 *
 * APPROVE FLOW (APR_STATUS = 'APPROVED'):
 *   - Enforces chronological approval order for Earned Leave (EL).
 *   - Calculates approved working days, excluding Sundays and holidays for non-EL.
 *   - For EL, fills continuity gap dates between consecutive EL approvals.
 *   - Supports half-day leave detection (applied days = 0.5).
 *   - Handles Comp-Off (CF) using FIFO consumption from oldest approved comp-off records.
 *   - Calculates LOP (Loss of Pay) days when approved days exceed available balance.
 *   - Inserts individual LOP records per day into EMP_LOP.
 *   - Deducts paid days from EMP_LEAVE_MAST balance.
 *   - Sends approval email with updated leave balances.
 */
const approveLeave = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  const {
    emp_leave_detail_id,
    leave_id,
    approved_from,
    approved_to,
    status_id,
    remarks,
  } = req.body;

  // Step 1: Validate the provided status ID and fetch its label (e.g., APPROVED / REJECTED)
  const statusRes = await db.executeQuery(
    `
    SELECT UPPER(APR_STATUS) APR_STATUS
    FROM LEAVE_STATUS
    WHERE STATUS_ID = :ID
    `,
    { ID: status_id },
    "siri_db"
  );

  if (!statusRes.rows.length) {
    throw new ApiError(400, "Invalid status");
  }

  // ─────────────────────────────────────────────
  // REJECT FLOW
  // ─────────────────────────────────────────────
  if (statusRes.rows[0].APR_STATUS === "REJECTED") {

    // Mark the leave request as rejected with HR remarks
    await db.executeQuery(
      `
      UPDATE EMP_LEAVE_DETAIL
      SET STATUS  = :S,
          REMARKS = :R
      WHERE EMP_LEAVE_DETAIL_ID = :ID
      `,
      { S: status_id, R: remarks, ID: emp_leave_detail_id },
      "siri_db"
    );

    // Fetch employee details for rejection email
    const empRes = await db.executeQuery(
      `
      SELECT e.EMP_ID, e.NAME, e.EMAIL_ID
      FROM EMP e
      JOIN EMP_LEAVE_DETAIL eld ON eld.EMP_ID = e.EMP_ID
      WHERE eld.EMP_LEAVE_DETAIL_ID = :ID
      `,
      { ID: emp_leave_detail_id },
      "siri_db"
    );

    const EMP_ID = empRes.rows[0]?.EMP_ID;
    const empName = empRes.rows[0]?.NAME;
    const empEmail = empRes.rows[0]?.EMAIL_ID;

    // Fetch the rejected leave type and date range for the email body
    const leaveRes = await db.executeQuery(
      `
      SELECT
        lm.LEAVE_NAME,
        TO_CHAR(eld.REQ_LEAVE_FROM, 'DD-MON-YYYY') AS FROM_DATE,
        TO_CHAR(eld.REQ_LEAVE_TO,   'DD-MON-YYYY') AS TO_DATE
      FROM EMP_LEAVE_DETAIL eld
      JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = eld.LEAVE_ID
      WHERE eld.EMP_LEAVE_DETAIL_ID = :ID
      `,
      { ID: emp_leave_detail_id },
      "siri_db"
    );

    const leaveName = leaveRes.rows[0]?.LEAVE_NAME;
    const fromDate = leaveRes.rows[0]?.FROM_DATE;
    const toDate = leaveRes.rows[0]?.TO_DATE;

    // Fetch all leave balances for the employee to include in rejection email
    const balanceRes = await db.executeQuery(
      `
      SELECT lm.LEAVE_NAME, em.BAL_LEAVE
      FROM EMP_LEAVE_MAST em
      JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = em.LEAVE_ID
      WHERE em.EMP_ID = :EMP_ID
        AND em.CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
        )
      `,
      { EMP_ID },
      "siri_db"
    );

    const balancesHtml = balanceRes.rows
      .map((r) => `<li>${r.LEAVE_NAME}: ${r.BAL_LEAVE}</li>`)
      .join("");

    const rejectEmailHtml = `
      <p>Dear ${empName || "Employee"},</p>
      <p>Your <b style="color:red;">${leaveName}</b> leave request has been <b style="color:red;">rejected</b>.</p>
      <p>
        <b>Rejected Leave Details:</b><br/>
        <b>Leave Type:</b> ${leaveName}<br/>
        <b>From:</b> ${fromDate}<br/>
        <b>To:</b> ${toDate}
      </p>
      <p><b>Reason for Rejection:</b><br/>${remarks || "No remarks provided"}</p>
      <p><b>Remaining Leave Balance:</b></p>
      <ul>${balancesHtml}</ul>
      <p>Regards,<br/>HR Team</p>
    `;

    // Send rejection email — failure is caught silently to avoid blocking the response
    try {
      if (empEmail) {
        await emailService.sendEmail("HR Team", empEmail, "Leave Request Rejected", rejectEmailHtml);
      }
    } catch (mailErr) {
      console.error("Rejection email failed:", mailErr);
    }

    return res.status(200).json(new ApiResponse(200, null, "Leave rejected successfully"));
  }

  // ─────────────────────────────────────────────
  // APPROVE FLOW
  // ─────────────────────────────────────────────

  // Step 2: Fetch leave type and employee ID for the leave request
  const infoRes = await db.executeQuery(
    `
    SELECT e.EMP_ID, lm.LEAVE_NAME
    FROM EMP_LEAVE_DETAIL e
    JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = e.LEAVE_ID
    WHERE e.EMP_LEAVE_DETAIL_ID = :ID
    `,
    { ID: emp_leave_detail_id },
    "siri_db"
  );

  if (!infoRes.rows.length) {
    throw new ApiError(400, "Invalid leave request");
  }

  const EMP_ID = infoRes.rows[0].EMP_ID;
  const leaveName = infoRes.rows[0].LEAVE_NAME;
  const isCF = leaveName.toLowerCase().includes("comp");
  const isEL = leaveName.toLowerCase().includes("earned");

  // Step 3: Fetch original applied days to detect half-day leave (applied days = 0.5)
  const appliedDaysRes = await db.executeQuery(
    `
    SELECT NO_OF_DAYS
    FROM EMP_LEAVE_DETAIL
    WHERE EMP_LEAVE_DETAIL_ID = :ID
    `,
    { ID: emp_leave_detail_id },
    "siri_db"
  );

  const appliedDays = Number(appliedDaysRes.rows[0]?.NO_OF_DAYS || 0);
  const isHalfDay = appliedDays === 0.5;

  // Step 4: For Earned Leave, enforce chronological approval order —
  // earlier dated pending EL requests must be approved before later ones
  if (isEL) {
    const earlierPendingRes = await db.executeQuery(
      `
      SELECT 1
      FROM EMP_LEAVE_DETAIL e
      WHERE e.EMP_ID = :E
        AND e.LEAVE_ID = :L
        AND e.EMP_LEAVE_DETAIL_ID <> :CURR_ID
        AND NVL(e.STATUS, 0) = 0
        AND TRUNC(e.REQ_LEAVE_FROM) < TO_DATE(:CURR_FROM, 'YYYY-MM-DD')
      `,
      {
        E: EMP_ID,
        L: leave_id,
        CURR_ID: emp_leave_detail_id,
        CURR_FROM: approved_from,
      },
      "siri_db"
    );

    if (earlierPendingRes.rows.length) {
      const err = new Error("Please approve earlier dated Earned Leave first.");
      err.statusCode = 400;
      throw err;
    }
  }

  let approvedDates = [];
  let gapDates = [];

  // Step 5A: For Earned Leave, check if current approval is continuous with the previous EL.
  // If the gap between the previous EL end date and current start date contains
  // no working days (excluding Sundays and holidays), fill the gap dates automatically.
  if (isEL) {
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
      { EMP_ID, FROM_DATE: approved_from },
      "siri_db"
    );

    if (prevRes.rows.length) {
      const prevTo = prevRes.rows[0].REQ_LEAVE_TO;

      // Count working days in the gap (excluding Sundays, holidays, and already-on-leave days)
      const workingGap = await db.executeQuery(
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
        { EMP_ID, PREV_TO: prevTo, FROM_DATE: approved_from },
        "siri_db"
      );

      // If no working days in the gap, collect those gap dates to merge into EL continuity
      if (workingGap.rows[0].CNT === 0) {
        const gapRes = await db.executeQuery(
          `
          SELECT TRUNC(:PREV_TO) + LEVEL DT
          FROM dual
          CONNECT BY LEVEL <= (
            TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD')) - TRUNC(:PREV_TO) - 1
          )
          `,
          { PREV_TO: prevTo, FROM_DATE: approved_from },
          "siri_db"
        );

        gapDates = gapRes.rows.map((r) => r.DT);
      }
    }
  }

  // Step 5B: Build the list of approved dates within the approved range.
  // For EL: includes all calendar days (Sundays and holidays count toward continuity).
  // For other leave types: excludes Sundays and public holidays.
  if (isEL) {
    const resDates = await db.executeQuery(
      `
      SELECT TRUNC(TO_DATE(:F, 'YYYY-MM-DD')) + LEVEL - 1 DT
      FROM dual
      CONNECT BY LEVEL <= (
        TRUNC(TO_DATE(:T, 'YYYY-MM-DD')) - TRUNC(TO_DATE(:F, 'YYYY-MM-DD')) + 1
      )
      `,
      { F: approved_from, T: approved_to },
      "siri_db"
    );
    approvedDates = resDates.rows.map((r) => r.DT);
  } else {
    const resDates = await db.executeQuery(
      `
      SELECT DT
      FROM (
        SELECT TRUNC(TO_DATE(:F, 'YYYY-MM-DD')) + LEVEL - 1 DT
        FROM dual
        CONNECT BY LEVEL <= (
          TRUNC(TO_DATE(:T, 'YYYY-MM-DD')) - TRUNC(TO_DATE(:F, 'YYYY-MM-DD')) + 1
        )
      )
      WHERE
        MOD(TRUNC(DT) - TRUNC(DT, 'IW'), 7) <> 6
        AND NOT EXISTS (
          SELECT 1 FROM HOLIDAYS h WHERE TRUNC(h.HOLIDAY_DATE) = DT
        )
      `,
      { F: approved_from, T: approved_to },
      "siri_db"
    );
    approvedDates = resDates.rows.map((r) => r.DT);
  }

  // Sort approved dates ascending for consistent LOP tail-end calculation
  approvedDates.sort((a, b) => new Date(a) - new Date(b));

  // Total approved days includes gap dates for EL continuity; capped to 0.5 for half-day
  const calculatedDays = approvedDates.length + gapDates.length;
  const totalApprovedDays = isHalfDay ? 0.5 : calculatedDays;

  // Step 6: Fetch the employee's current leave balance for this leave type
  const balRes = await db.executeQuery(
    `
    SELECT BAL_LEAVE
    FROM EMP_LEAVE_MAST
    WHERE EMP_ID = :E
      AND LEAVE_ID = :L
      AND CAL_YEAR_ID = (
        SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
      )
    `,
    { E: EMP_ID, L: leave_id },
    "siri_db"
  );

  const balance = balRes.rows[0]?.BAL_LEAVE ?? 0;

  // Step 6A: For Comp-Off leave, consume available comp-off records in FIFO order
  // (oldest expiry date first) until the approved days are fully covered
  if (isCF && statusRes.rows[0].APR_STATUS === "APPROVED") {

    let remainingToConsume = totalApprovedDays;

    // Fetch all valid comp-offs ordered by date (FIFO) with remaining available days
    const fifoRes = await db.executeQuery(
      `
      SELECT
        COMP_OFF_ID,
        ROUND(
          (
            TO_NUMBER(SUBSTR(DURATION, 1, 2)) +
            TO_NUMBER(SUBSTR(DURATION, 4, 2)) / 60
          ) / 8,
          2
        ) - NVL(USED_DAYS, 0) AS AVAILABLE_DAYS
      FROM COMP_OFF
      WHERE EMP_ID = :EMP_ID
        AND STATUS = 1
        AND EXPIRES_ON >= TRUNC(SYSDATE)
        AND (
          ROUND(
            (
              TO_NUMBER(SUBSTR(DURATION, 1, 2)) +
              TO_NUMBER(SUBSTR(DURATION, 4, 2)) / 60
            ) / 8,
            2
          ) - NVL(USED_DAYS, 0)
        ) > 0
      ORDER BY COMP_OFF_DATE
      `,
      { EMP_ID },
      "siri_db"
    );

    // Consume from each comp-off record in order until fully covered
    for (const row of fifoRes.rows) {
      if (remainingToConsume <= 0) break;

      const consume = Math.min(remainingToConsume, row.AVAILABLE_DAYS);

      await db.executeQuery(
        `
        UPDATE COMP_OFF
        SET USED_DAYS = NVL(USED_DAYS, 0) + :USED
        WHERE COMP_OFF_ID = :ID
        `,
        { USED: consume, ID: row.COMP_OFF_ID },
        "siri_db"
      );

      remainingToConsume -= consume;
    }

    // If comp-off records did not cover the full approved days, reject the approval
    if (remainingToConsume > 0) {
      throw new ApiError(400, "Insufficient Comp-Off balance");
    }
  }

  // Step 7: Update the leave request with approved dates, status, remarks, and approval timestamp
  await db.executeQuery(
    `
    UPDATE EMP_LEAVE_DETAIL
    SET APPROVED_FROM = TO_DATE(:F, 'YYYY-MM-DD'),
        APPROVED_TO   = TO_DATE(:T, 'YYYY-MM-DD'),
        STATUS        = :S,
        REMARKS       = :R,
        APPROVED_ON   = SYSDATE
    WHERE EMP_LEAVE_DETAIL_ID = :ID
    `,
    {
      F: approved_from,
      T: approved_to,
      S: status_id,
      R: remarks,
      ID: emp_leave_detail_id,
    },
    "siri_db"
  );

  // Step 8: Calculate LOP (Loss of Pay) days — days approved beyond available balance
  // For half-day: LOP is the last approved date if balance is insufficient
  const lopDays = Math.max(0, totalApprovedDays - balance);
  let lopDates = [];

  if (lopDays > 0) {
    lopDates = isHalfDay
      ? [approvedDates[approvedDates.length - 1]]
      : approvedDates.slice(-lopDays);
  }

  // Step 9: Update the approved day count on the leave request
  await db.executeQuery(
    `
    UPDATE EMP_LEAVE_DETAIL
    SET NO_OF_DAYS = :D
    WHERE EMP_LEAVE_DETAIL_ID = :ID
    `,
    { D: totalApprovedDays, ID: emp_leave_detail_id },
    "siri_db"
  );

  // Step 10: Insert individual LOP records per day into EMP_LOP for payroll processing
  if (lopDates.length > 0) {
    const calYear = await db.executeQuery(
      `SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'`,
      {},
      "siri_db"
    );

    for (const dt of lopDates) {
      await db.executeQuery(
        `
        INSERT INTO EMP_LOP (
          EMP_LOP_ID,
          CAL_YEAR_ID,
          EMP_ID,
          LEAVE_ID,
          FROM_DATE,
          TO_DATE,
          NO_OF_LOP_DAYS,
          MONTH_YEAR
        )
        VALUES (
          EMP_LOP_SEQ.NEXTVAL,
          :CY,
          :E,
          :L,
          :F,
          :T,
          :D,
          TO_CHAR(:F, 'MON-YYYY')
        )
        `,
        {
          CY: calYear.rows[0].CAL_YEAR_ID,
          E: EMP_ID,
          L: leave_id,
          F: dt,
          T: dt,
          D: isHalfDay ? 0.5 : 1,
        },
        "siri_db"
      );
    }
  }

  // Step 11: Deduct paid days from leave balance (USED_LEAVE tracks total including LOP days)
  const paidDays = Math.min(totalApprovedDays, balance);

  await db.executeQuery(
    `
    UPDATE EMP_LEAVE_MAST
    SET
      USED_LEAVE = NVL(USED_LEAVE, 0) + :TOTAL_USED,
      BAL_LEAVE  =
        CASE
          WHEN NVL(BAL_LEAVE, 0) - :PAID < 0 THEN 0
          ELSE NVL(BAL_LEAVE, 0) - :PAID
        END
    WHERE EMP_ID = :E
      AND LEAVE_ID = :L
      AND CAL_YEAR_ID = (
        SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
      )
    `,
    { TOTAL_USED: totalApprovedDays, PAID: paidDays, E: EMP_ID, L: leave_id },
    "siri_db"
  );

  // Step 12: Fetch employee name and email for the approval notification
  const empRes = await db.executeQuery(
    `
    SELECT NAME, EMAIL_ID
    FROM EMP
    WHERE EMP_ID = :EMP_ID
    `,
    { EMP_ID },
    "siri_db"
  );

  const empName = empRes.rows[0]?.NAME;
  const empEmail = empRes.rows[0]?.EMAIL_ID;

  // Step 13: Fetch all leave type balances for the employee for the approval email summary
  const balanceRes = await db.executeQuery(
    `
    SELECT lm.LEAVE_NAME, em.BAL_LEAVE
    FROM EMP_LEAVE_MAST em
    JOIN LEAVE_MASTER lm ON lm.LEAVE_ID = em.LEAVE_ID
    WHERE em.EMP_ID = :EMP_ID
      AND em.CAL_YEAR_ID = (
        SELECT CAL_YEAR_ID FROM CALENDAR_YEAR WHERE STATUS = 'Y'
      )
    `,
    { EMP_ID },
    "siri_db"
  );

  const balances = {};
  balanceRes.rows.forEach((r) => {
    balances[r.LEAVE_NAME] = r.BAL_LEAVE;
  });

  const emailHtml = `
    <p>Dear ${empName || "Employee"},</p>
    <p>Your <b style="color:green;">${leaveName}</b> leave request has been <b style="color:green;">approved</b>.</p>
    <p>
      <b>Approved Leave Details:</b><br/>
      <b>Leave Type:</b> ${leaveName}<br/>
      <b>From:</b> ${approved_from}<br/>
      <b>To:</b> ${approved_to}<br/>
      <b>Total Days:</b> ${totalApprovedDays}
    </p>
    <p><b>Remaining Leave Balance:</b></p>
    <ul>
      ${Object.entries(balances)
      .map(([name, bal]) => `<li>${name}: ${bal}</li>`)
      .join("")}
    </ul>
    <p>Regards,<br/>HR Team</p>
  `;

  // Step 14: Send approval email — failure is caught silently to avoid blocking the response
  try {
    if (empEmail) {
      await emailService.sendEmail("HR Team", empEmail, "Leave Approved", emailHtml);
    }
  } catch (mailErr) {
    console.error("Approval email failed:", mailErr);
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Leave approved successfully")
  );
});

/**
 * GET /leave/employee-details
 * Searches leave history for a specific employee with optional date range filters.
 * Groups results into casual, earned, and medical leave buckets for frontend rendering.
 * Requires emp_id as a mandatory query parameter.
 */
const searchEmployeeLeaveDetails = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { emp_id, from_date, to_date } = req.query;

    if (!emp_id) {
      throw new ApiError(400, "Employee ID is required");
    }

    const query = `
      SELECT
        lm.LEAVE_NAME,
        eld.REQ_LEAVE_FROM,
        eld.REQ_LEAVE_TO,
        eld.NO_OF_DAYS,
        eld.STATUS
      FROM EMP_LEAVE_DETAIL eld
      JOIN LEAVE_MASTER lm
        ON lm.LEAVE_ID = eld.LEAVE_ID
      WHERE eld.EMP_ID = :EMP_ID
        AND (
          :FROM_DATE IS NULL
          OR TRUNC(eld.REQ_LEAVE_FROM) >= TRUNC(TO_DATE(:FROM_DATE, 'YYYY-MM-DD'))
        )
        AND (
          :TO_DATE IS NULL
          OR TRUNC(eld.REQ_LEAVE_TO) <= TRUNC(TO_DATE(:TO_DATE, 'YYYY-MM-DD'))
        )
      ORDER BY eld.REQ_LEAVE_FROM DESC
    `;

    const result = await db.executeQuery(
      query,
      {
        EMP_ID: emp_id,
        FROM_DATE: from_date || null,
        TO_DATE: to_date || null,
      },
      "siri_db"
    );

    // Separate leave records into typed buckets for structured frontend consumption
    const casual = [];
    const earned = [];
    const medical = [];

    (result.rows || []).forEach((row) => {
      const leave = {
        from: row.REQ_LEAVE_FROM,
        to: row.REQ_LEAVE_TO,
        days: row.NO_OF_DAYS,
        status: row.STATUS,
      };

      const name = row.LEAVE_NAME.toLowerCase();

      if (name.includes("casual")) casual.push(leave);
      else if (name.includes("earned")) earned.push(leave);
      else if (name.includes("medical")) medical.push(leave);
    });

    return res.status(200).json(
      new ApiResponse(200, { casual, earned, medical }, "Leave details fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching employee leave details:", error);
    throw new ApiError(500, "Failed to fetch leave details");
  }
});

module.exports = {
  getPendingLeaves,
  getLeaveApproveStatusDropdown,
  approveLeave,
  searchEmployeeLeaveDetails,
};