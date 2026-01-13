import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askConfirmation = (question: string): Promise<boolean> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

const dropDatabase = async (): Promise<void> => {
  const dbName = process.env.DB_NAME || 'linnworks_shipping';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');

  console.log('═══════════════════════════════════════');
  console.log('      DATABASE DROP TOOL  ');
  console.log('═══════════════════════════════════════\n');
  console.log(`Database to drop: ${dbName}`);
  console.log(`Host: ${dbHost}:${dbPort}\n`);

  const confirmed = await askConfirmation(
    'This will DELETE ALL DATA. Are you sure? (yes/no): '
  );

  if (!confirmed) {
    console.log('\nOperation cancelled\n');
    rl.close();
    process.exit(0);
  }

  const client = new Client({
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword,
  });

  try {
    await client.connect();
    console.log('\nConnected to PostgreSQL server');

    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [dbName]);

    console.log('Terminated existing connections');

    // Drop database
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`Database "${dbName}" dropped successfully!\n`);

  } catch (error: any) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    rl.close();
  }
};

// Execute
if (require.main === module) {
  dropDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default dropDatabase;