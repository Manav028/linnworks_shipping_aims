import { BaseRepository } from './BaseRepository';
import { SplitLabelPage } from '../../types/database.types';

export class SplitLabelPageRepository extends BaseRepository<SplitLabelPage> {
  constructor() {
    super('split_label_pages');
  }

  async create(data: {
    bulkUploadId: string;
    filePath: string;
    pngFilePath?: string;
    pageNumber: number;
    trackingNumber: string;
    orderReference: string;
  }): Promise<SplitLabelPage> {
    const result = await this.executeQuery<SplitLabelPage>(
      `INSERT INTO split_label_pages (
        bulk_upload_id,
        file_path,
        png_file_path,
        page_number,
        tracking_number,
        order_reference,
        split_status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'EXTRACTED')
      RETURNING *`,
      [
        data.bulkUploadId,
        data.filePath,
        data.pngFilePath || null,
        data.pageNumber,
        data.trackingNumber,
        data.orderReference
      ]
    );
    return result.rows[0];
  }

  async findByBulkUploadId(bulkUploadId: string): Promise<SplitLabelPage[]> {
    const result = await this.executeQuery<SplitLabelPage>(
      `SELECT * FROM split_label_pages 
       WHERE bulk_upload_id = $1 
       ORDER BY page_number ASC`,
      [bulkUploadId]
    );
    return result.rows;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<SplitLabelPage | null> {
    const result = await this.executeQuery<SplitLabelPage>(
      `SELECT * FROM split_label_pages 
       WHERE tracking_number = $1`,
      [trackingNumber]
    );
    return result.rows[0] || null;
  }
}