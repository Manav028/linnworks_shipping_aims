import { BaseRepository } from './BaseRepository';
import { User } from '../../types/database.types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByAuthToken(authToken: string): Promise<User | null> {
    const result = await this.executeQuery<User>(
      'SELECT * FROM users WHERE authorization_token = $1 AND is_deleted = false',
      [authToken]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.executeQuery<User>(
      'SELECT * FROM users WHERE email = $1 AND is_deleted = false',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    authorizationToken: string;
    linnworksUniqueIdentifier: string;
    email: string;
    accountName: string;
  }): Promise<User> {
    const result = await this.executeQuery<User>(
      `INSERT INTO users (
        authorization_token,
        linnworks_unique_identifier,
        email,
        account_name
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        data.authorizationToken,
        data.linnworksUniqueIdentifier,
        data.email,
        data.accountName
      ]
    );
    return result.rows[0];
  }

  async updateConfigStatus(
    userId: string,
    configStatus: string,
    isConfigActive: boolean
  ): Promise<User | null> {
    const result = await this.executeQuery<User>(
      `UPDATE users 
       SET config_status = $1, 
           is_config_active = $2,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING *`,
      [configStatus, isConfigActive, userId]
    );
    return result.rows[0] || null;
  }

  async softDelete(userId: string): Promise<boolean> {
    const result = await this.executeQuery(
      `UPDATE users 
       SET is_deleted = true,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );
    return (result.rowCount || 0) > 0;
  }
}