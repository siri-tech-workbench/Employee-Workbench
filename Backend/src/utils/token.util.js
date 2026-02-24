const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) for user authentication.
 * @param {Object} payload - The data to be encoded within the token (e.g., userId, role).
 * @returns {string} The signed JWT string.
 */
const signToken = (payload) => {
    // Generates token using a secret key and a configured expiration time
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    });
};

/**
 * Validates a JWT and decodes its payload.
 * @param {string} token - The JWT string provided by the client.
 * @returns {Object} The decoded token payload if valid.
 * @throws {JsonWebTokenError} If the token is invalid or expired.
 */
const verifyToken = (token) => {
    // Verifies the token against the secret key to ensure authenticity
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Authentication utility exports for session management.
 */
module.exports = {
    signToken,
    verifyToken
};