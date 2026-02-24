const cron = require("node-cron");
const { DatabaseHandler } = require("../utils");

/**
 * Earned Leave Monthly Accrual Cron Job
 * Runs on the 1st of every month at midnight (00:00).
 *
 * Increments ALLOTED and BAL_LEAVE by 1 day in EMP_LEAVE_MAST
 * for all active employees (status = 'WORKING') whose leave type
 * matches 'EARNED LEAVE' in LEAVE_MASTER.
 *
 * The operation is atomic — a single UPDATE + COMMIT inside PL/SQL.
 * If it fails, no partial changes are applied (Oracle implicit rollback on error).
 *
 * Note: This file self-registers the cron job on require() and has no exports.
 * It must be required once at app startup (e.g. in server.js or app.js).
 */
cron.schedule("0 0 1 * *", async () => {

  const db = new DatabaseHandler();

  // PL/SQL block: looks up the Earned Leave ID dynamically and increments
  // allotment and balance by 1 for all currently active employees.
  const plsql = `
    DECLARE
      v_el_id NUMBER;
    BEGIN
      -- Resolve the Earned Leave type ID from the leave master
      SELECT leave_id
      INTO v_el_id
      FROM leave_master
      WHERE UPPER(leave_name) = 'EARNED LEAVE';

      -- Increment allotment and balance by 1 for all active employees with this leave type
      UPDATE emp_leave_mast elm
      SET
        elm.alloted   = elm.alloted + 1,
        elm.bal_leave = elm.bal_leave + 1
      WHERE elm.leave_id = v_el_id
        AND EXISTS (
          SELECT 1
          FROM emp e
          WHERE e.emp_id = elm.emp_id
            AND e.status = 'WORKING'
        );

      COMMIT;
    END;
  `;

  try {
    await db.executeQuery(plsql, {}, "siri_db");
  } catch (err) {
    // Log the full error — cron jobs have no request/response cycle
    // so errors must be captured here to appear in server logs
    console.error("Earned leave accrual cron failed:", err);
  }
});