const { DatabaseHandler, EmailService, ApiError, ApiResponse, asyncHandler } = require("../../utils");
const OracleDB = require("oracledb");
const { signToken } = require("../../utils/token.util");
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const dayjs = require("dayjs");

// Initialize email service instance for forgot password and reset notifications
const emailService = new EmailService();

/**
 * GET /auth/locations
 * Fetches all available working location options for the login location dropdown,
 * ordered by location ID ascending.
 */
const getLocationDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        emp_loc_id   AS "emp_loc_id",
        emp_loc_name AS "emp_loc_name"
      FROM emp_working_loc
      ORDER BY emp_loc_id
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Location list fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching location dropdown:", err);
    throw new ApiError(500, "Error fetching location", err.message);
  }
});

/**
 * POST /auth/signin
 * Authenticates an employee using an AES-encrypted login payload.
 *
 * Flow:
 *   1. Decrypts the AES-encrypted payload from the request body.
 *   2. Runs an Oracle PL/SQL block to fetch user credentials and record login details.
 *   3. Compares the submitted password against the stored bcrypt hash.
 *   4. Signs a JWT token and stores it in LOGIN_DETAILS.
 *   5. Returns the token and user identity details on success.
 *
 * The PL/SQL block handles duplicate login_date + emp_id gracefully by
 * falling back to the existing LOGIN_DETAILS record and logging to login_log_details.
 */
const signin = asyncHandler(async (req, res) => {
  try {
    if (!req.body.payload) {
      throw new ApiError(400, "Encrypted payload is required");
    }

    // Step 1: Decrypt AES-encrypted login credentials from the request body
    let decryptedData;
    try {
      const bytes = CryptoJS.AES.decrypt(req.body.payload, process.env.LOGIN_SECRET_KEY);
      decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (err) {
      throw new ApiError(400, "Invalid encrypted login payload");
    }

    const { login_id, password, login_type } = decryptedData;
    const { latitude, longitude, login_os, device_type } = req.body;

    if (!login_id || !password || !login_type) {
      throw new ApiError(400, "Login ID, Password and Login Type are required");
    }

    const db = new DatabaseHandler();

    // Step 2: Execute PL/SQL block to fetch user credentials and insert login record.
    // Password comparison is intentionally excluded from the PL/SQL block —
    // bcrypt comparison is handled in Node.js (see Step 3).
    const query = `
      DECLARE
        v_login_id_input  VARCHAR2(50) := :login_id_input;
        v_login_id_output VARCHAR2(50);
        v_password_output USER_MAST.PASSWORD%TYPE;
        v_emp_id          NUMBER;
        v_user_id         NUMBER;
        v_login_id        NUMBER;
        v_group_id        NUMBER;
        v_latitude        VARCHAR2(50) := :latitude;
        v_longitude       VARCHAR2(50) := :longitude;
        v_login_os        VARCHAR2(50) := :login_os;
        v_device_type     VARCHAR2(50) := :device_type;
        v_login_type      VARCHAR2(50) := :login_type;
        v_client_ip       VARCHAR2(50) := :client_ip;
        v_status          NUMBER := 1;
      BEGIN
        BEGIN
          SELECT user_id, login_id, emp_id, password, group_id
          INTO   v_user_id, v_login_id_output, v_emp_id, v_password_output, v_group_id
          FROM   user_mast
          WHERE  login_id = v_login_id_input;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            v_status := 0;
            RETURN;
        END;

        BEGIN
          INSERT INTO login_log_details (login_dt, login_tm, user_id, latitude, longitude)
          VALUES (TRUNC(SYSDATE), TO_CHAR(SYSDATE, 'HH:MI:SS AM'), v_user_id, v_latitude, v_longitude);

          INSERT INTO login_details (
            user_id, emp_id, login_date, login_time,
            login_type, login_os, lattitude, longitude,
            client_ip, device_type
          )
          VALUES (
            v_user_id, v_emp_id, TRUNC(SYSDATE),
            TO_CHAR(SYSDATE, 'HH:MI:SS AM'),
            v_login_type, v_login_os,
            v_latitude, v_longitude,
            v_client_ip, v_device_type
          )
          RETURNING login_id INTO v_login_id;

        EXCEPTION
          -- If a login record already exists for this employee today, reuse it
          WHEN dup_val_on_index THEN
            INSERT INTO login_log_details (login_dt, login_tm, user_id, latitude, longitude)
            VALUES (TRUNC(SYSDATE), TO_CHAR(SYSDATE, 'HH:MI:SS AM'), v_user_id, v_latitude, v_longitude);

            SELECT login_id INTO v_login_id
            FROM   login_details
            WHERE  login_date = TRUNC(SYSDATE)
              AND  emp_id = v_emp_id;
        END;

        :out_login_id      := v_login_id;
        :out_emp_id        := v_emp_id;
        :out_user_id       := v_user_id;
        :out_status        := v_status;
        :out_password_hash := v_password_output;
        :out_group_id      := v_group_id;
      END;
    `;

    const bindParams = {
      login_id_input: login_id,
      latitude,
      longitude,
      login_os,
      device_type,
      login_type,
      client_ip: req.ip,
      out_login_id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER },
      out_emp_id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER },
      out_user_id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER },
      out_status: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER },
      out_password_hash: { dir: OracleDB.BIND_OUT, type: OracleDB.STRING, maxSize: 4000 },
      out_group_id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER },
    };

    const result = await db.executeQuery(query, bindParams, "siri_db");

    const { out_status, out_user_id, out_emp_id, out_login_id, out_password_hash, out_group_id } =
      result.outBinds;

    // User not found in DB (PL/SQL returned status = 0)
    if (!out_status || !out_password_hash) {
      throw new ApiError(401, "Invalid username or password");
    }

    // Step 3: Compare submitted password against stored bcrypt hash
    const isValidPassword = await bcrypt.compare(password, out_password_hash);
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid username or password");
    }

    // Step 4: Sign a JWT token containing user identity and store it in LOGIN_DETAILS
    const token = signToken({
      user_id: out_user_id,
      emp_id: out_emp_id,
      login_id: out_login_id,
      group_id: out_group_id,
    });

    await db.executeQuery(
      `UPDATE login_details SET auth = :token WHERE login_id = :login_id`,
      { token, login_id: out_login_id },
      "siri_db"
    );

    // Step 5: Return token and user identity to the client
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token,
          user: {
            user_id: out_user_id,
            emp_id: out_emp_id,
            login_id: out_login_id,
            group_id: out_group_id,
          },
        },
        "Login successful"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message || "Signin failed", error);
  }
});

/**
 * GET /auth/dashboard
 * Fetches attendance and leave status for all active employees for a given date.
 * Accepts an optional `date` query parameter (defaults to today).
 *
 * Each employee is returned with one of three statuses:
 *   - ON_LEAVE     : has an approved leave covering the selected date
 *   - LOGGED_IN    : has a login record for the selected date
 *   - NOT_LOGGED_IN: no login or leave record found
 *
 * Results are ordered: LOGGED_IN → ON_LEAVE → NOT_LOGGED_IN, then alphabetically by name.
 */
const getDashboardDetails = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    // Default to today if no date is provided in the query
    const selectedDate = req.query.date
      ? dayjs(req.query.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    const query = `
      SELECT
        E.NAME AS "name",

        CASE
          WHEN LE.EMP_ID IS NOT NULL THEN 'ON_LEAVE'
          WHEN L.USER_ID IS NOT NULL THEN 'LOGGED_IN'
          ELSE 'NOT_LOGGED_IN'
        END AS "status",

        L.LOGIN_TYPE    AS "login_type",
        L.LOGIN_TIME    AS "login_time",
        L.LOGOUT_TIME   AS "logout_time",
        L.WORK_DURATION AS "work_duration"

      FROM EMP E
      JOIN USER_MAST U
        ON U.EMP_ID = E.EMP_ID

      -- Match login record for the selected date
      LEFT JOIN LOGIN_DETAILS L
        ON L.USER_ID = U.USER_ID
       AND TRUNC(L.LOGIN_DATE) = TRUNC(TO_DATE(:selectedDate, 'YYYY-MM-DD'))

      -- Match approved leave covering the selected date
      LEFT JOIN EMP_LEAVE_DETAIL LE
        ON LE.EMP_ID = E.EMP_ID
       AND LE.STATUS IN (1, 2)
       AND TRUNC(TO_DATE(:selectedDate, 'YYYY-MM-DD'))
           BETWEEN TRUNC(LE.APPROVED_FROM)
               AND TRUNC(NVL(LE.APPROVED_TO, LE.APPROVED_FROM))

      WHERE E.STATUS = 'WORKING'

      ORDER BY
        CASE
          WHEN LE.EMP_ID IS NOT NULL THEN 2
          WHEN L.USER_ID IS NOT NULL THEN 1
          ELSE 3
        END,
        E.NAME
    `;

    const result = await db.executeQuery(query, { selectedDate }, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Dashboard data fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching dashboard details:", err);
    throw new ApiError(500, "Error fetching dashboard data");
  }
});

/**
 * POST /auth/forgot-password
 * Generates a time-limited AES-encrypted reset token (valid for 10 minutes)
 * and sends a password reset link to the employee's registered email address.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { login_id } = req.body;

  if (!login_id) {
    throw new ApiError(400, "Login ID is required");
  }

  const db = new DatabaseHandler();

  const result = await db.executeQuery(
    `
    SELECT U.USER_ID, E.EMAIL_ID
    FROM USER_MAST U
    JOIN EMP E ON E.EMP_ID = U.EMP_ID
    WHERE U.LOGIN_ID = :login_id
    `,
    { login_id },
    "siri_db"
  );

  if (!result.rows.length) {
    throw new ApiError(400, "Invalid login ID");
  }

  // Embed user ID and expiry timestamp in the reset token (expires in 10 minutes)
  const tokenPayload = {
    user_id: result.rows[0].USER_ID,
    exp: Date.now() + 10 * 60 * 1000,
  };

  const resetToken = CryptoJS.AES.encrypt(
    JSON.stringify(tokenPayload),
    process.env.LOGIN_SECRET_KEY
  ).toString();

  const resetLink = `${process.env.FRONTEND_URL}/#/reset-password?token=${encodeURIComponent(resetToken)}`;

  await emailService.sendEmail(
    "SIRI Workbench",
    result.rows[0].EMAIL_ID,
    "Reset Your Password",
    `
      <p>Click the link below to reset your password. This link is valid for 10 minutes.</p>
      <a href="${resetLink}">${resetLink}</a>
    `
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Reset link sent to email")
  );
});

/**
 * POST /auth/reset-password
 * Resets the employee's password using a valid AES-encrypted reset token.
 *
 * Validations:
 *   - Token must be decryptable and not expired.
 *   - New password must be at least 6 characters.
 *   - New password must differ from the current password.
 *
 * Stores the new bcrypt hash and updates MODIFIED_DATE in USER_MAST.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    throw new ApiError(400, "Token and new password are required");
  }

  // Decrypt the AES reset token to extract user ID and expiry
  let tokenData;
  try {
    const bytes = CryptoJS.AES.decrypt(token, process.env.LOGIN_SECRET_KEY);
    tokenData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    throw new ApiError(400, "Invalid reset link");
  }

  const { user_id, exp } = tokenData;

  if (!user_id || Date.now() > exp) {
    throw new ApiError(400, "Reset link has expired or is invalid");
  }

  if (new_password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const db = new DatabaseHandler();

  // Fetch the current password hash to check against the new password
  const userRes = await db.executeQuery(
    `
    SELECT PASSWORD
    FROM USER_MAST
    WHERE USER_ID = :USER_ID
    `,
    { USER_ID: user_id },
    "siri_db"
  );

  if (!userRes.rows.length) {
    throw new ApiError(400, "User not found");
  }

  const oldHash = userRes.rows[0].PASSWORD;

  // Prevent reuse of the current password
  const isSame = await bcrypt.compare(new_password, oldHash);
  if (isSame) {
    throw new ApiError(400, "New password must be different from your current password");
  }

  // Hash the new password and update the record
  const newHash = await bcrypt.hash(new_password, 10);

  await db.executeQuery(
    `
    UPDATE USER_MAST
    SET PASSWORD      = :PASSWORD,
        MODIFIED_DATE = SYSDATE
    WHERE USER_ID = :USER_ID
    `,
    { PASSWORD: newHash, USER_ID: user_id },
    "siri_db"
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Password reset successful")
  );
});

module.exports = {
  getLocationDropdown,
  signin,
  getDashboardDetails,
  forgotPassword,
  resetPassword,
};