/**
 * ApiError
 * Custom error class for structured API error responses.
 * Extends the native Error so it works naturally with Express error handlers
 * and instanceof checks throughout the codebase.
 *
 * Usage:
 *   throw new ApiError(400, "Validation failed");
 *   throw new ApiError(404, "Resource not found");
 *   throw new ApiError(500, "Internal server error", [], err.stack);
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
     * @param {string} message - Human-readable error description sent to the client
     * @param {Array}  errors - Optional array of detailed validation or field errors
     * @param {string} stack - Optional stack trace (used when wrapping an existing error)
     */
    constructor(statusCode, message = "Something went wrong", errors = [], stack) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.status = 0;
        this.errors = errors;
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = { ApiError };