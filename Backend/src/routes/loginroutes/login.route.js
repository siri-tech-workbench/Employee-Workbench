const { Router } = require("express");
const {
  getLocationDropdown,
  signin,
  getDashboardDetails,
  forgotPassword,
  resetPassword
} = require("../../controllers/logincontroller/login.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * Authentication & Session Management Routes
 * Handles user access, password recovery, and initial dashboard data.
 */

// Fetches available work locations for the login dropdown
router.get("/locdd", getLocationDropdown);

// Primary user authentication endpoint
router.post("/signin", signin);

/**
 * Route: GET /api/v1/login/session/check
 * Description: Validates if the user's JWT is still active and valid.
 */
router.get("/session/check", authenticate, (req, res) => {
  res.status(200).json({ active: true });
});

// Retrieves high-level dashboard metrics for the authenticated user
router.get("/dash", authenticate, getDashboardDetails);

// Initiates the password recovery process
router.post("/forgot-password", authenticate, forgotPassword);

/**
 * Route: POST /api/v1/login/reset-password
 * Description: Finalizes the password reset using the provided token/details.
 */
router.post("/reset-password", authenticate, resetPassword);

module.exports = router;