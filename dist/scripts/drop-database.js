"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const readline = __importStar(require("readline"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const askConfirmation = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
};
const dropDatabase = async () => {
    const dbName = process.env.DB_NAME || 'linnworks_shipping';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = parseInt(process.env.DB_PORT || '5432');
    console.log('═══════════════════════════════════════');
    console.log('      DATABASE DROP TOOL  ');
    console.log('═══════════════════════════════════════\n');
    console.log(`Database to drop: ${dbName}`);
    console.log(`Host: ${dbHost}:${dbPort}\n`);
    const confirmed = await askConfirmation('This will DELETE ALL DATA. Are you sure? (yes/no): ');
    if (!confirmed) {
        console.log('\nOperation cancelled\n');
        rl.close();
        process.exit(0);
    }
    const client = new pg_1.Client({
        host: dbHost,
        port: dbPort,
        database: 'postgres',
        user: dbUser,
        password: dbPassword,
    });
    try {
        await client.connect();
        console.log('\nConnected to PostgreSQL server');
        // Terminate existing connections
        await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [dbName]);
        console.log('Terminated existing connections');
        // Drop database
        await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log(`Database "${dbName}" dropped successfully!\n`);
    }
    catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
    finally {
        await client.end();
        rl.close();
    }
};
// Execute
if (require.main === module) {
    dropDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = dropDatabase;
//# sourceMappingURL=drop-database.js.map