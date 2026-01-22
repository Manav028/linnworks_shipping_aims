import { ExtractedLabelInfo } from '../types/bulkLabel.types';
export declare class TextExtractor {
    /**
     * Extract FedEx tracking number (12 digits)
     */
    extractTrackingNumber(text: string): string | null;
    /**
     * Extract order reference number
     */
    extractOrderReference(text: string): string | null;
    /**
     * Extract recipient name
     */
    extractRecipientName(text: string): string | null;
    /**
     * Calculate confidence score based on extracted data
     */
    calculateConfidence(data: Partial<ExtractedLabelInfo>): number;
    /**
     * Extract all label information from text
     */
    extractLabelInfo(text: string): ExtractedLabelInfo;
}
export declare const textExtractor: TextExtractor;
//# sourceMappingURL=textExtractor.d.ts.map