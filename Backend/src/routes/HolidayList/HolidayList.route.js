const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const { getHolidayList } = require("../../controllers/HolidayList/HolidayList.controller");

const router = Router();

/**
 * Holiday List Routes
 * Manages the retrieval of the corporate holiday calendar.
 */

//   Description: Fetches the complete list of holidays for the current calendar year.

router.get("/", authenticate, getHolidayList);

module.exports = router;