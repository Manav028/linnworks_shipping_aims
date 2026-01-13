import fs from 'fs/promises';
import path from 'path';
import { query } from '../connection';

const SCHEMA_DIR = path.join(__dirname, '../schema');

export const runMigrations = async (): Promise<void> => {
  console.log('Starting database migrations...\n');

  try {
    const files = await fs.readdir(SCHEMA_DIR);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();  

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(SCHEMA_DIR, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      try {
        await query(sql);
        console.log(`Completed: ${file}\n`);
      } catch (error: any) {
        console.error(`Failed: ${file}`);
        console.error(`Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
