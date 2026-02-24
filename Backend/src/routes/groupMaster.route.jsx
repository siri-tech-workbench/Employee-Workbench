const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getGroupMaster,
  postGroupMaster,
  deleteGroupMaster,
  updateGroupMaster,
} = require("../controllers/groupMaster.controller");

const router = express.Router();

/**
 * Group Master Management Routes
 * Handles the creation and categorization of organizational groups.
 */

// Retrieve all defined groups
router.get("/", authenticate, getGroupMaster);

// Create a new group entry
router.post("/", authenticate, postGroupMaster);

// Update group details (Name, Description, Status) by ID
router.put("/:id", authenticate, updateGroupMaster);

// Remove a group from the system by ID
router.delete("/:id", authenticate, deleteGroupMaster);

module.exports = router;
