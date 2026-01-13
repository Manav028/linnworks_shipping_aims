import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true
  })
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'linnworks-labels-aims';

export class S3Service {
  /**
   * Upload file to S3
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    filename?: string
  ): Promise<string> {
    try {
      const key = `${folder}/${filename || uuidv4()}.pdf`;

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf'
      }));

      console.log(`Uploaded to S3: ${key}`);
      return key;
    } catch (error: any) {
      console.error('🔥 S3 PUT OBJECT FAILED', {
        name: error?.name,
        code: error?.Code,
        message: error?.message,
        metadata: error?.$metadata,
        stack: error?.stack,
      });
      throw error;
    }
  }

  /**
   * Upload bulk PDF (original file)
   */
  async uploadBulkPDF(
    buffer: Buffer,
    userId: string,
    originalFilename: string
  ): Promise<string> {
    const date = new Date();
    const folder = `uploads/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    const filename = `${userId}_${Date.now()}_${originalFilename}`;
    return this.uploadFile(buffer, folder, filename);
  }

  /**
   * Upload split label
   */
  async uploadSplitLabel(
    buffer: Buffer,
    bulkUploadId: string,
    pageNumber: number
  ): Promise<string> {
    const date = new Date();
    const folder = `labels/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${bulkUploadId}`;
    const filename = `page_${String(pageNumber).padStart(3, '0')}`;
    return this.uploadFile(buffer, folder, filename);
  }

  /**
   * Get file from S3
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));

      const stream = response.Body as any;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
      console.log(`Deleted from S3: ${key}`);
    } catch (error: any) {
      console.error(`Failed to delete ${key}:`, error.message);
    }
  }
}

export const s3Service = new S3Service();