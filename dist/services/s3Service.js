"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
// src/services/s3Service.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const region = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;
class S3Service {
    constructor() {
        this.bucketName = bucketName || '';
        this.client = new client_s3_1.S3Client({
            region: region,
            credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
                ? {
                    accessKeyId: AWS_ACCESS_KEY_ID,
                    secretAccessKey: AWS_SECRET_ACCESS_KEY,
                }
                : undefined, // Use IAM role if credentials not provided
        });
    }
    /* -------------------- Helpers -------------------- */
    sanitizeFilename(filename) {
        return path_1.default
            .basename(filename)
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .toLowerCase();
    }
    buildKey(folder, filename) {
        const safeFolder = folder.replace(/(\.\.|\/\/)/g, '');
        return `${safeFolder}/${filename}`;
    }
    getContentType(fileType) {
        const contentTypes = {
            pdf: 'application/pdf',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
        };
        return contentTypes[fileType] || 'application/octet-stream';
    }
    /* -------------------- Generic Upload -------------------- */
    async uploadFile(buffer, folder, filename, fileType, options) {
        if (!buffer || buffer.length === 0) {
            throw new Error('Empty file buffer');
        }
        const finalFilename = this.sanitizeFilename(filename);
        const key = this.buildKey(folder, finalFilename);
        const contentType = options?.contentType || this.getContentType(fileType);
        try {
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                ServerSideEncryption: 'AES256',
                Metadata: options?.metadata,
            }));
            return key;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to upload file to S3: ${errorMessage}`);
        }
    }
    /* -------------------- PDF Uploads -------------------- */
    async uploadPDF(buffer, folder, filename) {
        const finalFilename = filename && filename.endsWith('.pdf')
            ? this.sanitizeFilename(filename)
            : `${crypto_1.default.randomUUID()}.pdf`;
        return this.uploadFile(buffer, folder, finalFilename, 'pdf');
    }
    async uploadBulkPDF(buffer, userId, originalFilename) {
        const date = new Date();
        const folder = `uploads/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        const filename = `${userId}_${Date.now()}_${this.sanitizeFilename(originalFilename)}`;
        return this.uploadPDF(buffer, folder, filename);
    }
    async uploadSplitLabel(buffer, bulkUploadId, pageNumber) {
        const date = new Date();
        const folder = `labels/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${bulkUploadId}`;
        const filename = `page_${String(pageNumber).padStart(3, '0')}.pdf`;
        return this.uploadPDF(buffer, folder, filename);
    }
    /* -------------------- PNG Uploads -------------------- */
    async uploadPNG(buffer, folder, filename, metadata) {
        const finalFilename = filename && filename.endsWith('.png')
            ? this.sanitizeFilename(filename)
            : `${crypto_1.default.randomUUID()}.png`;
        return this.uploadFile(buffer, folder, finalFilename, 'png', { metadata });
    }
    async uploadLabelPNG(buffer, bulkUploadId, pageNumber, metadata) {
        const date = new Date();
        const folder = `labels/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${bulkUploadId}`;
        const filename = `page_${String(pageNumber).padStart(3, '0')}.png`;
        return this.uploadPNG(buffer, folder, filename, metadata);
    }
    /* -------------------- Downloads -------------------- */
    async getFileStream(key) {
        try {
            const response = await this.client.send(new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
            if (!response.Body) {
                throw new Error('S3 returned empty body');
            }
            return response.Body;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get file from S3: ${errorMessage}`);
        }
    }
    async getFileBuffer(key) {
        const stream = await this.getFileStream(key);
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    /* -------------------- Delete -------------------- */
    async deleteFile(key) {
        try {
            await this.client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete file from S3: ${errorMessage}`);
        }
    }
    async deleteFiles(keys) {
        await Promise.all(keys.map((key) => this.deleteFile(key)));
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
//# sourceMappingURL=s3Service.js.map