import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
declare class DatabaseConnection {
    private pool;
    private static instance;
    private constructor();
    private setupEventHandlers;
    static getInstance(): DatabaseConnection;
    getPool(): Pool;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
    getStats(): Promise<{
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    }>;
}
declare const dbConnection: DatabaseConnection;
export declare const pool: Pool;
export declare const query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
export declare const getClient: () => Promise<PoolClient>;
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
export declare const testConnection: () => Promise<boolean>;
export declare const closePool: () => Promise<void>;
export declare const getPoolStats: () => Promise<{
    totalCount: number;
    idleCount: number;
    waitingCount: number;
}>;
export default dbConnection;
//# sourceMappingURL=connection.d.ts.map