const { Router } = require("express");
const {
    getCalendarYearDropdown,
    applyLeaveAllotment
} = require("../../controllers/leavecontroller/leaveallotment.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * Leave Allotment Routes
 * Managed by HR/Admin to assign yearly leave quotas to employees.
 */

// Fetches active calendar years for the allotment selection process
router.get("/", authenticate, getCalendarYearDropdown);

// Processes bulk leave allotment for the selected calendar year
router.post("/yearlyleave", authenticate, applyLeaveAllotment);

module.exports = router;