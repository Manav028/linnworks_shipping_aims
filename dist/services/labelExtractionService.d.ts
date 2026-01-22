import { ExtractedLabelInfo, ProcessedLabel } from '../types/bulkLabel.types';
export declare class LabelExtractionService {
    /**
     * Process a single label: extract text information
     */
    processLabel(pdfBuffer: Buffer, pageNumber?: number): Promise<ExtractedLabelInfo>;
    /**
     * Process label with PNG conversion
     */
    processLabelWithPNG(pdfBuffer: Buffer, pageNumber?: number, scale?: number): Promise<ProcessedLabel>;
    /**
     * Process multiple labels in batch
     */
    processBatch(pdfBuffers: Buffer[]): Promise<ExtractedLabelInfo[]>;
    /**
     * Process batch with PNG conversion
     */
    processBatchWithPNG(pdfBuffers: Buffer[], scale?: number): Promise<ProcessedLabel[]>;
    /**
     * Validate extracted information
     */
    validateExtractedInfo(info: ExtractedLabelInfo): {
        isValid: boolean;
        missingFields: string[];
    };
}
export declare const labelExtractionService: LabelExtractionService;
//# sourceMappingURL=labelExtractionService.d.ts.map