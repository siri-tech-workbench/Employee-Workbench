const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Resolve absolute path to the project documents upload directory
const uploadDir = path.join(__dirname, "..", "..", "uploads", "project_docs");

// Create the upload directory if it does not already exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer disk storage configuration.
 * Files are saved to the uploadDir with a structured filename:
 * Format: {project_id}_{YYYYMMDD}_{timestamp}{ext}
 * Example: 42_20260217_1739800000000.pdf
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Fall back to "TEMP" if project_id is not yet available in the request body
    const projectId = req.body.project_id || "TEMP";

    // Format today's date as YYYYMMDD for the filename
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const ext = path.extname(file.originalname);

    // Append timestamp to guarantee uniqueness even for concurrent uploads
    const unique = Date.now();

    cb(null, `${projectId}_${date}_${unique}${ext}`);
  },
});

/**
 * File type filter — restricts uploads to PDF and image files only.
 * Rejects any file whose extension is not in the allowed list.
 *
 * @param {Express.Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|png|jpg|jpeg/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, JPG, JPEG files are allowed"));
  }
};

/**
 * projectUpload
 * Multer middleware configured for project document uploads.
 * - Destination: /uploads/project_docs/
 * - Allowed types: PDF, PNG, JPG, JPEG
 * - Max file size: 5MB
 */
const projectUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = projectUpload;