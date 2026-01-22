export declare class PDFService {
    private readonly workerTimeoutMs;
    private readonly renderScale;
    constructor();
    getPageCount(pdfBuffer: Buffer): Promise<number>;
    splitPDF(pdfBuffer: Buffer): Promise<Buffer[]>;
    extractText(pdfBuffer: Buffer): Promise<string>;
    extractTextFromPage(pdfBuffer: Buffer, pageNumber: number): Promise<string>;
    /**
     * Convert PDF page to PNG with MAXIMUM QUALITY for scannable barcodes
     * Optimized for FedEx shipping labels
     */
    convertPageToPNG(pdfBuffer: Buffer, pageNumber: number, scale?: number): Promise<Buffer>;
    /**
     * Convert entire PDF to PNG images (one per page)
     */
    convertToPNG(pdfBuffer: Buffer, scale?: number): Promise<Buffer[]>;
    validatePDF(pdfBuffer: Buffer): Promise<boolean>;
    getMetadata(pdfBuffer: Buffer): Promise<{
        pageCount: number;
        fileSize: number;
        isValid: boolean;
    }>;
}
export declare const pdfService: PDFService;
//# sourceMappingURL=pdfService.d.ts.map