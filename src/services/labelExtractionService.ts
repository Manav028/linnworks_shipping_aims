// src/services/labelExtractionService.ts
import { pdfService } from './pdfService';
import { textExtractor } from '../utils/textExtractor';
import { ExtractedLabelInfo, ProcessedLabel } from '../types/bulkLabel.types';

export class LabelExtractionService {
  
  async processLabel(
    pdfBuffer: Buffer,
    pageNumber?: number
  ): Promise<ExtractedLabelInfo> {
    try {
  
      const text = await pdfService.extractText(pdfBuffer);
      console.log(text);

      if (!text || text.trim().length === 0) {
        console.warn(`No text extracted from page ${pageNumber || 'unknown'}`);
      }

      const info = textExtractor.extractLabelInfo(text);

      console.log(
        `Extracted - Page: ${pageNumber || 'N/A'}, Tracking: ${
          info.trackingNumber || 'N/A'
        }, Ref: ${info.orderReference || 'N/A'}, Confidence: ${info.confidence}%`
      );

      return info;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Label extraction failed for page ${pageNumber || 'unknown'}:`,
        errorMessage
      );
      return {
        trackingNumber: '',
        orderReference: '',
        confidence: 0,
      };
    }
  }

  async processLabelWithPNG(
    pdfBuffer: Buffer,
    pageNumber?: number,
    scale?: number
  ): Promise<ProcessedLabel> {
    try {

      const info = await this.processLabel(pdfBuffer, pageNumber);

      const pngBuffer = await pdfService.convertPageToPNG(pdfBuffer, 1, scale);

      console.log(
        `Converted page ${pageNumber || 'N/A'} to PNG (${(
          pngBuffer.length / 1024
        ).toFixed(2)} KB)`
      );

      return {
        info,
        pdfBuffer,
        pngBuffer,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Label processing with PNG failed for page ${pageNumber || 'unknown'}:`,
        errorMessage
      );
      throw error;
    }
  }

  /**
   * Process multiple labels in batch
   */
  async processBatch(pdfBuffers: Buffer[]): Promise<ExtractedLabelInfo[]> {
    const results: ExtractedLabelInfo[] = [];

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
  async processBatchWithPNG(
    pdfBuffers: Buffer[],
    scale?: number
  ): Promise<ProcessedLabel[]> {
    const results: ProcessedLabel[] = [];

    for (let i = 0; i < pdfBuffers.length; i++) {
      console.log(
        `Processing label ${i + 1}/${pdfBuffers.length} with PNG conversion...`
      );
      try {
        const processed = await this.processLabelWithPNG(
          pdfBuffers[i],
          i + 1,
          scale
        );
        results.push(processed);
      } catch (error) {
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
  validateExtractedInfo(info: ExtractedLabelInfo): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

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

export const labelExtractionService = new LabelExtractionService();