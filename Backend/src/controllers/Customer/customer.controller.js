const { asyncHandler, ApiError, ApiResponse, DatabaseHandler } = require("../../utils");

/**
 * POST /customer/create
 * Creates a new customer record with name, alias, city, GST, and PAN details.
 */
const createCustomer = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const {
      customer_name,
      customer_alias,
      city,
      gst_no,
      pan_no,
    } = req.body;

    const query = `
      INSERT INTO CUSTOMER (
        CUSTOMER_NAME,
        CUSTOMER_ALIAS,
        CITY,
        GST_NO,
        PAN_NO
      )
      VALUES (
        :customer_name,
        :customer_alias,
        :city,
        :gst_no,
        :pan_no
      )
    `;

    await db.executeQuery(
      query,
      { customer_name, customer_alias, city, gst_no, pan_no },
      "siri_db"
    );

    return res.status(201).json(new ApiResponse(201, null, "Customer created successfully"));

  } catch (error) {
    console.error("Error creating customer:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * PUT /customer/:id
 * Updates an existing customer record by customer ID.
 * All fields are replaced — send the full customer object in the request body.
 */
const updateCustomer = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { id: customer_id } = req.params;

    const {
      customer_name,
      customer_alias,
      city,
      gst_no,
      pan_no,
    } = req.body;

    const query = `
      UPDATE CUSTOMER
      SET
        CUSTOMER_NAME  = :customer_name,
        CUSTOMER_ALIAS = :customer_alias,
        CITY           = :city,
        GST_NO         = :gst_no,
        PAN_NO         = :pan_no
      WHERE CUSTOMER_ID = :customer_id
    `;

    const result = await db.executeQuery(
      query,
      { customer_id, customer_name, customer_alias, city, gst_no, pan_no },
      "siri_db"
    );

    // Return 404 if no matching customer was found for the given ID
    if (result.rowsAffected === 0) {
      throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Customer updated successfully"));

  } catch (error) {
    console.error("Error updating customer:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * DELETE /customer/:id
 * Deletes a customer record by customer ID.
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const { id: customer_id } = req.params;

    const query = `
      DELETE FROM CUSTOMER
      WHERE CUSTOMER_ID = :customer_id
    `;

    const result = await db.executeQuery(
      query,
      { customer_id },
      "siri_db"
    );

    // Return 404 if no matching customer was found for the given ID
    if (result.rowsAffected === 0) {
      throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Customer deleted successfully"));

  } catch (error) {
    console.error("Error deleting customer:", error);
    throw new ApiError(500, "Internal server error");
  }
});

/**
 * GET /customer/list
 * Fetches all customer records ordered by customer ID descending.
 * Column aliases are used to return camelCase-friendly keys directly from the DB.
 */
const getCustomers = asyncHandler(async (req, res) => {
  try {
    const db = new DatabaseHandler();

    const query = `
      SELECT
        CUSTOMER_ID    "customer_id",
        CUSTOMER_NAME  "customer_name",
        CUSTOMER_ALIAS "customer_alias",
        CITY           "city",
        GST_NO         "gst_no",
        PAN_NO         "pan_no"
      FROM CUSTOMER
      ORDER BY CUSTOMER_ID DESC
    `;

    const result = await db.executeQuery(query, {}, "siri_db");

    return res.status(200).json(new ApiResponse(200, result.rows, "Customers fetched successfully"));

  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new ApiError(500, "Internal server error");
  }
});

module.exports = { createCustomer, getCustomers, deleteCustomer, updateCustomer };