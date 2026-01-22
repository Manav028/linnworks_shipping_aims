"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedConfigurationStages = void 0;
const connection_1 = require("../connection");
const seedConfigurationStages = async () => {
    console.log('Seeding configuration stages...');
    const stages = [
        {
            name: 'ContactStage',
            title: 'Customer Details',
            description: 'Customer enters contact',
            order: 1,
            next_stage_name: 'AddressStage'
        },
        {
            name: 'AddressStage',
            title: 'Address Details',
            description: 'Customer enters address details',
            order: 2,
            next_stage_name: 'CONFIG'
        },
        {
            name: 'CONFIG',
            title: 'Configuration Complete',
            description: 'User configuration is active',
            order: 3,
            next_stage_name: null
        }
    ];
    try {
        for (const stage of stages) {
            const existing = await (0, connection_1.query)('SELECT config_stage_id FROM configuration_stages WHERE stage_name = $1', [stage.name]);
            if (existing.rowCount && existing.rowCount > 0) {
                console.log(`Stage ${stage.name} already exists, skipping...`);
                continue;
            }
            await (0, connection_1.query)(`INSERT INTO configuration_stages (
          stage_name,
          wizard_step_title,
          wizard_step_description,
          sort_order,
          is_active,
          next_stage_name
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [stage.name, stage.title, stage.description, stage.order, true, stage.next_stage_name]);
            console.log(`Created stage: ${stage.name}`);
        }
        console.log(`Seeded ${stages.length} configuration stages\n`);
    }
    catch (error) {
        console.error('Error seeding configuration stages:', error.message);
        throw error;
    }
};
exports.seedConfigurationStages = seedConfigurationStages;
//# sourceMappingURL=003_configuration_stages.js.map