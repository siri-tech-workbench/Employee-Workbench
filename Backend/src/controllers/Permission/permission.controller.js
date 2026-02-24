const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * GET /permission/:emp_id
 * Fetches all permission records for a specific employee by their ID,
 * ordered by permission date and ID descending.
 */
const getEmpPermission = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const empId = req.params.emp_id;

    const query = `
      SELECT
        p.PERM_ID                            AS "perm_id",
        p.EMP_ID                             AS "emp_id",
        e.NAME                               AS "emp_name",
        p.FROM_TIME                          AS "from_time",
        p.TO_TIME                            AS "to_time",
        p.APPLIED_TIME                       AS "applied_time",
        TO_CHAR(p.PERM_DATE, 'DD-MON-YYYY') AS "perm_date",
        p.PERM_DURATION                      AS "perm_duration",
        p.PERM_REASON                        AS "perm_reason",
        p.STATUS                             AS "status",
        p.REMARKS                            AS "remarks"
      FROM PERMISSION p
      JOIN EMP e
        ON e.EMP_ID = p.EMP_ID
      WHERE p.EMP_ID = :empId
      ORDER BY p.PERM_DATE DESC, p.PERM_ID DESC
    `;

    const result = await db.executeQuery(query, { empId }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Employee permissions fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching employee permissions:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /permission/create
 * Creates a new permission request for an employee.
 * Enforces a monthly limit of 2 permissions per employee.
 * Extracts month and year from perm_date to check the current month's usage count.
 */
const postEmpPermission = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const {
      emp_id,
      perm_date,
      from_time,
      to_time,
      perm_reason,
      perm_duration,
      status,
      remarks,
      applied_time,
    } = req.body;

    // Extract month and year from the permission date for monthly limit check
    const month = perm_date.substring(5, 7);
    const year = perm_date.substring(0, 4);

    // Check how many permissions the employee has already used this month
    const checkQuery = `
      SELECT COUNT(*) AS CNT
      FROM PERMISSION
      WHERE EMP_ID = :EMP_ID
        AND EXTRACT(MONTH FROM PERM_DATE) = :MONTH
        AND EXTRACT(YEAR  FROM PERM_DATE) = :YEAR
    `;

    const checkResult = await db.executeQuery(
      checkQuery,
      { EMP_ID: emp_id, MONTH: month, YEAR: year },
      "siri_db"
    );

    const count = checkResult.rows[0]?.CNT || 0;

    // Reject if the employee has already used their 2-permission monthly limit
    if (count >= 2) {
      return res.status(400).json(
        new ApiResponse(400, null, "You have already used your 2 permissions for this month")
      );
    }

    // Insert the new permission request
    const insertQuery = `
      INSERT INTO PERMISSION (
        EMP_ID,
        PERM_DATE,
        FROM_TIME,
        TO_TIME,
        PERM_REASON,
        PERM_DURATION,
        STATUS,
        REMARKS,
        APPLIED_TIME
      )
      VALUES (
        :EMP_ID,
        TO_DATE(:PERM_DATE, 'YYYY-MM-DD'),
        :FROM_TIME,
        :TO_TIME,
        :PERM_REASON,
        :PERM_DURATION,
        :STATUS,
        :REMARKS,
        :APPLIED_TIME
      )
    `;

    await db.executeQuery(
      insertQuery,
      {
        EMP_ID: emp_id,
        PERM_DATE: perm_date,
        FROM_TIME: from_time,
        TO_TIME: to_time,
        PERM_REASON: perm_reason,
        PERM_DURATION: perm_duration,
        STATUS: status,
        REMARKS: remarks,
        APPLIED_TIME: applied_time,
      },
      "siri_db"
    );

    return res.status(201).json(
      new ApiResponse(201, null, "Permission request created successfully")
    );
  } catch (error) {
    console.error("Error creating permission request:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /permission/all
 * Fetches all permission records across all employees,
 * ordered by permission date and ID descending.
 */
const getAllPermissions = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        p.PERM_ID                            AS "perm_id",
        p.EMP_ID                             AS "emp_id",
        e.NAME                               AS "emp_name",
        p.FROM_TIME                          AS "from_time",
        p.TO_TIME                            AS "to_time",
        p.APPLIED_TIME                       AS "applied_time",
        TO_CHAR(p.PERM_DATE, 'DD-MON-YYYY') AS "perm_date",
        p.PERM_DURATION                      AS "perm_duration",
        p.PERM_REASON                        AS "perm_reason",
        p.STATUS                             AS "status",
        p.REMARKS                            AS "remarks"
      FROM PERMISSION p
      JOIN EMP e
        ON e.EMP_ID = p.EMP_ID
      ORDER BY p.PERM_DATE DESC, p.PERM_ID DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "All permissions fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /permission/today
 * Fetches all permission requests for today, ordered by from_time ascending.
 * Used to display the daily permission schedule.
 * Date range uses TRUNC(SYSDATE) to TRUNC(SYSDATE) + 1 to capture the full day.
 */
const getTodayPermissions = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        p.PERM_ID                         AS "perm_id",
        e.NAME                            AS "emp_name",
        p.FROM_TIME                       AS "from_time",
        p.TO_TIME                         AS "to_time",
        p.PERM_REASON                     AS "perm_reason"
      FROM PERMISSION p
      JOIN EMP e
        ON e.EMP_ID = p.EMP_ID
      WHERE p.PERM_DATE >= TRUNC(SYSDATE)
        AND p.PERM_DATE  < TRUNC(SYSDATE) + 1
      ORDER BY SUBSTR(p.FROM_TIME, 1, 5)
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows, "Today's permissions fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching today's permissions:", error);
    throw new ApiError(500, "Failed to fetch today's permissions");
  }
});

module.exports = {
  getEmpPermission,
  postEmpPermission,
  getAllPermissions,
  getTodayPermissions
};