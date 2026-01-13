import { pdfService } from './pdfService';
import { textExtractor } from '../utils/textExtractor';
import { ExtractedLabelInfo } from '../types/bulkLabel.types';

export class LabelExtractionService {

  async processLabel(pdfBuffer: Buffer): Promise<ExtractedLabelInfo> {
    try {
      // Extract text from PDF
      const text = await pdfService.extractText(pdfBuffer);
      
      // Extract label information
      const info = textExtractor.extractLabelInfo(text);
      
      console.log(`Extracted - Tracking: ${info.trackingNumber}, Ref: ${info.orderReference}, Confidence: ${info.confidence}%`);
      
      return info;
    } catch (error: any) {
      console.error('Label extraction failed:', error.message);
      return {
        trackingNumber: '',
        orderReference: '',
        confidence: 0
      };
    }
  }

  
// Process multiple labels in batch
  async processBatch(pdfBuffers: Buffer[]): Promise<ExtractedLabelInfo[]> {
    const results: ExtractedLabelInfo[] = [];
    
    for (let i = 0; i < pdfBuffers.length; i++) {
      console.log(`Processing label ${i + 1}/${pdfBuffers.length}...`);
      const info = await this.processLabel(pdfBuffers[i]);
      results.push(info);
    }
    
    return results;
  }
}

export const labelExtractionService = new LabelExtractionService();