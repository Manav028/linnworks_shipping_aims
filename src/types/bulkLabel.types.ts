export interface UploadBulkLabelsRequest {
  AuthorizationToken: string;
  CourierServiceId: string;
  Metadata?: {
    purchaseDate?: string;
    vendor?: string;
    expectedLabels?: number;
    batchReference?: string;
  };
}

export interface ProcessedLabel {
  info: ExtractedLabelInfo;
  pdfBuffer: Buffer;
  pngBuffer: Buffer;
}

export interface UploadBulkLabelsResponse {
  isError: boolean;
  errorMessage?: string;
  bulkUploadId?: string;
  status?: string;
  totalPages?: number;
  estimatedProcessingTime?: number;
  statusCheckUrl?: string;
}

export interface ProcessingStatusRequest {
  bulkUploadId: string;
}

export interface ProcessingStatusResponse {
  isError: boolean;
  errorMessage?: string;
  bulkUploadId?: string;
  status?: string;
  totalLabels?: number;
  processedLabels?: number;
  successfulLabels?: number;
  failedLabels?: number;
  progressPercentage?: number;
  currentPhase?: string;
}

export interface PoolStatusResponse {
  isError: boolean;
  errorMessage?: string;
  totalLabelsInPool?: number;
  availableLabels?: number;
  claimedLabels?: number;
  expiredLabels?: number;
  labels?: {
    poolLabelId: string;
    orderReference: string;
    trackingNumber: string;
    status: string;
    recipientName?: string;
    uploadDate: string;
    expiryDate?: string;
  }[];
}

export interface ExtractedLabelInfo {
  trackingNumber: string;
  orderReference: string;
  recipientName?: string;
  recipientAddress?: string;
  confidence: number;
}