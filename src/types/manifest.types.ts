import { ManifestStatus } from "./api.types";

export interface CreateManifestRequest {
  AuthorizationToken: string;
  OrderId: string[]; 
}

export interface PrintManifestRequest {
  AuthorizationToken: string;
  ManifestReference: string;
}


export interface CreateManifestResponse {
  IsError: boolean;
  ErrorMessage?: string;
  ManifestReference: string;
}

export interface PrintManifestResponse {
  IsError: boolean;
  ErrorMessage?: string;
  PDFbase64?: string;
}


export interface GetManifestsQuery {
  status?: ManifestStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ManifestDetailsResponse {
  manifestId: string;
  manifestReference: string;
  manifestDate: Date;
  totalConsignments: number;
  status: ManifestStatus;
  pdfS3Path: string | null;
  printedDate: Date | null;
  consignments: Array<{
    consignmentId: string;
    orderReference: string;
    trackingNumber: string;
    recipientName: string;
    town: string;
    countryCode: string;
  }>;
}