import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: boolean | { rejectUnauthorized: boolean };
}

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'linnworks_shipping',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('Database client connected');
    });

    this.pool.on('acquire', (client: PoolClient) => {
      console.log('Client acquired from pool');
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      console.error(' Unexpected database error on idle client:', err.message);
    });

    this.pool.on('remove', (client: PoolClient) => {
      console.log('Database client removed from pool');
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Query executed:', {
          query: text.substring(0, 100),
          duration: `${duration}ms`,
          rows: result.rowCount || 0
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('Database query error:', {
        message: error.message,
        query: text.substring(0, 100),
        params
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as now, version() as version');
      console.log('Database connection successful');
      console.log('Server time:', result.rows[0].now);
      console.log('PostgreSQL:', result.rows[0].version.split(',')[0]);
      return true;
    } catch (error: any) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error: any) {
      console.error('Error closing database pool:', error.message);
      throw error;
    }
  }

  public async getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Export singleton instance methods
const dbConnection = DatabaseConnection.getInstance();

export const pool = dbConnection.getPool();
export const query = dbConnection.query.bind(dbConnection);
export const getClient = dbConnection.getClient.bind(dbConnection);
export const transaction = dbConnection.transaction.bind(dbConnection);
export const testConnection = dbConnection.testConnection.bind(dbConnection);
export const closePool = dbConnection.close.bind(dbConnection);
export const getPoolStats = dbConnection.getStats.bind(dbConnection);

export default dbConnection;