const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
    getEmployeeDropdown,
    getEmployeeLeaveGrid,
    getCalendarYearDropdown,
    postLeaveSingleEmployee,
    updateLeaveSingleEmployee,
} = require("../../controllers/SingleLeaveAllotment/SingleLeaveAllotment.controller");

const router = Router();

/**
 * Single Employee Leave Allotment Routes
 * Facilitates individual adjustments to leave balances and quotas.
 */

// Dropdown data for employee selection
router.get("/dd", authenticate, getEmployeeDropdown);

// Retrieves the leave balance grid for a specific selection
router.get("/grid", authenticate, getEmployeeLeaveGrid);

// Dropdown data for selecting the applicable calendar year
router.get("/caldd", authenticate, getCalendarYearDropdown);

/**
 * Leave Quota Management
 * POST: Initializes leave allotment for a single employee
 * PUT: Updates existing allotment values
 */
router.post("/", authenticate, postLeaveSingleEmployee);
router.put("/", authenticate, updateLeaveSingleEmployee);

module.exports = router;