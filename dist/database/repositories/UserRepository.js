"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('users');
    }
    async findByAuthToken(authToken) {
        const result = await this.executeQuery('SELECT * FROM users WHERE authorization_token = $1 AND is_deleted = false', [authToken]);
        return result.rows[0] || null;
    }
    async findByEmail(email) {
        const result = await this.executeQuery('SELECT * FROM users WHERE email = $1 AND is_deleted = false', [email]);
        return result.rows[0] || null;
    }
    async create(data) {
        const result = await this.executeQuery(`INSERT INTO users (
        authorization_token,
        linnworks_unique_identifier,
        email,
        account_name
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`, [
            data.authorizationToken,
            data.linnworksUniqueIdentifier,
            data.email,
            data.accountName
        ]);
        return result.rows[0];
    }
    async updateConfigStatus(userId, configStatus, isConfigActive) {
        const result = await this.executeQuery(`UPDATE users 
       SET config_status = $1, 
           is_config_active = $2,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING *`, [configStatus, isConfigActive, userId]);
        return result.rows[0] || null;
    }
    async softDelete(userId) {
        const result = await this.executeQuery(`UPDATE users 
       SET is_deleted = true,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE user_id = $1`, [userId]);
        return (result.rowCount || 0) > 0;
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map