import { query } from '../connection';
import { v4 as uuidv4 } from 'uuid';

export const seedCourierServices = async (): Promise<void> => {
  console.log('Seeding courier services...');

  const services = [
    {
      id: uuidv4(),
      uniqueId: uuidv4(),
      code: 'FEDEX_GROUND',
      name: 'FedEx Ground',
      tag: 'Ground',
      group: 'FedEx'
    },
  ];

  try {
    for (const service of services) {
      
      const existing = await query(
        'SELECT courier_service_id FROM courier_services WHERE service_code = $1',
        [service.code]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Service ${service.code} already exists, skipping...`);
        continue;
      }

      await query(
        `INSERT INTO courier_services (
          courier_service_id,
          service_unique_id,
          service_code,
          service_name,
          service_tag,
          service_group
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          service.id,
          service.uniqueId,
          service.code,
          service.name,
          service.tag,
          service.group
        ]
      );

      console.log(`Created service: ${service.name}`);
    }

    console.log(`Seeded ${services.length} courier services\n`);

  } catch (error: any) {
    console.error('Error seeding courier services:', error.message);
    throw error;
  }
};