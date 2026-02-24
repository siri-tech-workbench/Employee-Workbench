const { Router } = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getModuleMenu,
  getMainMenu,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menue_items.controller");

const router = Router();

/**
 * Menu Items Configuration
 * Manages the specific functional links within the ERP's navigation hierarchy.
 */

// Fetches module-level data to populate parent selection dropdowns in the UI
router.get("/dd_module", authenticate, getModuleMenu);

// Fetches main-level menu data to populate secondary selection dropdowns
router.get("/dd_main_menu", authenticate, getMainMenu);

// Retrieves the complete list of specific menu items/actions for table views
router.get("/", authenticate, fetchMenuItems);

// Inserts a new terminal menu item (the actual clickable link in the sidebar)
router.post("/", authenticate, createMenuItem);

// Updates existing menu item properties like labels, link paths, or sort order
router.put("/:id", authenticate, updateMenuItem);

// Permanently removes a specific menu item from the navigation tree by its ID
router.delete("/:id", authenticate, deleteMenuItem);

module.exports = router;