import { seedDefaultUser } from './001_default_user';
import { seedCourierServices } from './002_courier_services';
import { seedConfigurationStages } from './003_configuration_stages';
import { testConnection, closePool } from '../connection';
import { seedConfigurationItems } from './004_configuraion_items';
import { seedServiceConfigItems } from './005_service_config_items';
import { seedServiceAllocateCustomer } from './006_service_allocate_customer';

export const runSeeds = async (): Promise<void> => {
  console.log('═══════════════════════════════════════');
  console.log('   DATABASE SEEDING');
  console.log('═══════════════════════════════════════\n');

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    await seedDefaultUser();
    await seedCourierServices();
    await seedConfigurationStages();
    await seedConfigurationItems();
    await seedServiceConfigItems();
    await seedServiceAllocateCustomer();

    console.log('All seeds completed successfully!');

  } catch (error: any) {
    console.error('Seeding failed:', error.message);
    throw error;
  }
};

if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('\nSeeding complete, closing connection...');
      closePool().then(() => process.exit(0));
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      closePool().then(() => process.exit(1));
    });
}