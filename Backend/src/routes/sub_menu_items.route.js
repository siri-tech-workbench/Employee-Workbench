const { Router } = require("express");
const {
  getSubMenuData,
  getSubMenuGrid,
  getMenuItemDropdown,
  postSubMenuItems,
  updateSubMenuItems,
  deleteSubMenuItems,
} = require("../controllers/sub_menue_items.controller");
const { authenticate } = require("../middlewares/auth.middleware");

/* Initialize Express Router for managing sub-menu items and navigation structure */
const router = Router();

/* GET: Retrieve comprehensive data for all sub-menu entries */
router.get("/getall", authenticate, getSubMenuData);

/* GET: Fetch menu item dropdown list for form selections (Parent menu mapping) */
router.get("/getdd", authenticate, getMenuItemDropdown);

/* GET: Retrieve sub-menu data formatted specifically for grid/table displays */
router.get("/getiddd", authenticate, getSubMenuGrid);

/* POST: Create and register a new sub-menu item */
router.post("/", authenticate, postSubMenuItems);

/* PUT: Update an existing sub-menu item's details using its unique ID */
router.put("/:id", authenticate, updateSubMenuItems);

/* DELETE: Remove a sub-menu item from the system by its unique ID */
router.delete("/:id", authenticate, deleteSubMenuItems);

/* Export router for integration into the primary application routing tree */
module.exports = router;