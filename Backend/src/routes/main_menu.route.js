const { Router } = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getMainMenusSelectModuleDD,
  getAllMainMenus,
  postMainMenus,
  updateMainMenus,
  deleteMainMenus,
} = require("../controllers/main_menu.controller");

const router = Router();

/**
 * Main Menu Configuration Routes
 * Manages high-level application modules and their visibility.
 */

// Fetches module selection dropdown for menu configuration
router.get("/", authenticate, getMainMenusSelectModuleDD);

// Retrieves the full list of top-level main menu items
router.get("/Main", authenticate, getAllMainMenus);

// Creates a new primary navigation module
router.post("/", authenticate, postMainMenus);

// Updates existing main menu configuration by ID
router.put("/:main_menu_id", authenticate, updateMainMenus);

// Deletes a main menu module from the system by ID
router.delete("/:main_menu_id", authenticate, deleteMainMenus);

module.exports = router;