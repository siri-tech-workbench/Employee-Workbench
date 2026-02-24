const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Resolve absolute path to the leave documents upload directory
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "leave_docs");

// Create the upload directory on server start if it does not already exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Multer disk storage configuration.
 * Files are saved to UPLOAD_DIR with a structured filename:
 * Format: {emp_id}_{YYYY-MM-DD}_{timestamp}{ext}
 * Example: EMP001_2026-02-17_1739800000000.pdf
 *
 * The original filename is sanitised (spaces → underscores, special chars removed)
 * before extracting the extension to prevent path traversal or invalid filenames.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    // Use authenticated employee ID from req.user, fall back to "EMP" if unavailable
    const empId = req.user?.emp_id || "EMP";
    const date = new Date().toISOString().split("T")[0];
    const unique = Date.now();

    // Sanitise the original filename before extracting the extension
    // Replaces spaces with underscores and strips non-alphanumeric characters
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");

    const ext = path.extname(safeOriginalName);

    cb(null, `${empId}_${date}_${unique}${ext}`);
  },
});

/**
 * File type filter — allows PDF and image files only.
 * Uses MIME type checking rather than extension for more reliable validation.
 *
 * @param {Express.Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === "application/pdf";
  const isImage = file.mimetype.startsWith("image/");

  if (!isPdf && !isImage) {
    return cb(new Error("Only PDF and image files are allowed"), false);
  }

  cb(null, true);
};

/**
 * leaveUpload
 * Multer middleware configured for employee leave document uploads.
 * - Destination: /uploads/leave_docs/
 * - Allowed types: PDF and all image formats (checked by MIME type)
 * - Max file size: 1MB
 */
const leaveUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
});

module.exports = leaveUpload;