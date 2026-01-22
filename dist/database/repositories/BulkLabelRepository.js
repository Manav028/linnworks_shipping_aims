"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkLabelRepository = exports.BulkLabelRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class BulkLabelRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super("bulk_label_uploads");
    }
    getIdColumn() {
        return 'bulk_upload_id';
    }
    async findByUser(userId, limit = 50) {
        const result = await this.executeQuery(`SELECT * FROM bulk_label_uploads 
       WHERE user_id = $1 
       ORDER BY uploaded_date DESC 
       LIMIT $2`, [userId, limit]);
        return result.rows;
    }
    async findLatestByUser(userId) {
        const result = await this.executeQuery(`SELECT * FROM bulk_label_uploads 
       WHERE user_id = $1 
       ORDER BY uploaded_date DESC 
       LIMIT 1`, [userId]);
        return result.rows[0] || null;
    }
    async findByStatus(status, limit = 50) {
        const result = await this.executeQuery(`SELECT * FROM bulk_label_uploads 
       WHERE upload_status = $1 
       ORDER BY uploaded_date DESC 
       LIMIT $2`, [status, limit]);
        return result.rows;
    }
    async create(data) {
        const result = await this.executeQuery(`INSERT INTO bulk_label_uploads (
        user_id,
        courier_service_id,
        original_file_name,
        original_file_path,
        original_file_size,
        total_pages_in_pdf,
        upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'UPLOADED')
      RETURNING *`, [
            data.userId,
            data.courierServiceId,
            data.originalFileName,
            data.originalFilePath,
            data.originalFileSize,
            data.totalPagesInPdf,
        ]);
        return result.rows[0];
    }
    async updateStatus(bulkUploadId, status) {
        const result = await this.executeQuery(`UPDATE bulk_label_uploads 
       SET upload_status = $1
       WHERE bulk_upload_id = $2
       RETURNING *`, [status, bulkUploadId]);
        return result.rows[0] || null;
    }
    async setProcessingStart(bulkUploadId) {
        await this.executeQuery(`UPDATE bulk_label_uploads 
       SET processing_start_date = CURRENT_TIMESTAMP,
           upload_status = 'PROCESSING'
       WHERE bulk_upload_id = $1`, [bulkUploadId]);
    }
    async setProcessingEnd(bulkUploadId, status) {
        await this.executeQuery(`UPDATE bulk_label_uploads 
       SET processing_end_date = CURRENT_TIMESTAMP,
           upload_status = $1
       WHERE bulk_upload_id = $2`, [status, bulkUploadId]);
    }
}
exports.BulkLabelRepository = BulkLabelRepository;
exports.bulkLabelRepository = new BulkLabelRepository();
//# sourceMappingURL=BulkLabelRepository.js.map