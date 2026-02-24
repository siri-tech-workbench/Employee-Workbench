const { Router } = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
    getModules,
    insertModule,
    updateModule,
    deleteModule
} = require("../controllers/module_menu.controller");

const router = Router();

/**
 * ERP Module Management
 * Defines and configures the top-level modules within the application.
 */

// Fetches all modules currently defined in the system
router.get("/getmod", authenticate, getModules);

// Registers a new module (e.g., adding an 'Inventory' or 'Asset Management' section)
router.post("/addmod", authenticate, insertModule);

// Updates existing module configurations (name, icon, or order) by ID
router.put("/updmod/:id", authenticate, updateModule);

// Removes a module from the system configuration by ID
router.delete("/delmod/:id", authenticate, deleteModule);

module.exports = router;