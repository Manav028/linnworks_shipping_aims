import { BaseRepository } from "./BaseRepository";
import { BulkLabelUpload } from "../../types/database.types";

export class BulkLabelRepository extends BaseRepository<BulkLabelUpload> {
  constructor() {
    super("bulk_label_uploads");
  }

  protected getIdColumn(): string {
    return 'bulk_upload_id';
  }

  async findByUser(
    userId: string,
    limit: number = 50
  ): Promise<BulkLabelUpload[]> {
    const result = await this.executeQuery<BulkLabelUpload>(
      `SELECT * FROM bulk_label_uploads 
       WHERE user_id = $1 
       ORDER BY uploaded_date DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async findLatestByUser(userId: string): Promise<BulkLabelUpload | null> {
    const result = await this.executeQuery<BulkLabelUpload>(
      `SELECT * FROM bulk_label_uploads 
       WHERE user_id = $1 
       ORDER BY uploaded_date DESC 
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async findByStatus(
    status: string,
    limit: number = 50
  ): Promise<BulkLabelUpload[]> {
    const result = await this.executeQuery<BulkLabelUpload>(
      `SELECT * FROM bulk_label_uploads 
       WHERE upload_status = $1 
       ORDER BY uploaded_date DESC 
       LIMIT $2`,
      [status, limit]
    );
    return result.rows;
  }

  async create(data: {
    userId: string;
    courierServiceId: string;
    originalFileName: string;
    originalFilePath: string;
    originalFileSize: number;
    totalPagesInPdf: number;
  }): Promise<BulkLabelUpload> {
    const result = await this.executeQuery<BulkLabelUpload>(
      `INSERT INTO bulk_label_uploads (
        user_id,
        courier_service_id,
        original_file_name,
        original_file_path,
        original_file_size,
        total_pages_in_pdf,
        upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'UPLOADED')
      RETURNING *`,
      [
        data.userId,
        data.courierServiceId,
        data.originalFileName,
        data.originalFilePath,
        data.originalFileSize,
        data.totalPagesInPdf,
      ]
    );
    return result.rows[0];
  }

  async updateStatus(
    bulkUploadId: string,
    status: string
  ): Promise<BulkLabelUpload | null> {
    const result = await this.executeQuery<BulkLabelUpload>(
      `UPDATE bulk_label_uploads 
       SET upload_status = $1
       WHERE bulk_upload_id = $2
       RETURNING *`,
      [status, bulkUploadId]
    );
    return result.rows[0] || null;
  }

  async setProcessingStart(bulkUploadId: string): Promise<void> {
    await this.executeQuery(
      `UPDATE bulk_label_uploads 
       SET processing_start_date = CURRENT_TIMESTAMP,
           upload_status = 'PROCESSING'
       WHERE bulk_upload_id = $1`,
      [bulkUploadId]
    );
  }

  async setProcessingEnd(
    bulkUploadId: string,
    status: "COMPLETED" | "FAILED"
  ): Promise<void> {
    await this.executeQuery(
      `UPDATE bulk_label_uploads 
       SET processing_end_date = CURRENT_TIMESTAMP,
           upload_status = $1
       WHERE bulk_upload_id = $2`,
      [status, bulkUploadId]
    );
  }
}

export const bulkLabelRepository = new BulkLabelRepository();