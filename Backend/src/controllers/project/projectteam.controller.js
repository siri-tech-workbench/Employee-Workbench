const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * Helper — executes a simple SELECT query against siri_db and returns rows.
 * Used internally by dropdown fetchers to avoid repeated boilerplate.
 *
 * @param {string} query - SQL query string
 * @param {string} label - Human-readable name used in error messages (e.g. "project")
 * @returns {Array} result rows
 */
const fetchDropdown = async (query, label) => {
  const db = new DatabaseHandler();
  const result = await db.executeQuery(query, {}, "siri_db");
  return result.rows || [];
};

/**
 * GET /dropdown/projects
 * Returns all projects as a dropdown list (id + name).
 */
const getProjectDropdown = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT
        PROJECT_ID   AS "project_id",
        PROJECT_NAME AS "project_name"
      FROM PROJECT
      ORDER BY PROJECT_ID ASC
    `;

    const rows = await fetchDropdown(query, "project");

    return res.status(200).json(new ApiResponse(200, rows, "Projects fetched successfully"));
  } catch (err) {
    console.error("Error fetching projects:", err);
    throw new ApiError(500, "Error fetching projects", err.message);
  }
});

/**
 * GET /dropdown/roles
 * Returns all project roles as a dropdown list (id + name).
 */
const getRoleDropdown = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT
        ROLE_ID   AS "role_id",
        ROLE_NAME AS "role_name"
      FROM PROJECT_ROLE
      ORDER BY ROLE_ID ASC
    `;

    const rows = await fetchDropdown(query, "role");

    return res.status(200).json(new ApiResponse(200, rows, "Roles fetched successfully"));
  } catch (err) {
    console.error("Error fetching roles:", err);
    throw new ApiError(500, "Error fetching roles", err.message);
  }
});

/**
 * GET /dropdown/statuses
 * Returns all employee project statuses as a dropdown list (id + name).
 */
const getStatusDropdown = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT
        STATUS_ID   AS "status_id",
        STATUS_NAME AS "status_name"
      FROM PROJECT_EMP_STATUS
      ORDER BY STATUS_ID ASC
    `;

    const rows = await fetchDropdown(query, "status");

    return res.status(200).json(new ApiResponse(200, rows, "Statuses fetched successfully"));
  } catch (err) {
    console.error("Error fetching statuses:", err);
    throw new ApiError(500, "Error fetching statuses", err.message);
  }
});

/**
 * POST /project-team
 * Creates a new project team entry assigning an employee to a project with a role and status.
 *
 * @body {number} project_id
 * @body {number} emp_id
 * @body {number} role_id
 * @body {number} status_id
 * @body {string} start_date - ISO date string
 * @body {string} [end_date] - ISO date string, optional
 */
const createProjectTeam = asyncHandler(async (req, res) => {
  try {
    const { project_id, emp_id, role_id, status_id, start_date, end_date } = req.body;

    const db = new DatabaseHandler();

    const query = `
      INSERT INTO PROJECT_TEAM (
        PROJECT_ID,
        EMP_ID,
        ROLE_ID,
        STATUS_ID,
        START_DATE,
        END_DATE
      ) VALUES (
        :project_id,
        :emp_id,
        :role_id,
        :status_id,
        :start_date,
        :end_date
      )
    `;

    const params = {
      project_id,
      emp_id,
      role_id,
      status_id,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
    };

    await db.executeQuery(query, params, "siri_db");

    return res.status(201).json(new ApiResponse(201, null, "Project team created successfully"));
  } catch (err) {
    console.error("Error creating project team:", err);
    throw new ApiError(500, "Error creating project team", err.message);
  }
});

/**
 * PUT /project-team/:team_id
 * Updates an existing project team entry by team ID.
 *
 * @param {number} team_id - ID of the team record to update
 * @body {number} project_id
 * @body {number} emp_id
 * @body {number} role_id
 * @body {number} status_id
 * @body {string} start_date - ISO date string
 * @body {string} [end_date] - ISO date string, optional
 */
const updateProjectTeam = asyncHandler(async (req, res) => {
  try {
    const { team_id } = req.params;

    if (!team_id) {
      throw new ApiError(400, "Team ID is required");
    }

    const { project_id, emp_id, role_id, status_id, start_date, end_date } = req.body;

    const db = new DatabaseHandler();

    const query = `
      UPDATE PROJECT_TEAM
      SET
        PROJECT_ID = :project_id,
        EMP_ID     = :emp_id,
        ROLE_ID    = :role_id,
        STATUS_ID  = :status_id,
        START_DATE = :start_date,
        END_DATE   = :end_date
      WHERE TEAM_ID = :team_id
    `;

    const params = {
      team_id,
      project_id,
      emp_id,
      role_id,
      status_id,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
    };

    await db.executeQuery(query, params, "siri_db");

    return res.status(200).json(new ApiResponse(200, null, "Project team updated successfully"));
  } catch (err) {
    console.error("Error updating project team:", err);
    throw new ApiError(500, "Error updating project team", err.message);
  }
});

/**
 * GET /project-team
 * Returns all project team entries with joined details from related tables:
 * project name, employee name, login ID, role name, and status name.
 */
const getProjectTeam = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        pt.TEAM_ID,
        pt.PROJECT_ID,
        pt.EMP_ID,
        pt.ROLE_ID,
        pt.STATUS_ID,
        p.PROJECT_NAME,
        e.NAME,
        um.LOGIN_ID,
        pr.ROLE_NAME,
        ps.STATUS_NAME,
        pt.START_DATE,
        pt.END_DATE
      FROM PROJECT_TEAM pt
      JOIN PROJECT          p  ON p.PROJECT_ID  = pt.PROJECT_ID
      JOIN EMP              e  ON e.EMP_ID       = pt.EMP_ID
      JOIN USER_MAST        um ON um.EMP_ID      = pt.EMP_ID
      JOIN PROJECT_ROLE     pr ON pr.ROLE_ID     = pt.ROLE_ID
      JOIN PROJECT_EMP_STATUS ps ON ps.STATUS_ID = pt.STATUS_ID
      ORDER BY pt.TEAM_ID DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(
      new ApiResponse(200, result.rows || [], "Project team fetched successfully")
    );
  } catch (err) {
    console.error("Error fetching project team:", err);
    throw new ApiError(500, "Error fetching project team", err.message);
  }
});

module.exports = {
  getProjectDropdown,
  getRoleDropdown,
  getStatusDropdown,
  createProjectTeam,
  updateProjectTeam,
  getProjectTeam,
};