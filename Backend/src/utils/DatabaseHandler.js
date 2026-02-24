const OracleDB = require('oracledb');

/**
 * Core Database Handler for Oracle DB operations.
 * Manages connection pooling, query execution, and lifecycle management.
 */
class DatabaseHandler {
    constructor() {
        try {
            // Initializes the Oracle Instant Client using the path defined in environment variables
            OracleDB.initOracleClient({ libDir: process.env.LIBDIRPATH });

            // Sets the default output format to JSON objects for easier manipulation in JavaScript
            OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        } catch (err) {
            console.error('Error initializing Oracle client', err);
            throw err;
        }

        // Storage for active connection pools, keyed by their alias
        this.pools = {};

        // Configuration settings for different database instances
        this.dbConfigs = {
            siri_db: {
                user: process.env.SIRI_DB_USER,
                password: process.env.SIRI_DB_PASSWORD,
                connectString: process.env.SIRI_DB_CONNECTIONSTRING,
                poolMin: 0,       // Minimum number of connections to keep open
                poolMax: 20,      // Maximum number of connections in the pool
                poolIncrement: 1  // Number of new connections to create when the pool is exhausted
            },
        };
    }

    /**
     * Creates a new connection pool for a specific database alias if it doesn't already exist.
     * @param {string} alias - The key representing the database configuration.
     */
    async initializePool(alias) {
        if (!this.dbConfigs[alias]) {
            throw new Error(`Database alias "${alias}" not found in config`);
        }

        if (!this.pools[alias]) {
            try {
                // Asynchronously creates the pool using the defined config
                this.pools[alias] = await OracleDB.createPool(this.dbConfigs[alias]);
            } catch (err) {
                console.error(` Error creating connection pool for ${alias}`, err);
                throw err;
            }
        }
    }

    /**
     * Retrieves an active connection from the pool.
     * Lazily initializes the pool if it hasn't been started yet.
     * @param {string} alias - The database alias.
     */
    async getConnection(alias) {
        if (!this.dbConfigs[alias]) {
            throw new Error(`Database alias "${alias}" not found in config`);
        }

        try {
            if (!this.pools[alias]) await this.initializePool(alias);
            return await this.pools[alias].getConnection();
        } catch (err) {
            console.error(` Error getting connection from pool "${alias}"`, err);
            throw err;
        }
    }

    /**
     * Gracefully closes a specific connection pool.
     * @param {string} alias - The database alias to shut down.
     */
    async closePool(alias) {
        if (this.pools[alias]) {
            try {
                // Closes the pool with a 10-second drain timeout for active connections
                await this.pools[alias].close(10);
                delete this.pools[alias];
            } catch (err) {
                console.error(` Error closing pool "${alias}"`, err);
            }
        }
    }

    /**
     * Shuts down all active database pools.
     * Typically called during application termination (SIGTERM/SIGINT).
     */
    async closeAllPools() {
        for (const alias in this.pools) {
            await this.closePool(alias);
        }
    }

    /**
     * Primary method for executing SQL commands.
     * Handles connection acquisition, execution, and guaranteed release (cleanup).
     * @param {string} query - The SQL statement to run.
     * @param {Object} bindParams - Parameters to safely inject into the query.
     * @param {string} alias - The target database alias.
     */
    async executeQuery(query, bindParams = {}, alias) {
        let connection;
        let result;
        try {
            // 1. Get a connection from the pool
            connection = await this.getConnection(alias);

            // 2. Execute query with auto-commit enabled for DML operations
            result = await connection.execute(query, bindParams, { autoCommit: true });
        } catch (err) {
            console.error(` Error executing query in ${alias}`, err);
            throw err;
        } finally {
            // 3. Always release the connection back to the pool, even if the query fails
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(` Error closing connection in ${alias}`, err);
                }
            }
        }
        return result;
    }
}

module.exports = { DatabaseHandler };