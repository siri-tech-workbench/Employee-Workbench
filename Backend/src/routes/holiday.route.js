const { Router } = require("express");
const { authenticate } = require('../middlewares/auth.middleware');
const {
    getYearDropdown,
    getHolidayList,
    insertHoliday,
    updateHoliday,
    deleteHoliday
} = require("../controllers/holiday.controller");

const router = Router();

/**
 * Holiday Master Configuration Routes
 * Manages the organization's holiday calendar for leave and attendance tracking.
 */

// Retrieves the list of holidays (typically filtered by the current/selected year)
router.get("/", authenticate, getHolidayList);

// Fetches available years for the holiday selection dropdown
router.get("/gethol",authenticate, getYearDropdown);

// Adds a new holiday entry to the system
router.post("/addhol", authenticate, insertHoliday);

// Updates existing holiday details (Name, Date, Type) by ID
router.put("/updhol/:id", authenticate, updateHoliday);

// Removes a holiday entry from the database by ID
router.delete("/delhol/:id", authenticate, deleteHoliday);

module.exports = router;