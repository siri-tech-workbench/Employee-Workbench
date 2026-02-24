const {
  asyncHandler,
  ApiError,
  ApiResponse,
  DatabaseHandler,
} = require("../../utils");
const fs = require("fs");
const path = require("path");

/**
 * GET /employee/designations
 * Fetches all available designations for dropdown population.
 */
const getDesignation = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        DESG_ID     "desg_id",
        DESIGNATION "designation"
      FROM DESIGNATION
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Designations fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /employee/languages
 * Fetches all available languages for dropdown population.
 */
const getLanguages = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        LANG_ID   "lang_id",
        LANG_NAME "lang_name"
      FROM LANGUAGES
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Languages fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /employee/status-list
 * Fetches all employee status options for dropdown population.
 */
const getEmpStatus = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        STATUS_ID   "status_id",
        STATUS_NAME "status_name"
      FROM EMP_STATUS
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Employee statuses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /employee/dropdown
 * Fetches a minimal list of employees (ID + name) for dropdown population,
 * ordered alphabetically by name.
 */
const getEmployeeDropdown = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT EMP_ID, NAME
      FROM EMP
      ORDER BY NAME
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Employee dropdown fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * POST /employee/create
 * Inserts a new employee record along with their language proficiencies.
 * Steps:
 *   1. Insert into EMP table.
 *   2. Retrieve the generated EMP_ID using MOBILE as a lookup key.
 *   3. Insert each language entry into EMP_LANG.
 *
 * Note: EMP_ID retrieval uses MOBILE + ROWNUM because the DB does not
 * return the generated ID directly from the insert.
 */
const postEmpData = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { employee, languages } = req.body;

    // Step 1: Insert employee record into EMP table
    const empInsertQuery = `
      INSERT INTO EMP (
        NAME,
        DOB,
        DOJ,
        DESG_ID,
        MOBILE,
        ALT_MOBILE,
        EMAIL_ID,
        ADDRESS,
        STATUS,
        QUALIFICATION,
        AADHAR,
        PAN,
        STATUS_REASON,
        OFF_EMAIL_ID
      ) VALUES (
        :NAME,
        TO_DATE(:DOB, 'DD-MON-YYYY'),
        TO_DATE(:DOJ, 'DD-MON-YYYY'),
        :DESG_ID,
        :MOBILE,
        :ALT_MOBILE,
        :EMAIL_ID,
        :ADDRESS,
        (SELECT STATUS_NAME FROM EMP_STATUS WHERE STATUS_ID = :STATUS_ID),
        :QUALIFICATION,
        :AADHAR,
        :PAN,
        :STATUS_REASON,
        :OFF_EMAIL_ID
      )
    `;

    await db.executeQuery(
      empInsertQuery,
      {
        NAME: employee.Name,
        DOB: employee.dob,
        DOJ: employee.dojo,
        DESG_ID: employee.designationId,
        MOBILE: employee.mobileNumber,
        ALT_MOBILE: employee.alternativeMobileNumber,
        EMAIL_ID: employee.personalEmail,
        ADDRESS: employee.Address,
        STATUS_ID: employee.statusId,
        QUALIFICATION: employee.qualification,
        AADHAR: employee.aadhar,
        PAN: employee.pan,
        OFF_EMAIL_ID: employee.officeEmail,
        STATUS_REASON: employee.STATUS_REASON,
      },
      "siri_db"
    );

    // Step 2: Retrieve the newly created EMP_ID using mobile number as lookup
    const empIdQuery = `
      SELECT EMP_ID
      FROM (
        SELECT EMP_ID
        FROM EMP
        WHERE MOBILE = :MOBILE
        ORDER BY EMP_ID DESC
      )
      WHERE ROWNUM = 1
    `;

    const empIdResult = await db.executeQuery(
      empIdQuery,
      { MOBILE: employee.mobileNumber },
      "siri_db"
    );

    if (!empIdResult.rows || empIdResult.rows.length === 0) {
      throw new ApiError(500, "Failed to fetch generated EMP_ID");
    }

    const empId = empIdResult.rows[0].EMP_ID;

    // Step 3: Insert each language proficiency record for the new employee
    const empLangInsertQuery = `
      INSERT INTO EMP_LANG (
        EMP_ID,
        LANG_ID,
        "READ",
        SPEAK
      ) VALUES (
        :EMP_ID,
        :LANG_ID,
        :READ,
        :SPEAK
      )
    `;

    for (const lang of languages) {
      await db.executeQuery(
        empLangInsertQuery,
        {
          EMP_ID: empId,
          LANG_ID: lang.langId,
          READ: lang.read,
          SPEAK: lang.speak,
        },
        "siri_db"
      );
    }

    return res.status(201).json(
      new ApiResponse(201, { empId }, "Employee and languages inserted successfully")
    );

  } catch (err) {
    console.error("Employee insert error:", err);
    throw new ApiError(
      err.statusCode || 500,
      err.message || "Error inserting employee data",
      err.details || err.message
    );
  }
});

/**
 * POST /employee/language
 * Adds a new language option to the LANGUAGES master table.
 */
const postNewLanguage = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { LANG_NAME } = req.body;

    const query = `
      INSERT INTO LANGUAGES (LANG_NAME)
      VALUES (:LANG_NAME)
    `;

    const result = await db.executeQuery(query, { LANG_NAME }, "siri_db");

    return res.status(201).json(
      new ApiResponse(201, { rowsAffected: result.rowsAffected }, "Language inserted successfully")
    );
  } catch (err) {
    console.error("Language insert error:", err);
    throw new ApiError(
      err.statusCode || 500,
      err.message || "Error inserting new language",
      err.details || err.message
    );
  }
});

/**
 * GET /employee/list
 * Fetches employees with their language proficiencies using optional filters.
 * Supports filtering by date range (DOJ), name (partial match), and status.
 * Defaults to status = 'WORKING' if no status filter is provided.
 */
const getEmployees = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();
    const { fromDate, toDate, name, status } = req.query;

    // Base query with LEFT JOIN to include employees without language records
    let query = `
      SELECT
        e.EMP_ID,
        e.NAME,
        TO_CHAR(e.DOB, 'DD-MON-YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') AS DOB,
        TO_CHAR(e.DOJ, 'DD-MON-YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') AS DOJ,
        e.DESG_ID,
        e.MOBILE,
        e.ALT_MOBILE,
        e.EMAIL_ID,
        e.ADDRESS,
        e.STATUS,
        e.QUALIFICATION,
        e.OFF_EMAIL_ID,
        e.AADHAR,
        e.PAN,
        el.EMP_LANG_ID,
        el.LANG_ID,
        el."READ",
        el.SPEAK
      FROM EMP e
      LEFT JOIN EMP_LANG el
        ON el.EMP_ID = e.EMP_ID
      WHERE 1 = 1
    `;

    const bindParams = {};

    // Filter by date of joining range if both dates are provided
    if (fromDate && toDate) {
      query += `
        AND e.DOJ >= TO_DATE(:FROM_DATE, 'DD-MM-YY')
        AND e.DOJ <  TO_DATE(:TO_DATE, 'DD-MM-YY') + 1
      `;
      bindParams.FROM_DATE = fromDate;
      bindParams.TO_DATE = toDate;
    }

    // Filter by employee name (case-insensitive partial match)
    if (name) {
      query += ` AND UPPER(e.NAME) LIKE UPPER(:NAME)`;
      bindParams.NAME = `%${name}%`;
    }

    // Filter by status; default to 'WORKING' if not specified
    if (status) {
      query += ` AND UPPER(e.STATUS) = UPPER(:STATUS)`;
      bindParams.STATUS = status;
    } else {
      query += ` AND UPPER(e.STATUS) = 'WORKING'`;
    }

    query += ` ORDER BY e.DOJ DESC, e.EMP_ID, el.LANG_ID`;

    const result = await db.executeQuery(query, bindParams, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Employees fetched successfully"));

  } catch (error) {
    console.error("Employee fetch error:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /employee/document-types
 * Fetches all document type definitions from DOC_NAMES master table.
 * Used to populate the document upload form.
 */
const getEmployeeDocumentTypes = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT DOC_ID, DOC_NAME, SHORT_DOC_NAME
      FROM DOC_NAMES
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Document types fetched successfully"));
  } catch (error) {
    console.error("Document types fetch error:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * PUT /employee/:id
 * Updates an existing employee record and refreshes their language proficiencies.
 * Steps:
 *   1. Update the EMP record.
 *   2. Delete all existing EMP_LANG entries for this employee.
 *   3. Re-insert updated language proficiency records.
 */
const updateEmpData = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const empId = req.params.id;
    const { employee, languages } = req.body;

    if (!empId) {
      throw new ApiError(400, "EMP_ID is required for update");
    }

    // Step 1: Update the employee's core details
    const empUpdateQuery = `
      UPDATE EMP
      SET
        NAME          = :NAME,
        DOB           = TO_DATE(:DOB, 'DD-MON-YYYY'),
        DOJ           = TO_DATE(:DOJ, 'DD-MON-YYYY'),
        DESG_ID       = :DESG_ID,
        MOBILE        = :MOBILE,
        ALT_MOBILE    = :ALT_MOBILE,
        EMAIL_ID      = :EMAIL_ID,
        ADDRESS       = :ADDRESS,
        STATUS        = (SELECT STATUS_NAME FROM EMP_STATUS WHERE STATUS_ID = :STATUS_ID),
        QUALIFICATION = :QUALIFICATION,
        AADHAR        = :AADHAR,
        PAN           = :PAN,
        OFF_EMAIL_ID  = :OFF_EMAIL_ID,
        STATUS_REASON = :STATUS_REASON
      WHERE EMP_ID = :EMP_ID
    `;

    const updateResult = await db.executeQuery(
      empUpdateQuery,
      {
        EMP_ID: empId,
        NAME: employee.Name,
        DOB: employee.dob,
        DOJ: employee.dojo,
        DESG_ID: employee.designationId,
        MOBILE: employee.mobileNumber,
        ALT_MOBILE: employee.alternativeMobileNumber,
        EMAIL_ID: employee.personalEmail,
        ADDRESS: employee.Address,
        STATUS_ID: employee.statusId,
        QUALIFICATION: employee.qualification,
        OFF_EMAIL_ID: employee.officeEmail,
        AADHAR: employee.aadhar,
        PAN: employee.pan,
        STATUS_REASON: employee.STATUS_REASON,
      },
      "siri_db"
    );

    if (updateResult.rowsAffected === 0) {
      throw new ApiError(404, "Employee not found");
    }

    // Step 2: Remove existing language records before re-inserting updated ones
    await db.executeQuery(
      `DELETE FROM EMP_LANG WHERE EMP_ID = :EMP_ID`,
      { EMP_ID: empId },
      "siri_db"
    );

    // Step 3: Insert updated language proficiency records
    const empLangInsertQuery = `
      INSERT INTO EMP_LANG (
        EMP_ID,
        LANG_ID,
        "READ",
        SPEAK
      ) VALUES (
        :EMP_ID,
        :LANG_ID,
        :READ,
        :SPEAK
      )
    `;

    for (const lang of languages) {
      await db.executeQuery(
        empLangInsertQuery,
        {
          EMP_ID: empId,
          LANG_ID: lang.langId,
          READ: lang.read,
          SPEAK: lang.speak,
        },
        "siri_db"
      );
    }

    return res.status(200).json(
      new ApiResponse(200, { empId }, "Employee and languages updated successfully")
    );

  } catch (err) {
    console.error("Employee update error:", err);
    throw new ApiError(
      err.statusCode || 500,
      err.message || "Error updating employee data",
      err.details || err.message
    );
  }
});

/**
 * POST /employee/:id/documents
 * Uploads one or more documents for an employee.
 * Steps:
 *   1. Validate file count matches docIds count.
 *   2. Fetch SHORT_DOC_NAME for each docId from DOC_NAMES.
 *   3. Rename uploaded files to follow <empId>_<docId>_<shortName>.<ext> format.
 *   4. Insert each file record into EMP_DOC_LINK.
 */
const uploadEmployeeDocuments = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();

  const empId = req.params.id;
  const files = req.files;
  const { docIds } = req.body;

  if (!files || files.length === 0) {
    throw new ApiError(400, "No documents uploaded");
  }

  const docIdArray = Array.isArray(docIds) ? docIds : [docIds];

  if (files.length !== docIdArray.length) {
    throw new ApiError(400, "Document type mismatch");
  }

  // Build parameterized IN clause for batch DOC_ID lookup
  const bindParams = {};
  const bindKeys = docIdArray.map((id, index) => {
    const key = `DOC_ID_${index}`;
    bindParams[key] = id;
    return `:${key}`;
  });

  const docMetaResult = await db.executeQuery(
    `
    SELECT DOC_ID, SHORT_DOC_NAME
    FROM DOC_NAMES
    WHERE DOC_ID IN (${bindKeys.join(",")})
    `,
    bindParams,
    "siri_db"
  );

  // Map DOC_ID to SHORT_DOC_NAME for quick lookup during file processing
  const docMap = {};
  docMetaResult.rows.forEach((row) => {
    docMap[row.DOC_ID] = row.SHORT_DOC_NAME;
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docId = docIdArray[i];
    const shortName = docMap[docId];

    if (!shortName) {
      throw new ApiError(400, `Invalid DOC_ID: ${docId}`);
    }

    // Rename file to structured format: <empId>_<docId>_<shortName>.<ext>
    const ext = path.extname(file.originalname);
    const finalName = `${empId}_${docId}_${shortName}${ext}`;
    const finalPath = path.join(file.destination, finalName);

    fs.renameSync(file.path, finalPath);

    // Record the uploaded document in EMP_DOC_LINK
    await db.executeQuery(
      `
      INSERT INTO EMP_DOC_LINK (EMP_ID, DOC_ID, FILE_NAME)
      VALUES (:EMP_ID, :DOC_ID, :FILE_NAME)
      `,
      { EMP_ID: empId, DOC_ID: docId, FILE_NAME: finalName },
      "siri_db"
    );
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Documents uploaded successfully")
  );
});

/**
 * GET /employee/:id/documents
 * Fetches all uploaded document records for an employee,
 * including document name and file name.
 */
const getEmployeeUploadedDocuments = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const empId = req.params.id;

  const result = await db.executeQuery(
    `
    SELECT
      l.EMP_DOC_LINK_ID,
      l.DOC_ID,
      d.DOC_NAME,
      d.SHORT_DOC_NAME,
      l.FILE_NAME
    FROM EMP_DOC_LINK l
    JOIN DOC_NAMES d ON d.DOC_ID = l.DOC_ID
    WHERE l.EMP_ID = :EMP_ID
    `,
    { EMP_ID: empId },
    "siri_db"
  );

  return res.status(200).json(
    new ApiResponse(200, result.rows, "Employee documents fetched successfully")
  );
});

/**
 * GET /employee/document/preview/:id
 * Streams an employee document file for inline browser preview.
 * Detects MIME type from file extension and sets appropriate response headers.
 */
const previewEmployeeDocument = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Invalid Document ID");

  // Fetch the file name associated with this document link ID
  const result = await db.executeQuery(
    `
    SELECT FILE_NAME
    FROM EMP_DOC_LINK
    WHERE EMP_DOC_LINK_ID = :ID
    `,
    { ID: Number(id) },
    "siri_db"
  );

  if (!result.rows.length) throw new ApiError(404, "Document not found");

  const fileName = result.rows[0].FILE_NAME.trim();

  const filePath = path.join(
    __dirname,
    "../../../uploads/employee_docs",
    fileName
  );

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File does not exist on server");
  }

  // Map file extension to MIME type for correct browser rendering
  const ext = fileName.split(".").pop().toLowerCase();

  const mimeTypes = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  const mimeType = mimeTypes[ext] || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

  // Stream file to response instead of loading entire file into memory
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

/**
 * DELETE /employee/:empId/documents/:docLinkId
 * Deletes an employee document record from the DB and removes the file from disk.
 * File deletion failure is treated as a warning (non-fatal) to avoid blocking the DB cleanup.
 */
const deleteEmployeeUploadedDocument = asyncHandler(async (req, res) => {
  const db = new DatabaseHandler();
  const { empId, docLinkId } = req.params;

  if (!empId || !docLinkId) {
    throw new ApiError(400, "Employee ID and Document Link ID are required");
  }

  // Fetch the file name before deletion to locate the file on disk
  const result = await db.executeQuery(
    `
    SELECT FILE_NAME
    FROM EMP_DOC_LINK
    WHERE EMP_ID = :EMP_ID
      AND EMP_DOC_LINK_ID = :DOC_ID
    `,
    { EMP_ID: empId, DOC_ID: docLinkId },
    "siri_db"
  );

  if (!result.rows || result.rows.length === 0) {
    throw new ApiError(404, "Document not found for this employee");
  }

  const fileName = result.rows[0].FILE_NAME;

  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "uploads",
    "employee_docs",
    fileName
  );

  // Delete the DB record first before attempting file removal
  await db.executeQuery(
    `
    DELETE FROM EMP_DOC_LINK
    WHERE EMP_ID = :EMP_ID
      AND EMP_DOC_LINK_ID = :DOC_ID
    `,
    { EMP_ID: empId, DOC_ID: docLinkId },
    "siri_db"
  );

  // Attempt to remove file from disk; log warning if it fails but do not throw
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("File delete warning:", err.message);
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Document deleted successfully")
  );
});

module.exports = {
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
  getEmployeeDropdown,
};