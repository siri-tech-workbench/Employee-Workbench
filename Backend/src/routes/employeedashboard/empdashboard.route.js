const { Router } = require("express");
const { getSessionInfo } = require("../../controllers/empdashboard/empdashboard.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * Employee Dashboard Routes
 * Provides data specifically tailored for the user's dashboard view.
 */

/**
 * Description: Retrieves current session details for the authenticated employee.
 * Access: Private (Requires valid JWT)
 */
router.get("/session-info", authenticate, getSessionInfo);

module.exports = router;