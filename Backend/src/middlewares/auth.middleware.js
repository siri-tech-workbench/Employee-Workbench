const { verifyToken } = require("../utils/token.util");
const { DatabaseHandler } = require("../utils/DatabaseHandler");
const { ApiError } = require("../utils");

/**
 * authenticate
 * Express middleware that validates the Bearer token on every protected request.
 *
 * Steps:
 *   1. Extracts and verifies the JWT from the Authorization header
 *   2. Looks up the stored token in the DB to confirm the session is still active
 *   3. If the stored token does not match (user logged in elsewhere), records
 *      the logout time in login_log_details and rejects the request
 *   4. Attaches the decoded token payload to req.user for downstream handlers
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Reject requests with a missing or malformed Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized");
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        const db = new DatabaseHandler();

        // Check that the token matches the one stored in the DB for this login session.
        // A mismatch means the user has logged in from another device, invalidating this session.
        const query = `
      SELECT auth AS "auth"
      FROM login_details
      WHERE login_id = :login_id
    `;

        const result = await db.executeQuery(query, { login_id: decoded.login_id }, "siri_db");

        // No matching login record — treat as unauthorised, not a server error
        if (result.rows.length === 0) {
            throw new ApiError(401, "Unauthorized");
        }

        if (result.rows[0].auth !== token) {
            // Record the logout time for the most recent active session before rejecting.
            // This ensures the audit log is accurate when a session is displaced by a new login.
            const updateLogoutQuery = `
        UPDATE login_log_details
        SET logout_tm = TO_CHAR(SYSDATE, 'HH:MI:SS AM')
        WHERE login_log_id = (
          SELECT MAX(login_log_id)
          FROM login_log_details
          WHERE user_id = :user_id
        )
        AND logout_tm IS NULL
      `;

            await db.executeQuery(updateLogoutQuery, { user_id: decoded.user_id }, "siri_db");

            throw new ApiError(401, "You have been logged in using another device");
        }

        // Attach decoded token payload to the request for use in downstream route handlers
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Authentication error:", err);

        // Re-throw known ApiErrors (e.g. 401) without wrapping them
        if (err instanceof ApiError) {
            return next(err);
        }

        // Wrap unexpected errors as 401 to avoid leaking internal details to the client
        next(new ApiError(401, err.message));
    }
};

module.exports = { authenticate };