"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolStats = exports.closePool = exports.testConnection = exports.transaction = exports.getClient = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DatabaseConnection {
    constructor() {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'linnworks_shipping',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
        this.pool = new pg_1.Pool(config);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            console.log('Database client connected');
        });
        this.pool.on('acquire', (client) => {
            console.log('Client acquired from pool');
        });
        this.pool.on('error', (err, client) => {
            console.error(' Unexpected database error on idle client:', err.message);
        });
        this.pool.on('remove', (client) => {
            console.log('Database client removed from pool');
        });
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    getPool() {
        return this.pool;
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.NODE_ENV === 'development') {
                console.log('Query executed:', {
                    query: text.substring(0, 100),
                    duration: `${duration}ms`,
                    rows: result.rowCount || 0
                });
            }
            return result;
        }
        catch (error) {
            console.error('Database query error:', {
                message: error.message,
                query: text.substring(0, 100),
                params
            });
            throw error;
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction rolled back:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as now, version() as version');
            console.log('Database connection successful');
            console.log('Server time:', result.rows[0].now);
            console.log('PostgreSQL:', result.rows[0].version.split(',')[0]);
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }
    }
    async close() {
        try {
            await this.pool.end();
            console.log('Database connection pool closed');
        }
        catch (error) {
            console.error('Error closing database pool:', error.message);
            throw error;
        }
    }
    async getStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    }
}
// Export singleton instance methods
const dbConnection = DatabaseConnection.getInstance();
exports.pool = dbConnection.getPool();
exports.query = dbConnection.query.bind(dbConnection);
exports.getClient = dbConnection.getClient.bind(dbConnection);
exports.transaction = dbConnection.transaction.bind(dbConnection);
exports.testConnection = dbConnection.testConnection.bind(dbConnection);
exports.closePool = dbConnection.close.bind(dbConnection);
exports.getPoolStats = dbConnection.getStats.bind(dbConnection);
exports.default = dbConnection;
//# sourceMappingURL=connection.js.map