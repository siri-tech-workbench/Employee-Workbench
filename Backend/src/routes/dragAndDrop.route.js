const { Router } = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getDragAndDropUsers,
  getDragAndDropUserActions,
  postDragAndDropUsers,
  deleteDragAndDropUsers,
  getUsersByGroupId,
} = require("../controllers/dragAndDrop.contoller");

const router = Router();

/**
 * Drag-and-Drop Management Routes
 * Handles visual user grouping and batch assignment actions.
 */

// Fetches the initial list of users available for assignment
router.get("/", authenticate, getDragAndDropUsers);

// Retrieves the history of drag-and-drop actions or audit logs
router.get("/actions", authenticate, getDragAndDropUserActions);

// Saves new assignments or group changes made via the UI
router.post("/", authenticate, postDragAndDropUsers);

// Removes users from specific groups or clears assignments
router.delete("/", authenticate, deleteDragAndDropUsers);

// Retrieves all users currently assigned to a specific Group ID
router.get("/group/:group_id", authenticate, getUsersByGroupId);

module.exports = router;