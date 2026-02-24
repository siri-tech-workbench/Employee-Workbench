const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const { projectTempUpload } = require("../../middlewares/projectUpload");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
  getCustomerDropdown,
  getModuleDropdown,
  createProject,
  updateProject,
  getProjects,
  deleteProject,
} = require("../../controllers/project/project.controller");

const router = Router();

/**
 * Project Management Routes
 * Handles CRUD operations and technical documentation for ERP projects.
 */

// Dropdown data lookups for project initialization
router.get("/getcustomer", authenticate, getCustomerDropdown);
router.get("/getmodule", authenticate, getModuleDropdown);

// Project Creation: Supports up to 5 document uploads
router.post(
  "/insproj",
  authenticate,
  projectTempUpload.array("files", 5),
  createProject
);

// Project Update: Supports document replacement/addition
router.put(
  "/updproj/:id",
  authenticate,
  projectTempUpload.array("files", 5),
  updateProject
);

// Listing and Deletion
router.get("/getprojecttable", authenticate, getProjects);
router.delete("/delproject/:id", authenticate, deleteProject);

/**
 * Static File Retrieval
 * Streams project documentation from the secure uploads directory.
 */
router.get("/file/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../../../uploads/project_docs",
    req.params.filename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Requested document not found" });
  }

  res.sendFile(filePath);
});

module.exports = router;