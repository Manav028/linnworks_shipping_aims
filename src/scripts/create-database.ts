import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createDatabase = async (): Promise<void> => {
  const dbName = process.env.DB_NAME || '';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');

  console.log('═══════════════════════════════════════');
  console.log('   DATABASE CREATION TOOL');
  console.log('═══════════════════════════════════════\n');
  console.log(`Database Name: ${dbName}`);
  console.log(`Host: ${dbHost}:${dbPort}`);
  console.log(`User: ${dbUser}\n`);

  const client = new Client({
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server\n');

    // Check if database exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rowCount && checkResult.rowCount > 0) {
      console.log(`Database "${dbName}" already exists`);
      console.log('Use "npm run db:reset" to drop and recreate\n');
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully!\n`);
      console.log('Next steps:');
      console.log('1. Run: npm run db:migrate');
      console.log('2. Run: npm run db:seed\n');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

// Execute
if (require.main === module) {
  createDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default createDatabase;