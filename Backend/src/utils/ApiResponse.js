/**
 * Utility class for structuring consistent API responses.
 * Used across controllers to wrap data and status information.
 */
class ApiResponse {
    /**
     * @param {number} statusCode - The HTTP status code (e.g., 200, 201, 400, 500).
     * @param {any} data - The payload to be sent to the client (assigned to 'items').
     * @param {string} message - A human-readable description of the result (defaults to "Success").
     * @param {number|boolean} Status - Optional explicit status flag (1 for success, 0 for failure).
     */
    constructor(statusCode, data, message = "Success", Status) {
        // The HTTP status code for the response
        this.statusCode = statusCode

        // The actual data payload (e.g., array of employees, project object)
        this.items = data

        // Commented out: Dynamic assignment of data properties directly to 'this'
        // Object.assign(this, data) 

        // Descriptive message for the frontend to display or log
        this.message = message

        // Boolean flag: True if statusCode is between 100-399
        this.sucess = statusCode < 400

        /**
         * Numeric Status indicator:
         * Uses provided Status, otherwise defaults based on the statusCode.
         * Useful for legacy systems or specific frontend logic requiring 1/0.
         */
        this.Status = Status !== undefined ? Status : (statusCode < 400 ? 1 : 0);
    }
}

// Exporting the class for use in controller files
module.exports = {
    ApiResponse
}