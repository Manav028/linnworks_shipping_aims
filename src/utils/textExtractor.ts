// src/utils/textExtractor.ts
import { ExtractedLabelInfo } from '../types/bulkLabel.types';

export class TextExtractor {
  /**
   * Extract FedEx tracking number (12 digits)
   */
  extractTrackingNumber(text: string): string | null {
    // Find pattern of 12 digits with any spacing
    const fedexPattern = /(\d{4})\s*(\d{4})\s*(\d{4})/;

    const match = text.match(fedexPattern);

    if (match) {
      return match[1] + match[2] + match[3]; // Returns: 887893003848
    }

    return null;
  }

  /**
   * Extract order reference number
   */
  extractOrderReference(text: string): string | null {
    const refPattern = /REF[\s:\uFF1A-]*([0-9]+)\b/i;
    const match = text.match(refPattern);

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Extract recipient name
   */
  extractRecipientName(text: string): string | null {
    // Normalize spacing (OCR is messy)
    const normalized = text.replace(/\s+/g, ' ').trim();

    // FedEx labels: name appears after "TO" and before address starts
    const namePattern =
      /\bTO\s+([A-Z][A-Z\s]{2,40}?)(?=\s+(FLAT|APT|APARTMENT|\d{1,4}|HOUSE|UNIT|NO\.?|BUILDING)\b)/i;

    const match = normalized.match(namePattern);

    if (!match) return null;

    return match[1].trim();
  }

  /**
   * Calculate confidence score based on extracted data
   */
  calculateConfidence(data: Partial<ExtractedLabelInfo>): number {
    let confidence = 0;

    if (data.trackingNumber) {
      confidence += 50; // Tracking is most important
    }

    if (data.orderReference) {
      confidence += 40; // Order ref is critical
    }

    if (data.recipientName) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Extract all label information from text
   */
  extractLabelInfo(text: string): ExtractedLabelInfo {
    const trackingNumber = this.extractTrackingNumber(text);
    const orderReference = this.extractOrderReference(text);
    const recipientName = this.extractRecipientName(text);

    const info: ExtractedLabelInfo = {
      trackingNumber: trackingNumber || '',
      orderReference: orderReference || '',
      recipientName: recipientName || undefined,
      confidence: 0,
    };

    info.confidence = this.calculateConfidence(info);

    return info;
  }
}

export const textExtractor = new TextExtractor();