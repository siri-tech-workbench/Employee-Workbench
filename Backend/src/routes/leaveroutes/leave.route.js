const { Router } = require("express");
const {
  getLeaveTypeDropdown,
  applyLeave,
  getRemainingLeave,
  calculateLeaveDays,
  getEmployeeLeaveDetail,
  getEmployeeLeaveCards,
  previewLeaveDocument,
  getEmployeeLopDays,
  checkLeaveOverlap,
  getTodayApprovedLeavesForAdmin
} = require("../../controllers/leavecontroller/leave.controller");

const { authenticate } = require('../../middlewares/auth.middleware');
const upload = require("../../middlewares/upload.middleware");

const router = Router();

/**
 * Employee Leave Management Routes
 * Handles leave application, balance tracking, and document previews.
 */

// Fetches available leave types for dropdown selection
router.get("/", authenticate, getLeaveTypeDropdown);

// Submits a new leave application with optional document attachments
router.post("/apply", authenticate, upload.array("files"), applyLeave);

// Checks the remaining balance for a specific leave category
router.get("/remaining/:leave_id", authenticate, getRemainingLeave);

// Utility to calculate the number of workdays between two dates
router.post("/calculate-days", authenticate, calculateLeaveDays);

// Retrieves personal leave history and status cards for the dashboard
router.get("/history", authenticate, getEmployeeLeaveDetail);
router.get("/cards", authenticate, getEmployeeLeaveCards);

// Fetches Loss of Pay (LOP) count for the authenticated employee
router.get("/getlopcount", authenticate, getEmployeeLopDays);

// Validation to prevent overlapping leave applications
router.post("/checkoverlap", authenticate, checkLeaveOverlap);

// Admin utility to view all approved leaves for the current day
router.get("/gettodaysleaves", authenticate, getTodayApprovedLeavesForAdmin);

/**
 * Document Preview
 * Note: Authentication is omitted here to allow direct browser previewing of blobs/streams if required
 */
router.get("/document/:docId", previewLeaveDocument);

module.exports = router;