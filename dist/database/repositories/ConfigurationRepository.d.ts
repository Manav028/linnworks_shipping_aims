import { BaseRepository } from './BaseRepository';
import { ConfigurationStage, ConfigurationItem, UserConfigurationValue } from '../../types/database.types';
export declare class ConfigurationRepository extends BaseRepository<ConfigurationStage> {
    constructor();
    getStageByName(stageName: string): Promise<ConfigurationStage | null>;
    getItemsByStageId(stageId: number): Promise<ConfigurationItem[]>;
    getListValuesByItemId(itemId: string): Promise<any[]>;
    getUserConfigValues(userId: string, stageId: number): Promise<UserConfigurationValue[]>;
    saveUserConfigValue(userId: string, stageId: number, configItemId: string, configItemIdentifier: string, selectedValue: string): Promise<void>;
    deleteUserConfigValues(userId: string): Promise<void>;
    getNextStageName(currentStageName: string): Promise<string | null>;
    isFinalStage(stageName: string): Promise<boolean>;
}
//# sourceMappingURL=ConfigurationRepository.d.ts.map