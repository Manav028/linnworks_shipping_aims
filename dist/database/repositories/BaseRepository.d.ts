import { QueryResult, QueryResultRow } from 'pg';
export declare abstract class BaseRepository<T extends QueryResultRow> {
    protected tableName: string;
    constructor(tableName: string);
    protected executeQuery<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>>;
    findById(id: string): Promise<T | null>;
    findAll(limit?: number, offset?: number): Promise<T[]>;
    count(): Promise<number>;
    delete(id: string): Promise<boolean>;
    protected getIdColumn(): string;
    protected transaction<R>(callback: (client: any) => Promise<R>): Promise<R>;
}
//# sourceMappingURL=BaseRepository.d.ts.map