const { Router } = require("express");
const { 
    updatePassword,
    getEmployeeDropdown,
    getRoleDropdown,
    insertRole,
    getUsers,
    updateUser,
    createUser,
    searchUsersByLoginId 
} = require("../../controllers/usercontroller/usermast.controller");
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * User Master & Security Administration
 * Manages system access, role definitions, and credential updates.
 */

// Master Data Lookups for User Creation
router.get("/getempdd", authenticate, getEmployeeDropdown);
router.get("/getroledd", authenticate, getRoleDropdown);

// Role & Permission Management
router.post("/insrole", authenticate, insertRole);

// User CRUD Operations
router.get("/getusers", authenticate, getUsers);
router.post("/postuser", authenticate, createUser);
router.put("/updusers/:id", authenticate, updateUser);
router.get("/users/search", authenticate, searchUsersByLoginId);

/**
 * Security Management
 * Endpoint for authenticated users to update their own credentials.
 */
router.put("/updpas", authenticate, updatePassword);

module.exports = router;