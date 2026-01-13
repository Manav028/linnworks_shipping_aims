import { testConnection, closePool } from '../connection';
import { runMigrations } from './index';

const migrate = async () => {
  console.log('═══════════════════════════════════════');
  console.log('   DATABASE MIGRATION TOOL');
  console.log('═══════════════════════════════════════\n');

  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    console.log('\nRunning migrations...\n');
    await runMigrations();
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Run if called directly
if (require.main === module) {
  migrate();
}

export default migrate;