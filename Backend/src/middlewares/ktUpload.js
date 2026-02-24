const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Resolve absolute path to the KT document upload directory
const uploadPath = path.join(__dirname, "..", "..", "uploads", "kt_docs");

// Create the upload directory if it does not already exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Parses a KT date string in DD-MM-YY format into a Date object.
 * Assumes a two-digit year refers to the 2000s (e.g. "26" → 2026).
 *
 * @param {string} dateStr - Date string in "DD-MM-YY" format
 * @returns {Date}
 */
function parseKTDate(dateStr) {
  const [dd, mm, yy] = dateStr.split("-");
  const year = Number(yy) + 2000; // Two-digit year assumed to be 2000s
  return new Date(year, Number(mm) - 1, Number(dd));
}

/**
 * Multer disk storage configuration.
 * Files are saved to the uploadPath with a structured filename:
 * Format: {EMP_ID}_{DD}_{MON}_{YYYY}_{timestamp}.pdf
 * Example: EMP001_17_FEB_2026_1739800000000.pdf
 *
 * Timestamp suffix guarantees uniqueness for same-employee same-day uploads.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const empId = req.body.EMP_ID || "EMP";

    // Parse the KT date from the request body, fall back to today if missing or invalid
    let dateObj;
    try {
      dateObj = req.body.K_DATE ? parseKTDate(req.body.K_DATE) : new Date();
    } catch {
      dateObj = new Date();
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = dateObj.getFullYear();
    const ext = path.extname(file.originalname);

    // Append timestamp to prevent overwriting when the same employee uploads multiple files on the same date
    const unique = Date.now();

    cb(null, `${empId}_${day}_${month}_${year}_${unique}${ext}`);
  },
});

/**
 * ktUpload
 * Multer middleware configured for KT (Knowledge Transfer) document uploads.
 * - Destination: /uploads/kt_docs/
 * - Allowed types: PDF only
 * - Max file size: 5MB
 */
const ktUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

module.exports = { ktUpload };