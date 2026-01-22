// src/services/s3Service.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';

const region = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;

type FileType = 'pdf' | 'png' | 'jpg' | 'jpeg';

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export class S3Service {
  private client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = bucketName || '';
    
    this.client = new S3Client({
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

  private sanitizeFilename(filename: string): string {
    return path
      .basename(filename)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
  }

  private buildKey(folder: string, filename: string): string {
    const safeFolder = folder.replace(/(\.\.|\/\/)/g, '');
    return `${safeFolder}/${filename}`;
  }

  private getContentType(fileType: FileType): string {
    const contentTypes: Record<FileType, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return contentTypes[fileType] || 'application/octet-stream';
  }

  /* -------------------- Generic Upload -------------------- */

  async uploadFile(
    buffer: Buffer,
    folder: string,
    filename: string,
    fileType: FileType,
    options?: UploadOptions
  ): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer');
    }

    const finalFilename = this.sanitizeFilename(filename);
    const key = this.buildKey(folder, finalFilename);
    const contentType = options?.contentType || this.getContentType(fileType);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ServerSideEncryption: 'AES256',
          Metadata: options?.metadata,
        })
      );

      return key;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file to S3: ${errorMessage}`);
    }
  }

  /* -------------------- PDF Uploads -------------------- */

  async uploadPDF(
    buffer: Buffer,
    folder: string,
    filename?: string
  ): Promise<string> {
    const finalFilename =
      filename && filename.endsWith('.pdf')
        ? this.sanitizeFilename(filename)
        : `${crypto.randomUUID()}.pdf`;

    return this.uploadFile(buffer, folder, finalFilename, 'pdf');
  }

  async uploadBulkPDF(
    buffer: Buffer,
    userId: string,
    originalFilename: string
  ): Promise<string> {
    const date = new Date();
    const folder = `uploads/${date.getFullYear()}/${String(
      date.getMonth() + 1
    ).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

    const filename = `${userId}_${Date.now()}_${this.sanitizeFilename(
      originalFilename
    )}`;

    return this.uploadPDF(buffer, folder, filename);
  }

  async uploadSplitLabel(
    buffer: Buffer,
    bulkUploadId: string,
    pageNumber: number
  ): Promise<string> {
    const date = new Date();
    const folder = `labels/${date.getFullYear()}/${String(
      date.getMonth() + 1
    ).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${bulkUploadId}`;

    const filename = `page_${String(pageNumber).padStart(3, '0')}.pdf`;

    return this.uploadPDF(buffer, folder, filename);
  }

  /* -------------------- PNG Uploads -------------------- */

  async uploadPNG(
    buffer: Buffer,
    folder: string,
    filename?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const finalFilename =
      filename && filename.endsWith('.png')
        ? this.sanitizeFilename(filename)
        : `${crypto.randomUUID()}.png`;

    return this.uploadFile(buffer, folder, finalFilename, 'png', { metadata });
  }

  async uploadLabelPNG(
    buffer: Buffer,
    bulkUploadId: string,
    pageNumber: number,
    metadata?: Record<string, string>
  ): Promise<string> {
    const date = new Date();
    const folder = `labels/${date.getFullYear()}/${String(
      date.getMonth() + 1
    ).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${bulkUploadId}`;

    const filename = `page_${String(pageNumber).padStart(3, '0')}.png`;

    return this.uploadPNG(buffer, folder, filename, metadata);
  }

  /* -------------------- Downloads -------------------- */

  async getFileStream(key: string): Promise<Readable> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      if (!response.Body) {
        throw new Error('S3 returned empty body');
      }

      return response.Body as Readable;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get file from S3: ${errorMessage}`);
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const stream = await this.getFileStream(key);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /* -------------------- Delete -------------------- */

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete file from S3: ${errorMessage}`);
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }
}

export const s3Service = new S3Service();