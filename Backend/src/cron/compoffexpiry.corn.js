const cron = require("node-cron");
const { DatabaseHandler } = require("../utils");

/**
 * Comp-Off Expiry Cron Job
 * Runs daily at 00:05 to process all expired comp-off records.
 *
 * For each expired comp-off entry with a remaining balance:
 *   1. Adds the remaining days to EXP_COMPOFF in EMP_LEAVE_MAST
 *   2. Recalculates the employee's comp-off balance (BAL_LEAVE)
 *   3. Marks the COMP_OFF record status as 3 (Expired)
 *
 * The entire operation runs in a single PL/SQL block with COMMIT/ROLLBACK,
 * so it is atomic — either all records are processed or none are.
 *
 * Comp-Off leave is identified by SHORT_NAME = 'CF' in LEAVE_MASTER.
 * Duration is stored as HH:MM string and converted to days (assuming 8-hour workday).
 */
cron.schedule("5 0 * * *", async () => {

  const db = new DatabaseHandler();

  // PL/SQL block: processes all expired comp-off records in a single atomic transaction.
  // Uses a cursor (c_exp) to loop over expired entries with a remaining balance.
  // REMAINING_DAYS is calculated from the HH:MM duration string minus already-used days.
  const plsql = `
    DECLARE
      -- Cursor selects all comp-off records that have expired and still have a remaining balance
      CURSOR c_exp IS
        SELECT
          c.COMP_OFF_ID,
          c.EMP_ID,

          -- Convert HH:MM duration to fractional days (8-hour workday), subtract used days
          ROUND(
            (
              TO_NUMBER(SUBSTR(c.DURATION, 1, 2)) +
              TO_NUMBER(SUBSTR(c.DURATION, 4, 2)) / 60
            ) / 8,
            2
          ) - NVL(c.USED_DAYS, 0) AS REMAINING_DAYS

        FROM COMP_OFF c
        WHERE c.STATUS = 1
          AND c.EXPIRES_ON < TRUNC(SYSDATE)
          AND (
            ROUND(
              (
                TO_NUMBER(SUBSTR(c.DURATION, 1, 2)) +
                TO_NUMBER(SUBSTR(c.DURATION, 4, 2)) / 60
              ) / 8,
              2
            ) - NVL(c.USED_DAYS, 0)
          ) > 0;

      v_comp_id  COMP_OFF.COMP_OFF_ID%TYPE;
      v_emp_id   COMP_OFF.EMP_ID%TYPE;
      v_days     NUMBER;
      v_cf_id    NUMBER;
      v_year_id  NUMBER;

    BEGIN
      -- Resolve the Comp-Off leave type ID from the leave master
      SELECT LEAVE_ID
      INTO v_cf_id
      FROM LEAVE_MASTER
      WHERE SHORT_NAME = 'CF';

      -- Resolve the currently active calendar year
      SELECT CAL_YEAR_ID
      INTO v_year_id
      FROM CALENDAR_YEAR
      WHERE STATUS = 'Y';

      OPEN c_exp;
      LOOP
        FETCH c_exp INTO v_comp_id, v_emp_id, v_days;
        EXIT WHEN c_exp%NOTFOUND;

        -- Add expired days to EXP_COMPOFF and recalculate the remaining balance
        -- Balance formula: allotted - used - total_expired (including current batch)
        UPDATE EMP_LEAVE_MAST
        SET
          EXP_COMPOFF = ROUND(NVL(EXP_COMPOFF, 0) + v_days, 2),
          BAL_LEAVE   = ROUND(
            NVL(ALLOTED, 0)
            - NVL(USED_LEAVE, 0)
            - (NVL(EXP_COMPOFF, 0) + v_days),
            2
          )
        WHERE EMP_ID      = v_emp_id
          AND LEAVE_ID    = v_cf_id
          AND CAL_YEAR_ID = v_year_id;

        -- Mark the comp-off record as expired (STATUS = 3)
        UPDATE COMP_OFF
        SET STATUS = 3
        WHERE COMP_OFF_ID = v_comp_id;

      END LOOP;
      CLOSE c_exp;

      COMMIT;

    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
    END;
  `;

  try {
    await db.executeQuery(plsql, {}, "siri_db");
  } catch (err) {
    // Log the full error so it is visible in server logs even though cron jobs
    // do not have a request/response cycle to surface errors through
    console.error("Comp-off expiry cron failed:", err);
  }
});