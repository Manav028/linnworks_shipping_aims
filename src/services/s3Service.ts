import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION || 'eu-west-2';

if (!BUCKET_NAME) {
  throw new Error('S3_BUCKET_NAME is required');
}

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: REGION
    });
  }

  /* -------------------- helpers -------------------- */

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

  /* -------------------- uploads -------------------- */

  async uploadPDF(
    buffer: Buffer,
    folder: string,
    filename?: string
  ): Promise<string> {

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer');
    }

    const finalFilename =
      filename && filename.endsWith('.pdf')
        ? this.sanitizeFilename(filename)
        : `${crypto.randomUUID()}.pdf`;

    const key = this.buildKey(folder, finalFilename);

    await this.client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'AES256'
      })
    );

    return key;
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

  /* -------------------- downloads -------------------- */

  async getFileStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );

    if (!response.Body) {
      throw new Error('S3 returned empty body');
    }

    return response.Body as Readable;
  }

  /* -------------------- delete -------------------- */

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
  }
}

export const s3Service = new S3Service();
