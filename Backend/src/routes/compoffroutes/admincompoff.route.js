const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
    getPendingCompoffList, updateCompoffStatus
} = require("../../controllers/compoff/appprovecompoff.controller");

/**
 * Router to handle administrative compensatory off (Comp-off) approvals.
 * All routes are protected by the authentication middleware.
 */
const router = Router();


//  Updates the status (Approve/Reject) of a specific comp-off request.

router.put("/approvecompoffrequest", authenticate, updateCompoffStatus);


//  Retrieves a list of all pending compensatory off requests for review.

router.get("/getcompoffrequest", authenticate, getPendingCompoffList);


//  Exporting the router to be mounted in the main application file.

module.exports = router;