const { ApiError } = require("../utils");

/**
 * errorHandler
 * Global Express error-handling middleware.
 * Must be registered last in the middleware chain (after all routes).
 *
 * Normalises any error into an ApiError, logs it with a formatted IST timestamp,
 * and sends a structured JSON response to the client.
 * The stack trace is included in the response body only in development mode.
 *
 * @param {Error} err - The error passed via next(err)
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Wrap non-ApiError instances so all errors share a consistent shape
    if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        error = new ApiError(statusCode, message, err.errors || [], err.stack);
    }

    // Format the current timestamp in IST for server log readability
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
        timeZone: "Asia/Kolkata",
    }).format(new Date());

    console.error(`[${formattedDate}] Error on ${req.originalUrl}:`, error);

    // Build the response — stack trace is only exposed in development to avoid
    // leaking internal implementation details to clients in production
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };