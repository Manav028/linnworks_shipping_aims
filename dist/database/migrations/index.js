"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("../connection");
const SCHEMA_DIR = path_1.default.join(__dirname, '../schema');
const runMigrations = async () => {
    console.log('Starting database migrations...\n');
    try {
        const files = await promises_1.default.readdir(SCHEMA_DIR);
        const sqlFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();
        for (const file of sqlFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = path_1.default.join(SCHEMA_DIR, file);
            const sql = await promises_1.default.readFile(filePath, 'utf-8');
            try {
                await (0, connection_1.query)(sql);
                console.log(`Completed: ${file}\n`);
            }
            catch (error) {
                console.error(`Failed: ${file}`);
                console.error(`Error: ${error.message}\n`);
                throw error;
            }
        }
        console.log('All migrations completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
//# sourceMappingURL=index.js.map