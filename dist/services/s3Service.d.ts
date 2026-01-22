import { Readable } from 'stream';
type FileType = 'pdf' | 'png' | 'jpg' | 'jpeg';
interface UploadOptions {
    contentType?: string;
    metadata?: Record<string, string>;
}
export declare class S3Service {
    private client;
    private readonly bucketName;
    constructor();
    private sanitizeFilename;
    private buildKey;
    private getContentType;
    uploadFile(buffer: Buffer, folder: string, filename: string, fileType: FileType, options?: UploadOptions): Promise<string>;
    uploadPDF(buffer: Buffer, folder: string, filename?: string): Promise<string>;
    uploadBulkPDF(buffer: Buffer, userId: string, originalFilename: string): Promise<string>;
    uploadSplitLabel(buffer: Buffer, bulkUploadId: string, pageNumber: number): Promise<string>;
    uploadPNG(buffer: Buffer, folder: string, filename?: string, metadata?: Record<string, string>): Promise<string>;
    uploadLabelPNG(buffer: Buffer, bulkUploadId: string, pageNumber: number, metadata?: Record<string, string>): Promise<string>;
    getFileStream(key: string): Promise<Readable>;
    getFileBuffer(key: string): Promise<Buffer>;
    deleteFile(key: string): Promise<void>;
    deleteFiles(keys: string[]): Promise<void>;
}
export declare const s3Service: S3Service;
export {};
//# sourceMappingURL=s3Service.d.ts.map