const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");
const { EmailService } = require("../../utils");

// Initialize email service instance for sending approval/rejection notifications
const emailService = new EmailService();

/**
 * GET /comp-off/pending
 * Fetches all pending comp-off requests (STATUS = 0) with employee details,
 * ordered by comp-off date descending.
 */
const getPendingCompoffList = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        c.COMP_OFF_ID,
        e.NAME AS EMP_NAME,
        c.COMP_OFF_DATE,
        c.START_TIME,
        c.END_TIME,
        c.DURATION,
        c.STATUS,
        c.EXPIRES_ON,
        c.EMP_ID
      FROM COMP_OFF c
      INNER JOIN EMP e
        ON e.EMP_ID = c.EMP_ID
      WHERE c.STATUS = 0
      ORDER BY c.COMP_OFF_DATE DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Pending comp-off list fetched")
    );
  } catch (err) {
    throw new ApiError(500, "Error fetching pending comp-off list", err.message);
  }
});

/**
 * POST /comp-off/update-status
 * Approves or rejects a comp-off request.
 *
 * - STATUS 1 (Approve): Converts duration to days, credits EMP_LEAVE_MAST,
 *   sets EXPIRES_ON = COMP_OFF_DATE + 30 days (FIFO expiry order).
 * - STATUS 2 (Reject): Marks request as rejected, no balance change.
 *
 * Sends an email notification to the employee in both cases.
 */
const updateCompoffStatus = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  try {
    const { compOffId, status } = req.body;

    // Validate required fields and ensure status is either 1 (approve) or 2 (reject)
    if (!compOffId || ![1, 2].includes(Number(status))) {
      throw new ApiError(400, "Invalid comp-off request");
    }

    /**
     * Converts a duration value to total hours.
     * Supports plain numeric values (e.g., "8") and HH:MM format (e.g., "08:30").
     */
    const durationToHours = (duration) => {
      if (!duration) return 0;
      if (!isNaN(duration)) return Number(duration);
      if (duration.includes(":")) {
        const [h, m] = duration.split(":").map(Number);
        return (h || 0) + (m || 0) / 60;
      }
      return 0;
    };

    // Step 1: Fetch the comp-off record by ID
    const compRes = await db.executeQuery(
      `
      SELECT COMP_OFF_ID, EMP_ID, STATUS, DURATION, COMP_OFF_DATE
      FROM COMP_OFF
      WHERE COMP_OFF_ID = :ID
      `,
      { ID: compOffId },
      "siri_db"
    );

    if (!compRes.rows.length) {
      throw new ApiError(404, "Comp-off request not found");
    }

    const compOff = compRes.rows[0];

    // Prevent re-processing an already approved or rejected comp-off
    if (Number(compOff.STATUS) !== 0) {
      throw new ApiError(400, "Comp-off already processed");
    }

    // Step 2: Fetch employee name and email for notification
    const empRes = await db.executeQuery(
      `
      SELECT NAME, EMAIL_ID
      FROM EMP
      WHERE EMP_ID = :EMP_ID
      `,
      { EMP_ID: compOff.EMP_ID },
      "siri_db"
    );

    const empName = empRes.rows[0]?.NAME || "Employee";
    const empEmail = empRes.rows[0]?.EMAIL_ID;

    // ─────────────────────────────────────────────
    // REJECT FLOW (STATUS = 2) — No balance change
    // ─────────────────────────────────────────────
    if (Number(status) === 2) {

      // Mark the comp-off request as rejected
      await db.executeQuery(
        `
        UPDATE COMP_OFF
        SET STATUS = 2
        WHERE COMP_OFF_ID = :ID
        `,
        { ID: compOffId },
        "siri_db"
      );

      // Fetch current comp-off leave balance for the employee (used in rejection email)
      const balRes = await db.executeQuery(
        `
        SELECT ALLOTED, USED_LEAVE, BAL_LEAVE, EXP_COMPOFF
        FROM EMP_LEAVE_MAST
        WHERE EMP_ID = :EMP_ID
          AND LEAVE_ID = (
            SELECT LEAVE_ID
            FROM LEAVE_MASTER
            WHERE SHORT_NAME = 'CF'
          )
          AND CAL_YEAR_ID = (
            SELECT CAL_YEAR_ID
            FROM CALENDAR_YEAR
            WHERE STATUS = 'Y'
          )
        `,
        { EMP_ID: compOff.EMP_ID },
        "siri_db"
      );

      const bal = balRes.rows[0] || {
        ALLOTED: 0,
        USED_LEAVE: 0,
        BAL_LEAVE: 0,
        EXP_COMPOFF: 0,
      };

      // Send rejection email with current balance summary
      if (empEmail) {
        await emailService.sendEmail(
          "HR Team",
          empEmail,
          "Comp-Off Rejected",
          `
          <p>Dear ${empName},</p>
          <p>Your <b>Comp-Off request</b> has been <b style="color:red;">rejected</b>.</p>
          <p><b>Your current Comp-Off balance:</b></p>
          <ul>
            <li>Earned: ${bal.ALLOTED}</li>
            <li>Used: ${bal.USED_LEAVE}</li>
            <li>Remaining: ${bal.BAL_LEAVE}</li>
            <li>Expired: ${bal.EXP_COMPOFF}</li>
          </ul>
          <p>Regards,<br/>HR Team</p>
          `
        );
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            balance: {
              earned: bal.ALLOTED,
              used: bal.USED_LEAVE,
              remaining: bal.BAL_LEAVE,
            },
          },
          "Comp-off rejected successfully"
        )
      );
    }

    // ─────────────────────────────────────────────
    // APPROVE FLOW (STATUS = 1) — Credit leave balance
    // ─────────────────────────────────────────────

    // Step 3: Convert duration to days (assumes 8-hour workday)
    const hours = durationToHours(compOff.DURATION);
    const days = Number((hours / 8).toFixed(2));

    if (days <= 0) {
      throw new ApiError(400, "Invalid comp-off duration");
    }

    // Step 4: Credit comp-off days to EMP_LEAVE_MAST for leave type 'CF' (Comp-Off)
    // Uses MERGE to insert a new record if none exists for the current calendar year
    await db.executeQuery(
      `
      MERGE INTO EMP_LEAVE_MAST elm
      USING (
        SELECT
          :EMP_ID AS EMP_ID,
          lm.LEAVE_ID,
          (
            SELECT CAL_YEAR_ID
            FROM CALENDAR_YEAR
            WHERE STATUS = 'Y'
          ) AS CAL_YEAR_ID
        FROM LEAVE_MASTER lm
        WHERE lm.SHORT_NAME = 'CF'
      ) src
      ON (
        elm.EMP_ID = src.EMP_ID
        AND elm.LEAVE_ID = src.LEAVE_ID
        AND elm.CAL_YEAR_ID = src.CAL_YEAR_ID
      )
      WHEN MATCHED THEN
        UPDATE SET
          elm.ALLOTED = ROUND(NVL(elm.ALLOTED, 0) + :DAYS, 2),
          elm.BAL_LEAVE = ROUND(
            (
              NVL(elm.ALLOTED, 0)
              + :DAYS
              - NVL(elm.USED_LEAVE, 0)
              - NVL(elm.EXP_COMPOFF, 0)
            ),
            2
          )
      WHEN NOT MATCHED THEN
        INSERT (EMP_ID, LEAVE_ID, CAL_YEAR_ID, ALLOTED, USED_LEAVE, BAL_LEAVE)
        VALUES (
          src.EMP_ID,
          src.LEAVE_ID,
          src.CAL_YEAR_ID,
          ROUND(:DAYS, 2),
          0,
          ROUND(:DAYS, 2)
        )
      `,
      { EMP_ID: compOff.EMP_ID, DAYS: days },
      "siri_db"
    );

    // Step 5: Mark comp-off as approved and set expiry to 30 days from comp-off date (FIFO order)
    await db.executeQuery(
      `
      UPDATE COMP_OFF
      SET
        STATUS     = 1,
        EXPIRES_ON = COMP_OFF_DATE + 30,
        USED_DAYS  = 0
      WHERE COMP_OFF_ID = :ID
      `,
      { ID: compOffId },
      "siri_db"
    );

    // Step 6: Fetch updated leave balance to include in approval email
    const balRes = await db.executeQuery(
      `
      SELECT ALLOTED, USED_LEAVE, BAL_LEAVE, EXP_COMPOFF
      FROM EMP_LEAVE_MAST
      WHERE EMP_ID = :EMP_ID
        AND LEAVE_ID = (
          SELECT LEAVE_ID
          FROM LEAVE_MASTER
          WHERE SHORT_NAME = 'CF'
        )
        AND CAL_YEAR_ID = (
          SELECT CAL_YEAR_ID
          FROM CALENDAR_YEAR
          WHERE STATUS = 'Y'
        )
      `,
      { EMP_ID: compOff.EMP_ID },
      "siri_db"
    );

    const bal = balRes.rows[0] || {
      ALLOTED: 0,
      USED_LEAVE: 0,
      BAL_LEAVE: 0,
      EXP_COMPOFF: 0,
    };

    // Step 7: Send approval email with credited days and updated balance
    if (empEmail) {
      await emailService.sendEmail(
        "HR Team",
        empEmail,
        "Comp-Off Approved",
        `
        <p>Dear ${empName},</p>
        <p>Your <b style="color:green;">Comp-Off request</b> has been <b style="color:green;">approved</b>.</p>
        <p><b>Credited Days:</b> ${days}</p>
        <p><b>Your Updated Comp-Off Balance:</b></p>
        <ul>
          <li>Earned: ${bal.ALLOTED}</li>
          <li>Used: ${bal.USED_LEAVE}</li>
          <li>Remaining: ${bal.BAL_LEAVE}</li>
          <li>Expired: ${bal.EXP_COMPOFF}</li>
        </ul>
        <p>Regards,<br/>HR Team</p>
        `
      );
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Comp-off approved successfully")
    );

  } catch (err) {
    console.error("Comp-off update error:", err);
    throw new ApiError(500, err.message);
  }
});

module.exports = { getPendingCompoffList, updateCompoffStatus };