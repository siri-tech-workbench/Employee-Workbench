const bcrypt = require("bcrypt");
const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

// bcrypt salt rounds — 10 is the standard cost factor balancing security and performance
const SALT_ROUNDS = 10;

/**
 * PUT /user/password
 * Updates the authenticated user's password after verifying the current password.
 * Fetches the stored hash, compares with bcrypt, then hashes and stores the new password.
 *
 * @auth Required — reads user_id from req.user (set by auth middleware)
 * @body {string} current_password
 * @body {string} new_password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  const { user_id } = req.user;
  const { current_password, new_password } = req.body;

  // Fetch the stored hashed password for this user
  const userRes = await db.executeQuery(
    `SELECT PASSWORD FROM USER_MAST WHERE USER_ID = :USER_ID`,
    { USER_ID: user_id },
    "siri_db"
  );

  if (!userRes.rows.length) {
    throw new ApiError(400, "User not found");
  }

  const storedHashedPassword = userRes.rows[0].PASSWORD;

  // Verify the provided current password against the stored hash
  const isMatch = await bcrypt.compare(current_password, storedHashedPassword);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  // Hash the new password before storing
  const newHashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

  // Update the password and record the modification timestamp
  await db.executeQuery(
    `UPDATE USER_MAST
     SET PASSWORD = :PASSWORD,
         MODIFIED_DATE = SYSDATE
     WHERE USER_ID = :USER_ID`,
    { USER_ID: user_id, PASSWORD: newHashedPassword },
    "siri_db"
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Password updated successfully")
  );
});

/**
 * GET /user/employees
 * Returns a dropdown list of all active (WORKING) employees.
 */
const getEmployeeDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        EMP_ID AS "emp_id",
        NAME   AS "emp_name"
      FROM EMP
      WHERE STATUS = 'WORKING'
      ORDER BY NAME
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Employee list fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching employee list:", err);
    throw new ApiError(500, "Error fetching employee list", err.message);
  }
});

/**
 * GET /user/roles
 * Returns a dropdown list of all user role types.
 */
const getRoleDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        USER_TYPE_ID AS "user_type_id",
        USER_TYPES   AS "user_types"
      FROM USER_TYPES
      ORDER BY USER_TYPE_ID
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Role list fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching role list:", err);
    throw new ApiError(500, "Error fetching role list", err.message);
  }
});

/**
 * POST /user/roles
 * Inserts a new user role type into USER_TYPES.
 *
 * @body {string} user_types - The name of the new role
 */
const insertRole = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { user_types } = req.body;

    const query = `
      INSERT INTO USER_TYPES (USER_TYPES)
      VALUES (:USER_TYPES)
    `;

    await db.executeQuery(query, { USER_TYPES: user_types }, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, null, "Role inserted successfully")
    );
  } catch (err) {
    console.error("Error inserting role:", err);
    throw new ApiError(500, "Error inserting role", err.message);
  }
});

/**
 * GET /user/users
 * Returns all users with their employee details.
 * Optionally filters by a specific USER_ID passed as a query param.
 *
 * @query {number} [USER_ID] - Optional filter for a single user
 */
const getUsers = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { USER_ID } = req.query;

    const query = `
      SELECT
        u.USER_ID,
        u.LOGIN_ID,
        u.EMP_ID,
        e.NAME AS EMP_NAME,
        u.USER_TYPE_ID
      FROM USER_MAST u
      JOIN EMP e ON e.EMP_ID = u.EMP_ID
      WHERE (:USER_ID IS NULL OR u.USER_ID = :USER_ID)
      ORDER BY u.USER_ID
    `;

    const binds = {
      USER_ID: USER_ID ? Number(USER_ID) : null,
    };

    const result = await db.executeQuery(query, binds, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "User list fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching user list:", err);
    throw new ApiError(500, "Error fetching user list", err.message);
  }
});

/**
 * PUT /user/users/:id
 * Updates an existing user's login ID, employee link, role, and optionally password.
 * Password is only updated if a non-empty value is provided in the request body.
 *
 * @param {number} id - USER_ID from the route param
 * @body {string} login_id
 * @body {number} emp_id
 * @body {number} user_type_id
 * @body {string} [password] - If provided and non-empty, will be hashed and updated
 */
const updateUser = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { id } = req.params;
    const { login_id, emp_id, password, user_type_id } = req.body;

    if (!id) {
      throw new ApiError(400, "USER_ID is required");
    }

    // Only hash and update the password if a new one was explicitly provided
    let hashedPassword = null;
    if (password && typeof password === "string" && password.trim()) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Build query dynamically to avoid overwriting the existing password when not changing it
    let query = `
      UPDATE USER_MAST
      SET
        LOGIN_ID      = :LOGIN_ID,
        EMP_ID        = :EMP_ID,
        USER_TYPE_ID  = :USER_TYPE_ID,
        MODIFIED_DATE = SYSDATE
    `;

    if (hashedPassword) {
      query += `, PASSWORD = :PASSWORD`;
    }

    query += ` WHERE USER_ID = :USER_ID`;

    const data = {
      USER_ID: id,
      LOGIN_ID: login_id,
      EMP_ID: emp_id,
      USER_TYPE_ID: user_type_id,
      ...(hashedPassword && { PASSWORD: hashedPassword }),
    };

    await db.executeQuery(query, data, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, null, "User updated successfully")
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "User update failed",
      error
    );
  }
});

/**
 * POST /user/users
 * Creates a new user account with a hashed password.
 * Passwords are never stored as plain text.
 *
 * @body {string} login_id
 * @body {number} emp_id
 * @body {string} password - Plain text, will be hashed before storing
 * @body {number} user_type_id
 */
const createUser = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { login_id, emp_id, password, user_type_id } = req.body;

    // Hash password before inserting — plain text passwords must never reach the database
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO USER_MAST (
        LOGIN_ID,
        EMP_ID,
        PASSWORD,
        USER_TYPE_ID,
        CREATE_DATE
      ) VALUES (
        :LOGIN_ID,
        :EMP_ID,
        :PASSWORD,
        :USER_TYPE_ID,
        SYSDATE
      )
    `;

    const data = {
      LOGIN_ID: login_id,
      EMP_ID: emp_id,
      PASSWORD: hashedPassword,
      USER_TYPE_ID: user_type_id,
    };

    await db.executeQuery(query, data, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, null, "User created successfully")
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "User creation failed",
      error
    );
  }
});

/**
 * GET /user/search
 * Searches for a user by exact login ID (case-insensitive).
 * Returns user details with linked employee name.
 *
 * @query {string} login_id - The login ID to search for
 */
const searchUsersByLoginId = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { login_id } = req.query;

  if (!login_id || typeof login_id !== "string") {
    throw new ApiError(400, "Invalid LOGIN_ID");
  }

  const query = `
    SELECT
      u.USER_ID,
      u.LOGIN_ID,
      u.EMP_ID,
      e.NAME AS EMP_NAME,
      u.USER_TYPE_ID
    FROM USER_MAST u
    LEFT JOIN EMP e ON e.EMP_ID = u.EMP_ID
    WHERE UPPER(u.LOGIN_ID) = UPPER(:login_id)
    ORDER BY u.LOGIN_ID
  `;

  const result = await db.executeQuery(query, { login_id }, "siri_db");

  return res.status(200).json(
    new ApiResponse(200, result.rows || [], "Users found")
  );
});

module.exports = {
  updatePassword,
  getEmployeeDropdown,
  getRoleDropdown,
  insertRole,
  getUsers,
  updateUser,
  createUser,
  searchUsersByLoginId,
};