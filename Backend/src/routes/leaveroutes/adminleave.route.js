const { Router } = require("express");
const {
  getPendingLeaves,
  getLeaveApproveStatusDropdown,
  approveLeave,
  searchEmployeeLeaveDetails
} = require("../../controllers/leavecontroller/adminleave.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * Admin Leave Management Routes
 * Handles administrative oversight and approval processing.
 */

// Retrieve list of leaves awaiting administrative action
router.get("/pending", authenticate, getPendingLeaves);

// Fetch dropdown options for leave approval statuses (e.g., Approved, Rejected)
router.get("/leave-status", authenticate, getLeaveApproveStatusDropdown);

// Process the approval or rejection of a specific leave request
router.post("/approve-leave", authenticate, approveLeave);

// Search and filter leave details across the organization
router.get("/searchleave", authenticate, searchEmployeeLeaveDetails);

module.exports = router;