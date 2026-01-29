import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { userRepository } from "../database/repositories";
import { configurationRepository, courierServiceRepository } from "../database/repositories/";
import {
  AddNewUserRequest,
  AddNewUserResponse,
  UserConfigRequest,
  UserConfigResponse,
  UpdateConfigRequest,
  UpdateConfigResponse,
  ConfigDeleteRequest,
  ConfigDeleteResponse,
  ConfigStage,
  ConfigItem,
  CourierServiceDetail,
  ServiceProperty,
  UserAvailableServicesResponse,
} from "../types/api.types";
import { cache } from "joi";


export class SetupController {
  async addNewUser(req: Request, res: Response): Promise<void> {
    try {
      const { Email, LinnworksUniqueIdentifier, AccountName } =
        req.body as AddNewUserRequest;

      const existingUser = await userRepository.findByEmail(Email);
      if (existingUser) {
        res.json({
          IsError: true,
          ErrorMessage: "User with this email already exists",
        } as AddNewUserResponse);
        return;
      }

      const authToken = uuidv4();
      const user = await userRepository.create({
        authorizationToken: authToken,
        linnworksUniqueIdentifier: LinnworksUniqueIdentifier,
        email: Email,
        accountName: AccountName,
      });

      res.json({
        IsError: false,
        ErrorMessage: null,
        AuthorizationToken: user.authorization_token,
      } as AddNewUserResponse);
    } catch (error: any) {
      console.error("Error in addNewUser:", error);
      res.json({
        IsError: true,
        ErrorMessage: `AddNewUser error: ${error.message}`,
      } as AddNewUserResponse);
    }
  }

  async userConfig(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      // If config is not active (Wizard Stage)
      if (!user.is_config_active) {
        // If new integration, assign ContactStage
        if (user.config_status === "") {
          await userRepository.updateConfigStatus(
            user.user_id,
            "ContactStage",
            false
          );
          user.config_status = "ContactStage";
        }

        // Get the current stage configuration
        const stage = await configurationRepository.getStageByName(
          user.config_status
        );

        if (!stage) {
          res.json({
            IsError: true,
            ErrorMessage: `Config stage is not handled: ${user.config_status}`,
          } as UserConfigResponse);
          return;
        }

        // Get configuration items for this stage
        const configItems = await configurationRepository.getItemsByStageId(
          stage.config_stage_id
        );

        // Get user's saved values for this stage
        const savedValues = await configurationRepository.getUserConfigValues(
          user.user_id,
          stage.config_stage_id
        );

        const savedValuesMap = new Map(
          savedValues.map((v) => [v.config_item_identifier, v.selected_value])
        );

        // Build config items with list values
        const items: ConfigItem[] = await Promise.all(
          configItems.map(async (item) => {
            let listValues: any = [];
            if (item.value_type === 5) {
              // LIST type
              const values =
                await configurationRepository.getListValuesByItemId(
                  item.config_item_id
                );
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
              SelectedValue:
                savedValuesMap.get(item.config_item_identifier) ||
                item.default_value ||
                "",
              RegExValidation: item.regex_validation || null,
              RegExError: item.regex_error || null,
              MustBeSpecified: item.must_be_specified,
              ReadOnly: item.read_only,
              ValueType: item.value_type,
              ListValues: listValues.length > 0 ? listValues : undefined,
            };
          })
        );

        const configStage: ConfigStage = {
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
        } as UserConfigResponse);
      } else {
        // Config is active - return user config stage
        const stage = await configurationRepository.getStageByName("CONFIG");

        if (!stage) {
          res.json({
            IsError: true,
            ErrorMessage: "CONFIG stage not found",
          } as UserConfigResponse);
          return;
        }

        const configItems = await configurationRepository.getItemsByStageId(
          stage.config_stage_id
        );
        const savedValues = await configurationRepository.getUserConfigValues(
          user.user_id,
          stage.config_stage_id
        );

        const savedValuesMap = new Map(
          savedValues.map((v) => [v.config_item_identifier, v.selected_value])
        );

        const items: ConfigItem[] = await Promise.all(
          configItems.map(async (item) => {
            let listValues: any = [];
            if (item.value_type === 5) {
              const values =
                await configurationRepository.getListValuesByItemId(
                  item.config_item_id
                );
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
              SelectedValue:
                savedValuesMap.get(item.config_item_identifier) || "",
              RegExValidation: item.regex_validation || undefined,
              RegExError: item.regex_error || undefined,
              MustBeSpecified: item.must_be_specified,
              ReadOnly: item.read_only,
              ValueType: item.value_type,
              ListValues: listValues.length > 0 ? listValues : undefined,
            };
          })
        );

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
        } as UserConfigResponse);
      }
    } catch (error: any) {
      console.error("Error in userConfig:", error);
      res.json({
        IsError: true,
        ErrorMessage: `UserConfig error: ${error.message}`,
      } as UserConfigResponse);
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { ConfigStatus, ConfigItems } = req.body as UpdateConfigRequest;

      // Verify config status matches
      if (user.config_status !== ConfigStatus) {
        res.json({
          IsError: true,
          ErrorMessage:
            "Current config stage is not what is sent in the Update",
        } as UpdateConfigResponse);
        return;
      }

      // Get current stage
      const stage = await configurationRepository.getStageByName(ConfigStatus);
      if (!stage) {
        res.json({
          IsError: true,
          ErrorMessage: `Config stage not found: ${ConfigStatus}`,
        } as UpdateConfigResponse);
        return;
      }

      // Get all config items for validation
      const stageItems = await configurationRepository.getItemsByStageId(
        stage.config_stage_id
      );
      const itemsMap = new Map(
        stageItems.map((item) => [item.config_item_identifier, item])
      );

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
          } as UpdateConfigResponse);
          return;
        }

        // Regex validation
        if (itemDef.regex_validation && configItem.SelectedValue) {
          const regex = new RegExp(itemDef.regex_validation);
          if (!regex.test(configItem.SelectedValue)) {
            res.json({
              IsError: true,
              ErrorMessage:
                itemDef.regex_error || `${itemDef.name} format is invalid`,
            } as UpdateConfigResponse);
            return;
          }
        }

        // Save value
        await configurationRepository.saveUserConfigValue(
          user.user_id,
          stage.config_stage_id,
          itemDef.config_item_id,
          configItem.ConfigItemId,
          configItem.SelectedValue
        );
      }

      // DYNAMIC STAGE PROGRESSION - Get next stage from database
      const nextStageName =
        await configurationRepository.getNextStageName(ConfigStatus);

      if (!nextStageName) {
        // No next stage defined - error
        res.json({
          IsError: true,
          ErrorMessage: `No next stage configured for ${ConfigStatus}`,
        } as UpdateConfigResponse);
        return;
      }

      // Check if next stage is CONFIG (final stage)
      if (nextStageName === "CONFIG") {
        // Activate configuration
        await userRepository.updateConfigStatus(user.user_id, "CONFIG", true);
        res.json({
          IsError: false,
          ErrorMessage: null,
        } as UpdateConfigResponse);
        return;
      }

      // Check if we're already in CONFIG (user updating active config)
      if (ConfigStatus === "CONFIG") {
        res.json({
          IsError: false,
          ErrorMessage: null,
        } as UpdateConfigResponse);
        return;
      }

      // Move to next stage
      await userRepository.updateConfigStatus(
        user.user_id,
        nextStageName,
        false
      );

      res.json({
        IsError: false,
        ErrorMessage: null,
      } as UpdateConfigResponse);
    } catch (error: any) {
      console.error("Error in updateConfig:", error);
      res.json({
        IsError: true,
        ErrorMessage: `UpdateConfig error: ${error.message}`,
      } as UpdateConfigResponse);
    }
  }

  async configDelete(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      await configurationRepository.deleteUserConfigValues(user.user_id);

      await userRepository.softDelete(user.user_id);

      res.json({
        IsError: false,
        ErrorMessage: null,
      } as ConfigDeleteResponse);
    } catch (error: any) {
      console.error("Error in configDelete:", error);
      res.json({
        IsError: true,
        ErrorMessage: `ConfigDelete error: ${error.message}`,
      } as ConfigDeleteResponse);
    }
  }

  async userAvailableServices(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      const services = await courierServiceRepository.getAllActive();

      const userServiceIds = await courierServiceRepository.getUserAvailableServices(user.user_id);
      const filteredServices = services.filter(s => userServiceIds.includes(s.courier_service_id));

      const serviceDetails: CourierServiceDetail[] = await Promise.all(
        filteredServices.map(async (service) => {

          const configItems =
            await courierServiceRepository.getServiceConfigItems(
              service.courier_service_id
            );

          const configItemDetails = await Promise.all(
            configItems.map(async (item: any) => {
              let listValues: any = [];

              if (item.value_type === 5) {

                const values =
                  await courierServiceRepository.getServiceConfigItemListValues(
                    item.service_config_item_id
                  );
                listValues = values.map((v: any) => ({
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
            })
          );

          const properties =
            await courierServiceRepository.getServiceProperties(
              service.courier_service_id
            );

          const serviceProperties: ServiceProperty[] = properties.map(
            (prop: any) => ({
              PropertyName: prop.property_name,
              PropertyValue: prop.property_value,
            })
          );

          return {
            ServiceName: service.service_name,
            ServiceCode: service.service_code,
            ServiceTag: service.service_tag || "",
            ServiceGroup: service.service_group || "",
            ServiceUniqueId: service.service_unique_id,
            ConfigItems: configItemDetails,
            ServiceProperty: serviceProperties,
          };
        })
      );

      res.json({
        IsError: false,
        ErrorMessage: null,
        Services: serviceDetails,
      } as UserAvailableServicesResponse);
    } catch (error: any) {
      console.error("Error in userAvailableServices:", error);
      res.json({
        IsError: true,
        ErrorMessage: `UserAvailableServices error: ${error.message}`,
      } as UserAvailableServicesResponse);
    }
  }

  async ExtendedPropertyMapping(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        "Items": [
          {
            "PropertyTitle": "Safe Place note",
            "PropertyName": "SafePlace1",
            "PropertyDescription": "Safe place note for delivery",
            "PropertyType": "ORDER"
          },
          {
            "PropertyTitle": "Extended Cover flag",
            "PropertyName": "ExtendedCover",
            "PropertyDescription": "Some description",
            "PropertyType": "ITEM"
          }
        ],
        "IsError": false,
        "ErrorMessage": null
      });
    } catch (error: any) {
      res.json({
        IsError: true,
        ErrorMessage: `ExtendedPropertyMapping failed: ${error.message}`
      })
    }
  }

}

export const setupController = new SetupController();
