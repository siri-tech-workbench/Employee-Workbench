const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
  getProjectDropdown,
  getRoleDropdown,
  getStatusDropdown,
  createProjectTeam,
  updateProjectTeam,
  getProjectTeam
} = require("../../controllers/project/projectteam.controller");

const router = Router();

/**
 * Project Team Management Routes
 * Handles the assignment of employees to projects and role definitions.
 */

// Dropdown data for team configuration
router.get("/getproject", authenticate, getProjectDropdown);
router.get("/getrole", authenticate, getRoleDropdown);
router.get("/getstatus", authenticate, getStatusDropdown);

// Team Member Management
router.post("/createteam", authenticate, createProjectTeam);
router.put("/updateteam/:team_id", authenticate, updateProjectTeam);

// Retrieval of team composition data
router.get("/getteamtable", authenticate, getProjectTeam);

module.exports = router;