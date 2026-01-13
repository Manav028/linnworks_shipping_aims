import { Query, QueryResult, QueryResultRow } from 'pg';
import { pool,query , transaction } from '../connection';

export abstract class BaseRepository<T extends QueryResultRow> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async executeQuery<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<R>> {
    return await query<R>(text, params);
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.executeQuery<T>(
      `SELECT * FROM ${this.tableName} WHERE ${this.getIdColumn()} = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<T[]> {
    const result = await this.executeQuery<T>(
      `SELECT * FROM ${this.tableName} ORDER BY created_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return parseInt(result.rows[0].count);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE ${this.getIdColumn()} = $1`,
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  protected getIdColumn(): string {
    return `${this.tableName.slice(0, -1)}_id`;
  }

  protected async transaction<R>(
    callback: (client: any) => Promise<R>
  ): Promise<R> {
    return await transaction(callback);
  }
}