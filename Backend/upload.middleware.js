const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Configuration for disk storage engine.
 * Defines the destination directory and standardized naming convention for uploaded files.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Construct absolute path for leave documentation storage
    const uploadPath = path.join(__dirname, "../../uploads/leave_docs");

    // Ensure the directory exists; 'recursive: true' prevents errors if parent folders are missing
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Extract employee ID from the authenticated request object
    const empId = req.user?.emp_id || "unknown";

    // Format current date (YYYY-MM-DD) for the filename
    const appliedDate = new Date().toISOString().split("T")[0];

    // Extract original file extension
    const ext = path.extname(file.originalname);

    // Generate a unique filename using employee ID, date, and a timestamp to prevent overwrites
    const uniqueSuffix = Date.now();
    const newFileName = `${empId}_${appliedDate}_${uniqueSuffix}${ext}`;

    cb(null, newFileName);
  },
});

/**
 * Restricts file types to ensure only valid documents are uploaded.
 * Limits uploads to PDFs and standard image formats.
 */
const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === "application/pdf";
  const isImage = file.mimetype.startsWith("image/");

  if (!isPdf && !isImage) {
    return cb(new Error("Invalid file type. Only PDF and image files are permitted."), false);
  }
  cb(null, true);
};

/**
 * Multer middleware instance with defined storage, type filters, and size limits.
 * Default limit set to 1MB to optimize server storage and upload speed.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB Limit
});

module.exports = upload;