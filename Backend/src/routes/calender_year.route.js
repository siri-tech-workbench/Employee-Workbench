const { Router } = require("express");
const { authenticate } = require('../middlewares/auth.middleware');
const {
    getCalendar,
    insertCalendar,
    updateCalendar
} = require("../controllers/calender_year.controller");

const router = Router();

/**
 * Calendar Year Configuration Routes
 * Defines the active cycles used for leave management and reporting.
 */

// Retrieves the list of defined calendar years
router.get("/",authenticate, getCalendar);

// Creates a new calendar year record (e.g., initializing 2026)
router.post("/postcal", authenticate, insertCalendar);

// Updates status or details of an existing calendar year by ID
router.put("/updcal/:id", authenticate, updateCalendar);

module.exports = router;