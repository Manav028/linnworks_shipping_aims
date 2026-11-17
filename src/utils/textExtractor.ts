import { ExtractedLabelInfo } from '../types/bulkLabel.types';

type CourierType = 'fedex' | 'royalmail' | 'unknown';

export class TextExtractor {

  private readonly courierMap: Record<string, CourierType> = {
  '187cac9e-f3ba-4fc6-948a-a534dd45c6a3': 'fedex',
  '5b4960d4-63da-4bc5-8bc0-c410a08cf9cc': 'royalmail',
  '18bf41d0-3940-44c5-a6e2-37a080945134': 'royalmail',
};

private resolveCourier(courierServiceId?: string): CourierType {
  if (!courierServiceId) return 'unknown';
  return this.courierMap[courierServiceId.toLowerCase()] ?? 'unknown';
}

  extractFedExTrackingNumber(text: string): string | null {
    const fedexPattern = /(8\d{3})\s*(\d{4})\s*(\d{4})/;
    const match = text.match(fedexPattern);
    return match ? match[1] + match[2] + match[3] : null;
  }

  extractFedExOrderReference(text: string): string | null {
    const refPattern = /REF[\s:\uFF1A-]*([0-9]+)\b/i;
    const match = text.match(refPattern);
    return match?.[1] ? match[1].trim() : null;
  }


  extractRoyalMailTrackingNumber(text: string): string | null {
  
    const normalised = text.replace(/\s+/g, '');
    const patterns = [
      /([A-Z]{2}\d{8}[A-Z]{2})/i,  
      /([A-Z]{2}\d{9}[A-Z]{2})/i,  
    ];
    for (const pattern of patterns) {
      const match = normalised.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    return null;
  }

  extractRoyalMailOrderReference(text: string): string | null {
    const match = text.match(/Customer\s+Ref:\s*\d+\s*\/\s*(\d+)/i);
    // const match = text.match(/Customer\s+Ref:\s*(\d+)/i);
    return match ? match[1].trim() : null;
  }

  extractRecipientName(text: string): string | null {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const namePattern =
      /\bTO\s+([A-Z][A-Z\s]{2,40}?)(?=\s+(FLAT|APT|APARTMENT|\d{1,4}|HOUSE|UNIT|NO\.?|BUILDING)\b)/i;
    const match = normalized.match(namePattern);
    return match ? match[1].trim() : null;
  }

  calculateConfidence(data: Partial<ExtractedLabelInfo>): number {
    let confidence = 0;
    if (data.trackingNumber) confidence += 50;
    if (data.orderReference)  confidence += 40;
    if (data.recipientName)   confidence += 10;
    return Math.min(confidence, 100);
  }

  extractLabelInfo(text: string, courierServiceId?: string): ExtractedLabelInfo {
    const courier = this.resolveCourier(courierServiceId);

    let trackingNumber: string | null = null;
    let orderReference: string | null = null;

    switch (courier) {
      case 'royalmail':
        trackingNumber = this.extractRoyalMailTrackingNumber(text);
        orderReference = this.extractRoyalMailOrderReference(text);
        break;

      case 'fedex':
      default:
        trackingNumber = this.extractFedExTrackingNumber(text);
        orderReference = this.extractFedExOrderReference(text);
        break;
    }

    const recipientName = this.extractRecipientName(text);

    const info: ExtractedLabelInfo = {
      trackingNumber:  trackingNumber  ?? '',
      orderReference:  orderReference  ?? '',
      recipientName:   recipientName   ?? undefined,
      confidence: 0,
    };

    info.confidence = this.calculateConfidence(info);
    return info;
  }
}

export const textExtractor = new TextExtractor();