import createDatabase from './create-database';
import { runMigrations } from '../database/migrations';
import { runSeeds } from '../database/seeds/index';
import { closePool } from '../database/connection';
import dropDatabase from './drop-database';

const resetDatabase = async (): Promise<void> => {
  console.log('═══════════════════════════════════════');
  console.log('     DATABASE RESET TOOL  ');
  console.log('═══════════════════════════════════════\n');

  try {
    console.log('1️Dropping existing database...\n');
    await dropDatabase();

    console.log('\n2️Creating fresh database...\n');
    await createDatabase();

    console.log('\n3️Running migrations...\n');
    await runMigrations();

    console.log('\n4️Seeding initial data...\n');
    await runSeeds();

    console.log('\nDatabase reset completed successfully!\n');

  } catch (error: any) {
    console.error('\nReset failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Execute
if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default resetDatabase;