const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Base directory where employee documents will be stored
const uploadPath = path.join(__dirname, "..", "..", "uploads", "employee_docs");

// Create the upload directory if it does not already exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure disk storage settings for multer
const storage = multer.diskStorage({

  // Set the destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  // Generate a unique and structured filename using employee ID and document ID
  filename: (req, file, cb) => {
    const empId = req.params.id || "EMP";

    // Prefer docIds from request body over route params (supports both string and array)
    let docIds = req.params.docIds || "DOC";
    if (req.body.docIds) {
      docIds = Array.isArray(req.body.docIds)
        ? req.body.docIds[0]
        : req.body.docIds;
    }

    // Replace spaces in the original filename with underscores for safe file naming
    const safeName = file.originalname.replace(/\s+/g, "_");
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);

    // Final filename format: <empId>_<docId>_<originalName>.<ext>
    const finalName = `${empId}_${docIds}_${base}${ext}`;
    cb(null, finalName);
  },
});

// Allowed MIME types for employee document uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Initialize multer with storage config and file type validation
const upload = multer({
  storage,

  // Reject files that do not match the allowed MIME types
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }
    cb(null, true);
  },
});

module.exports = { upload };