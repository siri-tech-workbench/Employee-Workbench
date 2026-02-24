const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
    getEmpPermission,
    postEmpPermission,
    getAllPermissions,
    getTodayPermissions
} = require("../../controllers/Permission/permission.controller");

const router = Router();

/**
 * Permission Management Routes
 * Handles short-duration leave/permission requests and tracking.
 */

// Fetches all permission requests submitted specifically for the current date
router.get("/today", authenticate, getTodayPermissions);

// Retrieves all permission records across the organization (Admin view)
router.get("/", authenticate, getAllPermissions);

// Fetches the permission history for a specific employee via their ID
router.get("/:emp_id", authenticate, getEmpPermission);

// Submits a new permission request for the authenticated user
router.post("/", authenticate, postEmpPermission);

module.exports = router;