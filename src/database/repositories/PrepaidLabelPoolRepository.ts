import { BaseRepository } from './BaseRepository';
import { PrepaidLabelPool } from '../../types/database.types';

export class PrepaidLabelPoolRepository extends BaseRepository<PrepaidLabelPool> {
  constructor() {
    super('prepaid_label_pool');
  }

  async create(data: {
    bulkUploadId: string;
    splitPageId: string;
    orderReference: string;
    trackingNumber: string;
    courierServiceId: string;
    userId: string;
  }): Promise<PrepaidLabelPool> {
    const result = await this.executeQuery<PrepaidLabelPool>(
      `INSERT INTO prepaid_label_pool (
        bulk_upload_id,
        split_page_id,
        order_reference,
        tracking_number,
        label_status,
        courier_service_id,
        user_id,
        expiry_date
      ) VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6, CURRENT_TIMESTAMP + INTERVAL '90 days')
      RETURNING *`,
      [
        data.bulkUploadId,
        data.splitPageId,
        data.orderReference,
        data.trackingNumber,
        data.courierServiceId,
        data.userId
      ]
    );
    return result.rows[0];
  }

  async findAvailableByOrderRef(
    orderReference: string,
    courierServiceId: string,
    userId: string
  ): Promise<PrepaidLabelPool | null> {
    const result = await this.executeQuery<PrepaidLabelPool>(
      `SELECT * FROM prepaid_label_pool 
       WHERE order_reference = $1 
       AND courier_service_id = $2
       AND user_id = $3
       AND label_status = 'AVAILABLE'
       AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
       LIMIT 1`,
      [orderReference, courierServiceId, userId]
    );
    return result.rows[0] || null;
  }

  async claimLabel(
    poolLabelId: string,
    orderId: number
  ): Promise<PrepaidLabelPool | null> {
    const result = await this.executeQuery<PrepaidLabelPool>(
      `UPDATE prepaid_label_pool 
       SET label_status = 'CLAIMED',
           claimed_date = CURRENT_TIMESTAMP,
           claimed_by_order_id = $1
       WHERE pool_label_id = $2
       AND label_status = 'AVAILABLE'
       RETURNING *`,
      [orderId, poolLabelId]
    );
    return result.rows[0] || null;
  }

  async releaseLabel(poolLabelId: string): Promise<boolean> {
    const result = await this.executeQuery(
      `UPDATE prepaid_label_pool 
       SET label_status = 'AVAILABLE',
           claimed_date = NULL,
           claimed_by_order_id = NULL
       WHERE pool_label_id = $1
       AND label_status = 'CLAIMED'`,
      [poolLabelId]
    );
    return (result.rowCount || 0) > 0;
  }

  async getAvailableLabels(
    userId: string,
    courierServiceId?: string
  ): Promise<PrepaidLabelPool[]> {
    const queryText = courierServiceId
      ? `SELECT * FROM prepaid_label_pool 
         WHERE user_id = $1 
         AND courier_service_id = $2
         AND label_status = 'AVAILABLE'
         AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
         ORDER BY created_date DESC`
      : `SELECT * FROM prepaid_label_pool 
         WHERE user_id = $1 
         AND label_status = 'AVAILABLE'
         AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
         ORDER BY created_date DESC`;

    const params = courierServiceId ? [userId, courierServiceId] : [userId];
    const result = await this.executeQuery<PrepaidLabelPool>(queryText, params);
    return result.rows;
  }

  async getPoolStats(userId: string): Promise<{
    total: number;
    available: number;
    claimed: number;
    expired: number;
  }> {
    const result = await this.executeQuery<any>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN label_status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
         SUM(CASE WHEN label_status = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
         SUM(CASE WHEN label_status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
       FROM prepaid_label_pool
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total) || 0,
      available: parseInt(row.available) || 0,
      claimed: parseInt(row.claimed) || 0,
      expired: parseInt(row.expired) || 0
    };
  }

  async expireOldLabels(daysOld: number = 90): Promise<number> {
    const result = await this.executeQuery(
      `UPDATE prepaid_label_pool 
       SET label_status = 'EXPIRED'
       WHERE label_status = 'AVAILABLE'
       AND expiry_date < CURRENT_TIMESTAMP`,
      []
    );
    return result.rowCount || 0;
  }

  async getSplitPage(splitPageId: string): Promise<any> {
    const result = await this.executeQuery(
      `SELECT * FROM split_label_pages WHERE split_page_id = $1`,
      [splitPageId]
    );
    return result.rows[0] || null;
  }
}