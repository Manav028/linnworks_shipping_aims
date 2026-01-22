"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCourierServices = void 0;
const connection_1 = require("../connection");
const uuid_1 = require("uuid");
const seedCourierServices = async () => {
    console.log('Seeding courier services...');
    const services = [
        {
            id: (0, uuid_1.v4)(),
            uniqueId: (0, uuid_1.v4)(),
            code: 'FEDEX_GROUND',
            name: 'FedEx Ground',
            tag: 'Ground',
            group: 'FedEx'
        },
    ];
    try {
        for (const service of services) {
            const existing = await (0, connection_1.query)('SELECT courier_service_id FROM courier_services WHERE service_code = $1', [service.code]);
            if (existing.rowCount && existing.rowCount > 0) {
                console.log(`Service ${service.code} already exists, skipping...`);
                continue;
            }
            await (0, connection_1.query)(`INSERT INTO courier_services (
          courier_service_id,
          service_unique_id,
          service_code,
          service_name,
          service_tag,
          service_group
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [
                service.id,
                service.uniqueId,
                service.code,
                service.name,
                service.tag,
                service.group
            ]);
            console.log(`Created service: ${service.name}`);
        }
        console.log(`Seeded ${services.length} courier services\n`);
    }
    catch (error) {
        console.error('Error seeding courier services:', error.message);
        throw error;
    }
};
exports.seedCourierServices = seedCourierServices;
//# sourceMappingURL=002_courier_services.js.map