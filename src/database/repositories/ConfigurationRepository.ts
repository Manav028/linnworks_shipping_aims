import { BaseRepository } from './BaseRepository';
import { ConfigurationStage, ConfigurationItem, UserConfigurationValue } from '../../types/database.types';

export class ConfigurationRepository extends BaseRepository<ConfigurationStage> {

constructor() {
    super("configuration_stages");
}
  
  // Get configuration stage by name
  async getStageByName(stageName: string): Promise<ConfigurationStage | null> {
    const result = await this.executeQuery<ConfigurationStage>(
      `SELECT * FROM configuration_stages 
       WHERE stage_name = $1 AND is_active = true`,
      [stageName]
    );
    return result.rows[0] || null;
  }

  // Get all configuration items for a stage
  async getItemsByStageId(stageId: number): Promise<ConfigurationItem[]> {
    const result = await this.executeQuery<ConfigurationItem>(
      `SELECT * FROM configuration_items 
       WHERE config_stage_id = $1 
       ORDER BY sort_order ASC`,
      [stageId]
    );
    return result.rows;
  }

  // Get list values for a configuration item
  async getListValuesByItemId(itemId: string): Promise<any[]> {
    const result = await this.executeQuery(
      `SELECT display, value 
       FROM configuration_item_list_values 
       WHERE config_item_id = $1 AND is_active = true
       ORDER BY display ASC`,
      [itemId]
    );
    return result.rows;
  }

  // Get user's saved configuration values
  async getUserConfigValues(
    userId: string, 
    stageId: number
  ): Promise<UserConfigurationValue[]> {
    const result = await this.executeQuery<UserConfigurationValue>(
      `SELECT * FROM user_configuration_values 
       WHERE user_id = $1 AND config_stage_id = $2`,
      [userId, stageId]
    );
    return result.rows;
  }

  // Save or update user configuration value
  async saveUserConfigValue(
    userId: string,
    stageId: number,
    configItemId: string,
    configItemIdentifier: string,
    selectedValue: string
  ): Promise<void> {
    await this.executeQuery(
      `INSERT INTO user_configuration_values (
        user_id, 
        config_stage_id, 
        config_item_id, 
        config_item_identifier, 
        selected_value
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, config_item_id) 
      DO UPDATE SET 
        selected_value = EXCLUDED.selected_value,
        saved_date = CURRENT_TIMESTAMP`,
      [userId, stageId, configItemId, configItemIdentifier, selectedValue]
    );
  }

  // Delete all user config values
  async deleteUserConfigValues(userId: string): Promise<void> {
    await this.executeQuery(
      `DELETE FROM user_configuration_values WHERE user_id = $1`,
      [userId]
    );
  }

  async getNextStageName(currentStageName: string): Promise<string | null> {
    const result = await this.executeQuery<{ next_stage_name: string }>(
      `SELECT next_stage_name FROM configuration_stages 
       WHERE stage_name = $1 AND is_active = true`,
      [currentStageName]
    );
    return result.rows[0]?.next_stage_name || null;
  }

  // NEW: Check if stage is final
  async isFinalStage(stageName: string): Promise<boolean> {
    const result = await this.executeQuery<{ next_stage_name: string | null }>(
      `SELECT next_stage_name FROM configuration_stages 
       WHERE stage_name = $1`,
      [stageName]
    );
    return result.rows[0]?.next_stage_name === 'CONFIG' || result.rows[0]?.next_stage_name === null;
  }
}