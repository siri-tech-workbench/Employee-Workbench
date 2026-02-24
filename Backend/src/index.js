/**
 * Application Entry Point
 * Initializes environment variables and starts the Express server listener.
 */

// Load environment variables from the .env file into process.env
require("dotenv").config();

// Import the configured Express application instance
const { app } = require("./app");

// Define the network port from environment variables or default to 3000 for local development
const PORT = process.env.PORT || 3000;

/**
 * Start the server and listen for incoming network requests.
 * Standardizes the startup log for easier debugging during local development.
 */
app.listen(PORT, () => {
    console.log(`Server successfully started and listening on port ${PORT}`);
});