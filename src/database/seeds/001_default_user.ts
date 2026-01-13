import { query } from '../connection';
import { v4 as uuidv4 } from 'uuid';

export const seedDefaultUser = async (): Promise<void> => {
  console.log('Seeding default user...');

  const linnworksId = uuidv4();

  try {
    const existing = await query(
      'SELECT user_id FROM users WHERE email = $1',
      ['admin@linnworks-shipping.com']
    );

    if (existing.rowCount && existing.rowCount > 0) {
      console.log('Default user already exists, skipping...');
      return;
    }

    await query(
      `INSERT INTO users (
        linnworks_unique_identifier,
        email,
        account_name,
        is_config_active,
        config_status
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        'admin@linnworks-shipping.com',
        'Default Admin Account',
        false,
        ""
      ]
    );

    console.log('Default user created');
    console.log('Email:', 'admin@linnworks-shipping.com');
    console.log('Save this token for API testing!\n');

  } catch (error: any) {
    console.error('Error seeding default user:', error.message);
    throw error;
  }
};