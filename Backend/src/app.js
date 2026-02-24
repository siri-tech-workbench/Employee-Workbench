const express = require("express");
const cors = require("cors");
const path = require("path");

// Utility and Middleware Imports
const { ApiResponse, ApiError } = require("./utils");
const { errorHandler } = require("./middlewares");

// Initialize Express Application
const app = express();

/** * CRON JOBS 
 * Automated tasks for leave processing and expiry logic.
 */
require("./cron/earnedleave.cron");
require("./cron/compoffexpiry.corn");

/** * GLOBAL MIDDLEWARE 
 */
app.use(cors());
// Increased payload limits for ERP document/image uploads
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
  })
);

/** * STATIC ASSETS 
 * Serves uploaded documents (e.g., medical certificates, profile pictures)
 */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/** * HEALTH CHECK 
 */
app.get("/", (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Employee Workbench API is active"));
});

/** * API ROUTES (v1) 
 * Grouped by functionality for better maintainability.
 */

// Navigation & Menu
app.use("/api/v1/calender_year", require("./routes/calender_year.route"));
app.use("/api/v1/module_menu", require("./routes/module_menu.route"));
app.use("/api/v1/main_menu", require("./routes/main_menu.route"));
app.use("/api/v1/menuitems", require("./routes/menue_items.route"));
app.use("/api/v1/sub_menu", require("./routes/sub_menu_items.route"));

// Authentication
app.use("/api/v1/login", require("./routes/loginroutes/login.route"));
app.use("/api/v1/logout", require("./routes/logoutroutes/logout.route"));
app.use("/api/v1/users", require("./routes/usermastroutes/usermast.route"));

// Employee & Productivity
app.use("/api/v1/employee", require("./routes/Employee/employee.route"));
app.use("/api/v1/KT", require("./routes/KT/KT.route"));
app.use("/api/v1/holidaylist", require("./routes/HolidayList/HolidayList.route"));
app.use("/api/v1/holiday", require("./routes/holiday.route"));
app.use("/api/v1/empdash", require("./routes/employeedashboard/empdashboard.route"));

// Leave Management
app.use("/api/v1/leave", require("./routes/leaveroutes/leave.route"));
app.use("/api/v1/adminleave", require("./routes/leaveroutes/adminleave.route"));
app.use("/api/v1/leaveallotment", require("./routes/leaveroutes/leaveallotment.route"));
app.use("/api/v1/SingleLeaveAllotment", require("./routes/SingleLeaveAllotment/SingleLeaveAllotment.route"));

// Comp-Off Management
app.use("/api/v1/compoff", require("./routes/compoffroutes/compoff.route"));
app.use("/api/v1/approvecompoff", require("./routes/compoffroutes/admincompoff.route"));

// Project & Team Management
app.use("/api/v1/customer", require("./routes/customerroutes/customer.routes"));
app.use("/api/v1/module", require("./routes/project/module.route"));
app.use("/api/v1/project", require("./routes/project/project.route"));
app.use("/api/v1/projectteam", require("./routes/project/projectteam.route"));

// UI & Permissions
app.use("/api/v1/permission", require("./routes/Permission/permission.route"));
app.use("/api/v1/Group", require("./routes/groupMaster.route"));
app.use("/api/v1/draganddrop", require("./routes/dragAndDrop.route"));
app.use("/api/v1/drawer", require("./routes/drawer.routes"));

/** * ERROR HANDLING 
 */

// Catch-all for undefined routes
app.use("/*splat", (req, res, next) => {
  console.log(`Undefined route accessed: ${req.originalUrl}`);
  next(new ApiError(404, "Route not found"));
});

// Global error handling middleware (must be the last app.use)
app.use(errorHandler);

module.exports = { app };