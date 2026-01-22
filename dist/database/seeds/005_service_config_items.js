"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedServiceConfigItems = void 0;
const connection_1 = require("../connection");
const seedServiceConfigItems = async () => {
    console.log('Seeding courier service config items...');
    try {
        // Get FedEx Ground service
        const fedexResult = await (0, connection_1.query)(`SELECT courier_service_id FROM courier_services WHERE service_code = $1`, ['FEDEX_GROUND']);
        if (fedexResult.rowCount === 0) {
            console.log('FedEx Ground service not found, skipping...');
            return;
        }
        const fedexServiceId = fedexResult.rows[0].courier_service_id;
        // Add config items for FedEx
        const configItems = [
            {
                name: 'Fragile',
                description: 'Is the package fragile?',
                groupName: 'Handling Options',
                sortOrder: 1,
                mustBeSpecified: false,
                readOnly: false,
                valueType: 3,
                RegExValidation: null,
                RegExError: null,
            },
        ];
        for (const item of configItems) {
            // Check if exists
            const existing = await (0, connection_1.query)(`SELECT service_config_item_id FROM courier_service_config_items 
         WHERE courier_service_id = $1 AND name = $2`, [fedexServiceId, item.name]);
            if (existing.rowCount && existing.rowCount > 0) {
                console.log(`Config item "${item.name}" already exists, skipping...`);
                continue;
            }
            // Insert config item
            const result = await (0, connection_1.query)(`INSERT INTO courier_service_config_items (
          courier_service_id, name, description, group_name, 
          sort_order, must_be_specified, read_only, value_type, regex_validation, regex_error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING service_config_item_id`, [
                fedexServiceId,
                item.name,
                item.description,
                item.groupName,
                item.sortOrder,
                item.mustBeSpecified,
                item.readOnly,
                item.valueType,
                item.RegExValidation,
                item.RegExError
            ]);
            console.log(`Created config item: ${item.name}`);
        }
        console.log('Seeded service config items\n');
    }
    catch (error) {
        console.error('Error seeding service config items:', error.message);
        throw error;
    }
};
exports.seedServiceConfigItems = seedServiceConfigItems;
//# sourceMappingURL=005_service_config_items.js.map