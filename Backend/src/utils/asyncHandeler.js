/**
 * A wrapper function for asynchronous Express route handlers.
 * It ensures that any rejected promises or thrown errors in async functions
 * are caught and passed to the next() middleware.
 */
const asyncHandler = (requestHandler) => {
    // Returns a standard Express middleware function
    return (req, res, next) => {
        /**
         * Promise.resolve() handles the execution of the passed controller.
         * If the controller is an async function, it returns a promise.
         * If the promise rejects (an error occurs), .catch() triggers next(err).
         */
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            // Passes the error to the Express global error handler
            next(err)
        })
    }
}

// Export the wrapper for use in all route controllers
module.exports = {
    asyncHandler
}