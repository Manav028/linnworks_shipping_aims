"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const connection_1 = require("../connection");
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }
    async executeQuery(text, params) {
        return await (0, connection_1.query)(text, params);
    }
    async findById(id) {
        const result = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE ${this.getIdColumn()} = $1`, [id]);
        return result.rows[0] || null;
    }
    async findAll(limit = 100, offset = 0) {
        const result = await this.executeQuery(`SELECT * FROM ${this.tableName} ORDER BY created_date DESC LIMIT $1 OFFSET $2`, [limit, offset]);
        return result.rows;
    }
    async count() {
        const result = await this.executeQuery(`SELECT COUNT(*) as count FROM ${this.tableName}`);
        return parseInt(result.rows[0].count);
    }
    async delete(id) {
        const result = await this.executeQuery(`DELETE FROM ${this.tableName} WHERE ${this.getIdColumn()} = $1`, [id]);
        return (result.rowCount || 0) > 0;
    }
    getIdColumn() {
        return `${this.tableName.slice(0, -1)}_id`;
    }
    async transaction(callback) {
        return await (0, connection_1.transaction)(callback);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map