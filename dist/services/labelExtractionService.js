"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labelExtractionService = exports.LabelExtractionService = void 0;
// src/services/labelExtractionService.ts
const pdfService_1 = require("./pdfService");
const textExtractor_1 = require("../utils/textExtractor");
class LabelExtractionService {
    /**
     * Process a single label: extract text information
     */
    async processLabel(pdfBuffer, pageNumber) {
        try {
            // Extract text from PDF using worker
            const text = await pdfService_1.pdfService.extractText(pdfBuffer);
            if (!text || text.trim().length === 0) {
                console.warn(`No text extracted from page ${pageNumber || 'unknown'}`);
            }
            // Extract label information
            const info = textExtractor_1.textExtractor.extractLabelInfo(text);
            console.log(`Extracted - Page: ${pageNumber || 'N/A'}, Tracking: ${info.trackingNumber || 'N/A'}, Ref: ${info.orderReference || 'N/A'}, Confidence: ${info.confidence}%`);
            return info;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Label extraction failed for page ${pageNumber || 'unknown'}:`, errorMessage);
            return {
                trackingNumber: '',
                orderReference: '',
                confidence: 0,
            };
        }
    }
    /**
     * Process label with PNG conversion
     */
    async processLabelWithPNG(pdfBuffer, pageNumber, scale) {
        try {
            // Extract text information
            const info = await this.processLabel(pdfBuffer, pageNumber);
            // Convert to PNG
            const pngBuffer = await pdfService_1.pdfService.convertPageToPNG(pdfBuffer, 1, scale);
            console.log(`Converted page ${pageNumber || 'N/A'} to PNG (${(pngBuffer.length / 1024).toFixed(2)} KB)`);
            return {
                info,
                pdfBuffer,
                pngBuffer,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Label processing with PNG failed for page ${pageNumber || 'unknown'}:`, errorMessage);
            throw error;
        }
    }
    /**
     * Process multiple labels in batch
     */
    async processBatch(pdfBuffers) {
        const results = [];
        for (let i = 0; i < pdfBuffers.length; i++) {
            console.log(`Processing label ${i + 1}/${pdfBuffers.length}...`);
            const info = await this.processLabel(pdfBuffers[i], i + 1);
            results.push(info);
        }
        return results;
    }
    /**
     * Process batch with PNG conversion
     */
    async processBatchWithPNG(pdfBuffers, scale) {
        const results = [];
        for (let i = 0; i < pdfBuffers.length; i++) {
            console.log(`Processing label ${i + 1}/${pdfBuffers.length} with PNG conversion...`);
            try {
                const processed = await this.processLabelWithPNG(pdfBuffers[i], i + 1, scale);
                results.push(processed);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to process label ${i + 1}:`, errorMessage);
                // Continue with next label even if one fails
            }
        }
        return results;
    }
    /**
     * Validate extracted information
     */
    validateExtractedInfo(info) {
        const missingFields = [];
        if (!info.trackingNumber || info.trackingNumber.trim().length === 0) {
            missingFields.push('trackingNumber');
        }
        if (!info.orderReference || info.orderReference.trim().length === 0) {
            missingFields.push('orderReference');
        }
        return {
            isValid: missingFields.length === 0 && info.confidence >= 50,
            missingFields,
        };
    }
}
exports.LabelExtractionService = LabelExtractionService;
exports.labelExtractionService = new LabelExtractionService();
//# sourceMappingURL=labelExtractionService.js.map