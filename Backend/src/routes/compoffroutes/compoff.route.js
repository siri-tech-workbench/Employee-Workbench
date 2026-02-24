const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
    createCompoff,
    getCompoffList,
    updateCompoffById,
    getCompOffExpiryAlert
} = require("../../controllers/compoff/compoff.controller");

const router = Router();

/**
 * Comp-off Request Lifecycle Routes
 * All endpoints require a valid authentication token.
 */

// Create a new compensatory off request
router.post("/createcompoff", authenticate, createCompoff);

// Retrieve a list of comp-off requests for the authenticated user
router.get("/getcompoff", authenticate, getCompoffList);

// Update a specific comp-off request by its unique identifier
router.put("/updatecompoff/:id", authenticate, updateCompoffById);

// Fetch alerts for upcoming compensatory off expirations
router.get("/comoffalert", authenticate, getCompOffExpiryAlert);

module.exports = router;