const { Router } = require("express");
const { authenticate } = require('../../middlewares/auth.middleware');
const { 
        insertModule,
        getModules,
        updateModule 
      } = require("../../controllers/project/module.controller");

/* Initialize the Express Router for Project Module management */
const router = Router();

/* POST: Create a new project module (Requires user authentication) */
router.post("/insertmodule", authenticate, insertModule);

/* GET: Retrieve a list of all existing project modules */
router.get("/", authenticate, getModules);

/* PUT: Update details of an existing module identified by its unique ID parameter */
router.put("/updmodule/:id", authenticate, updateModule);

/* Export the router to be used by the main application routing logic */
module.exports = router;