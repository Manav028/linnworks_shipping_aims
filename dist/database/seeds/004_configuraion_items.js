"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedConfigurationItems = void 0;
const connection_1 = require("../connection");
const seedConfigurationItems = async () => {
    console.log('Seeding configuration items...');
    try {
        // Fetch stage IDs
        const stagesResult = await (0, connection_1.query)(`SELECT config_stage_id, stage_name FROM configuration_stages`);
        const stageMap = new Map(stagesResult.rows.map((r) => [r.stage_name, r.config_stage_id]));
        console.log('Fetched configuration stages:', Array.from(stageMap.keys()));
        const items = [
            {
                stage: 'ContactStage',
                identifier: 'USERNAME',
                name: 'Username',
                description: 'User full name',
                group_name: 'Contact Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 1,
                required: true
            },
            {
                stage: 'ContactStage',
                identifier: 'COMPANY_NAME',
                name: 'Company Name',
                description: 'Company or business name',
                group_name: 'Contact Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 2,
                required: true
            },
            {
                stage: 'AddressStage',
                identifier: 'ADDRESS_LINE1',
                name: 'Address Line 1',
                description: 'Street address',
                group_name: 'Address Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 1,
                required: true
            },
            {
                stage: 'AddressStage',
                identifier: 'ADDRESS_LINE2',
                name: 'Address Line 2',
                description: 'Apartment, suite, etc.',
                group_name: 'Address Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 2,
                required: false
            },
            {
                stage: 'AddressStage',
                identifier: 'CITY',
                name: 'City',
                description: 'City',
                group_name: 'Address Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 3,
                required: true
            },
            {
                stage: 'AddressStage',
                identifier: 'POSTCODE',
                name: 'Postcode',
                description: 'Postal code',
                group_name: 'Address Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 4,
                required: true
            },
            {
                stage: 'AddressStage',
                identifier: 'COUNTRY',
                name: 'Country',
                description: 'Country',
                group_name: 'Address Details',
                value_type: 0,
                read_only: false,
                default_value: '',
                sort: 5,
                required: true
            }
        ];
        for (const item of items) {
            const stageId = stageMap.get(item.stage);
            if (!stageId) {
                console.warn(`Stage ${item.stage} not found. Skipping item ${item.identifier}`);
                continue;
            }
            const exists = await (0, connection_1.query)(`SELECT 1 FROM configuration_items 
         WHERE config_item_identifier = $1 AND config_stage_id = $2`, [item.identifier, stageId]);
            if (exists.rowCount && exists.rowCount > 0) {
                console.log(`Item ${item.identifier} already exists, skipping...`);
                continue;
            }
            await (0, connection_1.query)(`INSERT INTO configuration_items (
          config_stage_id,
          config_item_identifier,
          name,
          description,
          group_name,
          sort_order,
          value_type,
          must_be_specified,
          read_only,
          default_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
                stageId,
                item.identifier,
                item.name,
                item.description,
                item.group_name,
                item.sort,
                item.value_type || 0,
                item.required,
                item.read_only || false,
                item.default_value || ''
            ]);
            console.log(`Created item ${item.identifier} for ${item.stage}`);
        }
        console.log('Configuration items seeded successfully\n');
    }
    catch (error) {
        console.error('Error seeding configuration items:', error.message);
        throw error;
    }
};
exports.seedConfigurationItems = seedConfigurationItems;
//# sourceMappingURL=004_configuraion_items.js.map