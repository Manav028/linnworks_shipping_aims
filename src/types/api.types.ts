export interface BaseResponse {
  IsError: boolean;
  ErrorMessage: string | null;
}

// ADD NEW USER

export interface AddNewUserRequest {
  Email: string;
  LinnworksUniqueIdentifier: string;
  AccountName: string;
}

export interface AddNewUserResponse extends BaseResponse {
  AuthorizationToken?: string;
}

// USER CONFIG

export interface UserConfigRequest {
  AuthorizationToken: string;
}

export interface ConfigItem {
  ConfigItemId: string;
  Name: string;
  Description: string;
  GroupName: string;
  SortOrder: number;
  SelectedValue: string;
  RegExValidation?: string | null;
  RegExError?: string | null;
  MustBeSpecified: boolean;
  ReadOnly: boolean;
  ValueType: number;
  ListValues?: ConfigItemListValue[];
}

export interface ConfigItemListValue {
  Display: string;
  Value: string;
}

export interface ConfigStage {
  WizardStepDescription: string;
  WizardStepTitle: string;
  ConfigItems: ConfigItem[];
}

export interface UserConfigResponse extends BaseResponse {
  IsConfigActive?: boolean;
  ConfigStatus?: string;
  ConfigStage?: ConfigStage;
}

// UPDATE CONFIG

export interface UpdateConfigItem {
  ConfigItemId: string;
  SelectedValue: string;
}

export interface UpdateConfigRequest {
  AuthorizationToken: string;
  ConfigStatus: string;
  ConfigItems: UpdateConfigItem[];
}

export interface UpdateConfigResponse extends BaseResponse {}

// DELETE CONFIG

export interface ConfigDeleteRequest {
  AuthorizationToken: string;
}

export interface ConfigDeleteResponse extends BaseResponse {}

// USER AVAILABILE SERVICES

export interface UserAvailableServicesRequest {
  AuthorizationToken: string;
}

export interface ServiceProperty {
  PropertyName: string;
  PropertyValue: string;
}

export interface CourierServiceDetail {
  ServiceName: string;
  ServiceCode: string;
  ServiceTag: string;
  ServiceGroup: string;
  ServiceUniqueId: string;
  ConfigItems: ConfigItem[];
  ServiceProperty: ServiceProperty[];
}

export interface UserAvailableServicesResponse extends BaseResponse {
  Services?: CourierServiceDetail[];
}



