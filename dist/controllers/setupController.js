"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupController = exports.SetupController = void 0;
const uuid_1 = require("uuid");
const repositories_1 = require("../database/repositories");
const repositories_2 = require("../database/repositories/");
class SetupController {
    async addNewUser(req, res) {
        try {
            const { Email, LinnworksUniqueIdentifier, AccountName } = req.body;
            const existingUser = await repositories_1.userRepository.findByEmail(Email);
            if (existingUser) {
                res.json({
                    IsError: true,
                    ErrorMessage: "User with this email already exists",
                });
                return;
            }
            const authToken = (0, uuid_1.v4)();
            const user = await repositories_1.userRepository.create({
                authorizationToken: authToken,
                linnworksUniqueIdentifier: LinnworksUniqueIdentifier,
                email: Email,
                accountName: AccountName,
            });
            res.json({
                IsError: false,
                ErrorMessage: null,
                AuthorizationToken: user.authorization_token,
            });
        }
        catch (error) {
            console.error("Error in addNewUser:", error);
            res.json({
                IsError: true,
                ErrorMessage: `AddNewUser error: ${error.message}`,
            });
        }
    }
    async userConfig(req, res) {
        try {
            const user = req.user;
            // If config is not active (Wizard Stage)
            if (!user.is_config_active) {
                // If new integration, assign ContactStage
                if (user.config_status === "") {
                    await repositories_1.userRepository.updateConfigStatus(user.user_id, "ContactStage", false);
                    user.config_status = "ContactStage";
                }
                // Get the current stage configuration
                const stage = await repositories_2.configurationRepository.getStageByName(user.config_status);
                if (!stage) {
                    res.json({
                        IsError: true,
                        ErrorMessage: `Config stage is not handled: ${user.config_status}`,
                    });
                    return;
                }
                // Get configuration items for this stage
                const configItems = await repositories_2.configurationRepository.getItemsByStageId(stage.config_stage_id);
                // Get user's saved values for this stage
                const savedValues = await repositories_2.configurationRepository.getUserConfigValues(user.user_id, stage.config_stage_id);
                const savedValuesMap = new Map(savedValues.map((v) => [v.config_item_identifier, v.selected_value]));
                // Build config items with list values
                const items = await Promise.all(configItems.map(async (item) => {
                    let listValues = [];
                    if (item.value_type === 5) {
                        // LIST type
                        const values = await repositories_2.configurationRepository.getListValuesByItemId(item.config_item_id);
                        listValues = values.map((v) => ({
                            Display: v.display,
                            Value: v.value,
                        }));
                    }
                    return {
                        ConfigItemId: item.config_item_identifier,
                        Name: item.name,
                        Description: item.description || "",
                        GroupName: item.group_name || "",
                        SortOrder: item.sort_order,
                        SelectedValue: savedValuesMap.get(item.config_item_identifier) ||
                            item.default_value ||
                            "",
                        RegExValidation: item.regex_validation || null,
                        RegExError: item.regex_error || null,
                        MustBeSpecified: item.must_be_specified,
                        ReadOnly: item.read_only,
                        ValueType: item.value_type,
                        ListValues: listValues.length > 0 ? listValues : undefined,
                    };
                }));
                const configStage = {
                    WizardStepTitle: stage.wizard_step_title,
                    WizardStepDescription: stage.wizard_step_description || "",
                    ConfigItems: items,
                };
                res.json({
                    IsError: false,
                    ErrorMessage: null,
                    ConfigStage: configStage,
                    ConfigStatus: user.config_status,
                    IsConfigActive: user.is_config_active,
                });
            }
            else {
                // Config is active - return user config stage
                const stage = await repositories_2.configurationRepository.getStageByName("CONFIG");
                if (!stage) {
                    res.json({
                        IsError: true,
                        ErrorMessage: "CONFIG stage not found",
                    });
                    return;
                }
                const configItems = await repositories_2.configurationRepository.getItemsByStageId(stage.config_stage_id);
                const savedValues = await repositories_2.configurationRepository.getUserConfigValues(user.user_id, stage.config_stage_id);
                const savedValuesMap = new Map(savedValues.map((v) => [v.config_item_identifier, v.selected_value]));
                const items = await Promise.all(configItems.map(async (item) => {
                    let listValues = [];
                    if (item.value_type === 5) {
                        const values = await repositories_2.configurationRepository.getListValuesByItemId(item.config_item_id);
                        listValues = values.map((v) => ({
                            Display: v.display,
                            Value: v.value,
                        }));
                    }
                    return {
                        ConfigItemId: item.config_item_identifier,
                        Name: item.name,
                        Description: item.description || "",
                        GroupName: item.group_name || "",
                        SortOrder: item.sort_order,
                        SelectedValue: savedValuesMap.get(item.config_item_identifier) || "",
                        RegExValidation: item.regex_validation || undefined,
                        RegExError: item.regex_error || undefined,
                        MustBeSpecified: item.must_be_specified,
                        ReadOnly: item.read_only,
                        ValueType: item.value_type,
                        ListValues: listValues.length > 0 ? listValues : undefined,
                    };
                }));
                res.json({
                    IsError: false,
                    ConfigStage: {
                        WizardStepTitle: stage.wizard_step_title,
                        WizardStepDescription: stage.wizard_step_description || "",
                        ConfigItems: items,
                    },
                    IsConfigActive: true,
                    ConfigStatus: "CONFIG",
                    ErrorMessage: null,
                });
            }
        }
        catch (error) {
            console.error("Error in userConfig:", error);
            res.json({
                IsError: true,
                ErrorMessage: `UserConfig error: ${error.message}`,
            });
        }
    }
    async updateConfig(req, res) {
        try {
            const user = req.user;
            const { ConfigStatus, ConfigItems } = req.body;
            // Verify config status matches
            if (user.config_status !== ConfigStatus) {
                res.json({
                    IsError: true,
                    ErrorMessage: "Current config stage is not what is sent in the Update",
                });
                return;
            }
            // Get current stage
            const stage = await repositories_2.configurationRepository.getStageByName(ConfigStatus);
            if (!stage) {
                res.json({
                    IsError: true,
                    ErrorMessage: `Config stage not found: ${ConfigStatus}`,
                });
                return;
            }
            // Get all config items for validation
            const stageItems = await repositories_2.configurationRepository.getItemsByStageId(stage.config_stage_id);
            const itemsMap = new Map(stageItems.map((item) => [item.config_item_identifier, item]));
            // Validate and save each config item
            for (const configItem of ConfigItems) {
                const itemDef = itemsMap.get(configItem.ConfigItemId);
                if (!itemDef) {
                    continue; // Skip unknown items
                }
                // Check required fields
                if (itemDef.must_be_specified && !configItem.SelectedValue) {
                    res.json({
                        IsError: true,
                        ErrorMessage: `${itemDef.name} is required`,
                    });
                    return;
                }
                // Regex validation
                if (itemDef.regex_validation && configItem.SelectedValue) {
                    const regex = new RegExp(itemDef.regex_validation);
                    if (!regex.test(configItem.SelectedValue)) {
                        res.json({
                            IsError: true,
                            ErrorMessage: itemDef.regex_error || `${itemDef.name} format is invalid`,
                        });
                        return;
                    }
                }
                // Save value
                await repositories_2.configurationRepository.saveUserConfigValue(user.user_id, stage.config_stage_id, itemDef.config_item_id, configItem.ConfigItemId, configItem.SelectedValue);
            }
            // DYNAMIC STAGE PROGRESSION - Get next stage from database
            const nextStageName = await repositories_2.configurationRepository.getNextStageName(ConfigStatus);
            if (!nextStageName) {
                // No next stage defined - error
                res.json({
                    IsError: true,
                    ErrorMessage: `No next stage configured for ${ConfigStatus}`,
                });
                return;
            }
            // Check if next stage is CONFIG (final stage)
            if (nextStageName === "CONFIG") {
                // Activate configuration
                await repositories_1.userRepository.updateConfigStatus(user.user_id, "CONFIG", true);
                res.json({
                    IsError: false,
                    ErrorMessage: null,
                });
                return;
            }
            // Check if we're already in CONFIG (user updating active config)
            if (ConfigStatus === "CONFIG") {
                res.json({
                    IsError: false,
                    ErrorMessage: null,
                });
                return;
            }
            // Move to next stage
            await repositories_1.userRepository.updateConfigStatus(user.user_id, nextStageName, false);
            res.json({
                IsError: false,
                ErrorMessage: null,
            });
        }
        catch (error) {
            console.error("Error in updateConfig:", error);
            res.json({
                IsError: true,
                ErrorMessage: `UpdateConfig error: ${error.message}`,
            });
        }
    }
    async configDelete(req, res) {
        try {
            const user = req.user;
            await repositories_2.configurationRepository.deleteUserConfigValues(user.user_id);
            await repositories_1.userRepository.softDelete(user.user_id);
            res.json({
                IsError: false,
                ErrorMessage: null,
            });
        }
        catch (error) {
            console.error("Error in configDelete:", error);
            res.json({
                IsError: true,
                ErrorMessage: `ConfigDelete error: ${error.message}`,
            });
        }
    }
    async userAvailableServices(req, res) {
        try {
            const user = req.user;
            const services = await repositories_2.courierServiceRepository.getAllActive();
            const userServiceIds = await repositories_2.courierServiceRepository.getUserAvailableServices(user.user_id);
            const filteredServices = services.filter(s => userServiceIds.includes(s.courier_service_id));
            const serviceDetails = await Promise.all(filteredServices.map(async (service) => {
                const configItems = await repositories_2.courierServiceRepository.getServiceConfigItems(service.courier_service_id);
                const configItemDetails = await Promise.all(configItems.map(async (item) => {
                    let listValues = [];
                    if (item.value_type === 5) {
                        const values = await repositories_2.courierServiceRepository.getServiceConfigItemListValues(item.service_config_item_id);
                        listValues = values.map((v) => ({
                            Display: v.display,
                            Value: v.value,
                        }));
                    }
                    return {
                        ConfigItemId: item.service_config_item_id.toString(),
                        Name: item.name,
                        Description: item.description || "",
                        GroupName: item.group_name || "",
                        SortOrder: item.sort_order,
                        SelectedValue: "",
                        RegExValidation: item.regex_validation || null,
                        RegExError: item.regex_error || null,
                        MustBeSpecified: item.must_be_specified,
                        ReadOnly: item.read_only,
                        ValueType: item.value_type,
                        ListValues: listValues.length > 0 ? listValues : undefined,
                    };
                }));
                const properties = await repositories_2.courierServiceRepository.getServiceProperties(service.courier_service_id);
                const serviceProperties = properties.map((prop) => ({
                    PropertyName: prop.property_name,
                    PropertyValue: prop.property_value,
                }));
                return {
                    ServiceName: service.service_name,
                    ServiceCode: service.service_code,
                    ServiceTag: service.service_tag || "",
                    ServiceGroup: service.service_group || "",
                    ServiceUniqueId: service.service_unique_id,
                    ConfigItems: configItemDetails,
                    ServiceProperty: serviceProperties,
                };
            }));
            res.json({
                IsError: false,
                ErrorMessage: null,
                Services: serviceDetails,
            });
        }
        catch (error) {
            console.error("Error in userAvailableServices:", error);
            res.json({
                IsError: true,
                ErrorMessage: `UserAvailableServices error: ${error.message}`,
            });
        }
    }
}
exports.SetupController = SetupController;
exports.setupController = new SetupController();
//# sourceMappingURL=setupController.js.map