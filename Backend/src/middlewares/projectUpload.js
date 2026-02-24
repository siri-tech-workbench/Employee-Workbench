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
 * Files are saved to uploadDir with a TEMP prefix and timestamp for uniqueness.
 * Format: TEMP_{timestamp}{ext}
 *
 * Note: This upload middleware is used in contexts where the project_id is not
 * yet available at upload time. If project_id is available, use the structured
 * filename version in projectUpload.js instead.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // Timestamp ensures uniqueness for concurrent uploads where project_id is unavailable
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `TEMP_${Date.now()}${ext}`);
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
 * projectTempUpload
 * Multer middleware for project document uploads where project_id is not yet known.
 * - Destination: /uploads/project_docs/
 * - Allowed types: PDF, PNG, JPG, JPEG
 * - Max file size: 5MB
 */
const projectTempUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = { projectTempUpload };