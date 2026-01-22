"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = void 0;
const _001_default_user_1 = require("./001_default_user");
const _002_courier_services_1 = require("./002_courier_services");
const _003_configuration_stages_1 = require("./003_configuration_stages");
const connection_1 = require("../connection");
const _004_configuraion_items_1 = require("./004_configuraion_items");
const _005_service_config_items_1 = require("./005_service_config_items");
const _006_service_allocate_customer_1 = require("./006_service_allocate_customer");
const runSeeds = async () => {
    console.log('═══════════════════════════════════════');
    console.log('   DATABASE SEEDING');
    console.log('═══════════════════════════════════════\n');
    try {
        const connected = await (0, connection_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        await (0, _001_default_user_1.seedDefaultUser)();
        await (0, _002_courier_services_1.seedCourierServices)();
        await (0, _003_configuration_stages_1.seedConfigurationStages)();
        await (0, _004_configuraion_items_1.seedConfigurationItems)();
        await (0, _005_service_config_items_1.seedServiceConfigItems)();
        await (0, _006_service_allocate_customer_1.seedServiceAllocateCustomer)();
        console.log('All seeds completed successfully!');
    }
    catch (error) {
        console.error('Seeding failed:', error.message);
        throw error;
    }
};
exports.runSeeds = runSeeds;
if (require.main === module) {
    (0, exports.runSeeds)()
        .then(() => {
        console.log('\nSeeding complete, closing connection...');
        (0, connection_1.closePool)().then(() => process.exit(0));
    })
        .catch((error) => {
        console.error('Fatal error:', error);
        (0, connection_1.closePool)().then(() => process.exit(1));
    });
}
//# sourceMappingURL=index.js.map