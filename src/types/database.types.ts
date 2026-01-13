import { QueryResultRow } from 'pg';

export interface User extends QueryResultRow {
  user_id: string;
  authorization_token: string;
  linnworks_unique_identifier: string;
  email: string;
  account_name: string | null;
  integrate_datetime: Date;
  is_config_active: boolean;
  config_status: string;
  created_date: Date;
  last_modified_date: Date;
  is_deleted: boolean;
}

export interface CourierService extends QueryResultRow {
  courier_service_id: string;
  service_unique_id: string;
  service_code: string;
  service_name: string;
  service_tag: string | null;
  service_group: string | null;
  created_date: Date;
}

export interface BulkLabelUpload extends QueryResultRow {
  bulk_upload_id: string;
  user_id: string;
  courier_service_id: string;
  original_file_name: string;
  original_file_path: string | null;
  original_file_size: number | null;
  total_pages_in_pdf: number;
  upload_status: string;
  uploaded_date: Date;
  processing_start_date: Date | null;
  processing_end_date: Date | null;
}

export interface SplitLabelPage extends QueryResultRow {
  split_page_id: string;
  bulk_upload_id: string;
  file_path: string | null;
  page_number: number;
  tracking_number: string | null;
  order_reference: string | null;
  split_status: string;
  created_date: Date;
}

export interface PrepaidLabelPool extends QueryResultRow {
  pool_label_id: string;
  bulk_upload_id: string;
  split_page_id: string;
  order_reference: string;
  tracking_number: string;
  label_status: 'AVAILABLE' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  courier_service_id: string;
  user_id: string;
  claimed_date: Date | null;
  claimed_by_order_id: number | null;
  created_date: Date;
  expiry_date: Date | null;
}

export interface Consignment extends QueryResultRow {
  consignment_id: string;
  user_id: string;
  courier_service_id: string;
  pool_label_id: string | null;
  order_reference: string;
  linnworks_order_id: number | null;
  recipient_name: string | null;
  recipient_company_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  town: string | null;
  region: string | null;
  country_code: string | null;
  postalcode: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  lead_tracking_number: string | null;
  consignment_status: string;
  created_date: Date;
  manifest_date: Date | null;
  cancelled_date: Date | null;
  last_modified_date: Date;
}

export interface ConsignmentPackage extends QueryResultRow {
  package_id: string;
  consignment_id: string;
  sequence_number: number;
  tracking_number: string;
  label_width: number;
  label_height: number;
  png_label_s3_path: string | null;
  package_width: number | null;
  package_height: number | null;
  package_depth: number | null;
  package_weight: number | null;
  package_format: string | null;
  created_date: Date;
}

export interface Manifest extends QueryResultRow {
  manifest_id: string;
  user_id: string;
  manifest_reference: string;
  manifest_date: Date;
  total_consignments: number;
  manifest_status: string;
  pdf_s3_path: string | null;
  printed_date: Date | null;
  last_modified_date: Date;
}

export interface ConfigurationStage extends QueryResultRow {
  config_stage_id: number;
  stage_name: string;
  wizard_step_title: string;
  wizard_step_description: string | null;
  sort_order: number;
  is_active: boolean;
  created_date: Date;
}

export interface ConfigurationItem extends QueryResultRow{
  config_item_id: string;
  config_stage_id: number;
  config_item_identifier: string;
  name: string;
  description: string | null;
  group_name: string | null;
  sort_order: number;
  default_value: string | null;
  regex_validation: string | null;
  regex_error: string | null;
  must_be_specified: boolean;
  read_only: boolean;
  value_type: number;
}

export interface UserConfigurationValue extends QueryResultRow  {
  user_config_value_id: string;
  user_id: string;
  config_stage_id: number;
  config_item_id: string;
  config_item_identifier: string;
  selected_value: string | null;
  saved_date: Date;
}

// Enums
export enum LabelStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum UploadStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ConsignmentStatus {
  CREATED = 'CREATED',
  LABEL_ASSIGNED = 'LABEL_ASSIGNED',
  MANIFESTED = 'MANIFESTED',
  CANCELLED = 'CANCELLED'
}

export enum ManifestStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  PRINTED = 'PRINTED'
}

// DTOs (Data Transfer Objects)
export interface CreateUserDTO extends QueryResultRow {
  authorizationToken: string;
  linnworksUniqueIdentifier: string;
  email: string;
  accountName: string;
}

export interface CreateBulkUploadDTO extends QueryResultRow {
  userId: string;
  courierServiceId: string;
  originalFileName: string;
  originalFilePath: string;
  originalFileSize: number;
  totalPagesInPdf: number;
}

export interface CreateConsignmentDTO extends QueryResultRow {
  userId: string;
  courierServiceId: string;
  poolLabelId: string | null;
  orderReference: string;
  linnworksOrderId: number;
  leadTrackingNumber: string;
  recipientDetails: {
    name: string;
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    addressLine3?: string;
    town: string;
    region: string;
    countryCode: string;
    postalcode: string;
    email?: string;
    phone?: string;
  };
}   