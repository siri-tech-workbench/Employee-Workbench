const { Router } = require("express");
const { logout } = require("../../controllers/logoutcontroller/logout.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * Authentication Exit Routes
 * Handles secure session termination for the Employee Workbench.
 */

/*
 * Description: Terminates the user session and performs necessary server-side cleanup.
 */
router.put("/", authenticate, logout);

module.exports = router;