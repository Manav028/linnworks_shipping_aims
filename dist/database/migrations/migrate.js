"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../connection");
const index_1 = require("./index");
const migrate = async () => {
    console.log('═══════════════════════════════════════');
    console.log('   DATABASE MIGRATION TOOL');
    console.log('═══════════════════════════════════════\n');
    try {
        console.log('Testing database connection...');
        const connected = await (0, connection_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        console.log('\nRunning migrations...\n');
        await (0, index_1.runMigrations)();
        console.log('\nMigration completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('\nMigration failed:', error);
        process.exit(1);
    }
    finally {
        await (0, connection_1.closePool)();
    }
};
// Run if called directly
if (require.main === module) {
    migrate();
}
exports.default = migrate;
//# sourceMappingURL=migrate.js.map