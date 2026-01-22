"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_database_1 = __importDefault(require("./create-database"));
const migrations_1 = require("../database/migrations");
const index_1 = require("../database/seeds/index");
const connection_1 = require("../database/connection");
const drop_database_1 = __importDefault(require("./drop-database"));
const resetDatabase = async () => {
    console.log('═══════════════════════════════════════');
    console.log('     DATABASE RESET TOOL  ');
    console.log('═══════════════════════════════════════\n');
    try {
        console.log('1️Dropping existing database...\n');
        await (0, drop_database_1.default)();
        console.log('\n2️Creating fresh database...\n');
        await (0, create_database_1.default)();
        console.log('\n3️Running migrations...\n');
        await (0, migrations_1.runMigrations)();
        console.log('\n4️Seeding initial data...\n');
        await (0, index_1.runSeeds)();
        console.log('\nDatabase reset completed successfully!\n');
    }
    catch (error) {
        console.error('\nReset failed:', error.message);
        process.exit(1);
    }
    finally {
        await (0, connection_1.closePool)();
    }
};
// Execute
if (require.main === module) {
    resetDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = resetDatabase;
//# sourceMappingURL=reset-database.js.map