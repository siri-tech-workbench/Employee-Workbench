const { Router } = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { getMenus } = require("../controllers/drawer.controller");

const router = Router();

/**
 * Navigation & Drawer Management
 * Responsible for generating the application's sidebar menu structure.
 */

/**
 * Description: Fetches authorized menu items (links, icons, parent-child relationships) 
 * specific to the logged-in user's role.
 */
router.get("/", authenticate, getMenus);

module.exports = router;