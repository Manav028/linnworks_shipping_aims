"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepaidLabelPoolRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PrepaidLabelPoolRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('prepaid_label_pool');
    }
    async create(data) {
        const result = await this.executeQuery(`INSERT INTO prepaid_label_pool (
        bulk_upload_id,
        split_page_id,
        order_reference,
        tracking_number,
        label_status,
        courier_service_id,
        user_id,
        expiry_date
      ) VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6, CURRENT_TIMESTAMP + INTERVAL '90 days')
      RETURNING *`, [
            data.bulkUploadId,
            data.splitPageId,
            data.orderReference,
            data.trackingNumber,
            data.courierServiceId,
            data.userId
        ]);
        return result.rows[0];
    }
    async findAvailableByOrderRef(orderReference, courierServiceId, userId) {
        const result = await this.executeQuery(`SELECT * FROM prepaid_label_pool 
       WHERE order_reference = $1 
       AND courier_service_id = $2
       AND user_id = $3
       AND label_status = 'AVAILABLE'
       AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
       LIMIT 1`, [orderReference, courierServiceId, userId]);
        return result.rows[0] || null;
    }
    async claimLabel(poolLabelId, orderId) {
        const result = await this.executeQuery(`UPDATE prepaid_label_pool 
       SET label_status = 'CLAIMED',
           claimed_date = CURRENT_TIMESTAMP,
           claimed_by_order_id = $1
       WHERE pool_label_id = $2
       AND label_status = 'AVAILABLE'
       RETURNING *`, [orderId, poolLabelId]);
        return result.rows[0] || null;
    }
    async releaseLabel(poolLabelId) {
        const result = await this.executeQuery(`UPDATE prepaid_label_pool 
       SET label_status = 'AVAILABLE',
           claimed_date = NULL,
           claimed_by_order_id = NULL
       WHERE pool_label_id = $1
       AND label_status = 'CLAIMED'`, [poolLabelId]);
        return (result.rowCount || 0) > 0;
    }
    async getAvailableLabels(userId, courierServiceId) {
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
        const result = await this.executeQuery(queryText, params);
        return result.rows;
    }
    async getPoolStats(userId) {
        const result = await this.executeQuery(`SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN label_status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
         SUM(CASE WHEN label_status = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
         SUM(CASE WHEN label_status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
       FROM prepaid_label_pool
       WHERE user_id = $1`, [userId]);
        const row = result.rows[0];
        return {
            total: parseInt(row.total) || 0,
            available: parseInt(row.available) || 0,
            claimed: parseInt(row.claimed) || 0,
            expired: parseInt(row.expired) || 0
        };
    }
    async expireOldLabels(daysOld = 90) {
        const result = await this.executeQuery(`UPDATE prepaid_label_pool 
       SET label_status = 'EXPIRED'
       WHERE label_status = 'AVAILABLE'
       AND expiry_date < CURRENT_TIMESTAMP`, []);
        return result.rowCount || 0;
    }
    async getSplitPage(splitPageId) {
        const result = await this.executeQuery(`SELECT * FROM split_label_pages WHERE split_page_id = $1`, [splitPageId]);
        return result.rows[0] || null;
    }
}
exports.PrepaidLabelPoolRepository = PrepaidLabelPoolRepository;
//# sourceMappingURL=PrepaidLabelPoolRepository.js.map