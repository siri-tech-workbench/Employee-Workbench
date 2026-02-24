const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const { ktUpload } = require("../../middlewares/ktUpload");
const { getEmpKT, postEmpKT, getEmpKTDropdown, downloadKTFile } = require("../../controllers/KT/KT.controller");

/* Initialize Express Router for Knowledge Transfer (KT) modules */
const router = Router();

/* GET: Retrieve Knowledge Transfer records for employees (Requires authentication) */
router.get("/", authenticate, getEmpKT);

/* GET: Fetch dropdown data/lists required for KT form fields */
router.get("/Emp_dd", authenticate, getEmpKTDropdown);

/* POST: Create a new KT record with a single file upload using Multer middleware */
/* The 'K_FILE' field identifies the file in the multipart form data */
router.post("/", authenticate, ktUpload.single("K_FILE"), postEmpKT);

/* GET: Stream or download a specific KT attachment based on the record ID */
router.get("/download/:id", authenticate, downloadKTFile);

/* Export the router to be mounted in the main application entry point */
module.exports = router;