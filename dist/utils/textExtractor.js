"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textExtractor = exports.TextExtractor = void 0;
class TextExtractor {
    /**
     * Extract FedEx tracking number (12 digits)
     */
    extractTrackingNumber(text) {
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
    extractOrderReference(text) {
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
    extractRecipientName(text) {
        const namePattern = /^TO\s+(.+)$/im;
        const match = text.match(namePattern);
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    }
    /**
     * Calculate confidence score based on extracted data
     */
    calculateConfidence(data) {
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
    extractLabelInfo(text) {
        const trackingNumber = this.extractTrackingNumber(text);
        const orderReference = this.extractOrderReference(text);
        const recipientName = this.extractRecipientName(text);
        const info = {
            trackingNumber: trackingNumber || '',
            orderReference: orderReference || '',
            recipientName: recipientName || undefined,
            confidence: 0,
        };
        info.confidence = this.calculateConfidence(info);
        return info;
    }
}
exports.TextExtractor = TextExtractor;
exports.textExtractor = new TextExtractor();
//# sourceMappingURL=textExtractor.js.map