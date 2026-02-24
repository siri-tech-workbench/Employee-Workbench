const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
    createCustomer,
    getCustomers,
    deleteCustomer,
    updateCustomer
} = require("../../controllers/Customer/customer.controller");

const router = Router();

/**
 * Customer Management Routes
 * Handles CRUD operations for customer profiles within the ERP.
 */

// Retrieve all customer records
router.get("/", authenticate, getCustomers);

// Register a new customer in the system
router.post("/createcustomer", authenticate, createCustomer);

// Update existing customer details by ID
router.put("/updcust/:id", authenticate, updateCustomer);

// Remove a customer record from the system by ID
router.delete("/delcust/:id", authenticate, deleteCustomer);

module.exports = router;