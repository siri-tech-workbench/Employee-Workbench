const { Router } = require("express");
const {
    getDesignation,
    getLanguages,
    getEmpStatus,
    postEmpData,
    postNewLanguage,
    getEmployees,
    getEmployeeDocumentTypes,
    updateEmpData,
    uploadEmployeeDocuments,
    getEmployeeUploadedDocuments,
    previewEmployeeDocument,
    deleteEmployeeUploadedDocument,
    getEmployeeDropdown
} = require("../../controllers/Employee/employee.controller");

const { authenticate } = require("../../middlewares/auth.middleware");
const { upload } = require("../../config/multer.config");

const router = Router();

/**
 * Employee Management & Configuration Routes
 */

// Master Data Lookups
router.get("/designation", authenticate, getDesignation);
router.get("/languages", authenticate, getLanguages);
router.get("/emp_status", authenticate, getEmpStatus);
router.get("/dd", authenticate, getEmployeeDropdown);

// Employee Profile Management
router.get("/employees", authenticate, getEmployees);
router.post("/", authenticate, postEmpData);
router.put("/:id", authenticate, updateEmpData);

// Language Management
router.post("/languages", authenticate, postNewLanguage);

// Document Management Lifecycle
router.get('/document', authenticate, getEmployeeDocumentTypes);
router.get("/employee_documents/:id", authenticate, getEmployeeUploadedDocuments);
router.get("/employee_documents/preview/:id", authenticate, previewEmployeeDocument);

/**
 * Handles bulk document uploads. 
 * Uses Multer middleware to process an array of up to 10 files.
 */
router.post("/employee_documents/:id", authenticate, upload.array("documents", 10), uploadEmployeeDocuments);

// Deletes specific uploaded document records
router.delete("/employee_documents/:empId/:docLinkId", authenticate, deleteEmployeeUploadedDocument);

module.exports = router;