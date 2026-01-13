import pool from './connection';

export const initDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    console.log('Database initialized and ready');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

export default pool;