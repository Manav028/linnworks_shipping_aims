"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitLabelPageRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class SplitLabelPageRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('split_label_pages');
    }
    async create(data) {
        const result = await this.executeQuery(`INSERT INTO split_label_pages (
        bulk_upload_id,
        file_path,
        png_file_path,
        page_number,
        tracking_number,
        order_reference,
        split_status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'EXTRACTED')
      RETURNING *`, [
            data.bulkUploadId,
            data.filePath,
            data.pngFilePath || null,
            data.pageNumber,
            data.trackingNumber,
            data.orderReference
        ]);
        return result.rows[0];
    }
    async findByBulkUploadId(bulkUploadId) {
        const result = await this.executeQuery(`SELECT * FROM split_label_pages 
       WHERE bulk_upload_id = $1 
       ORDER BY page_number ASC`, [bulkUploadId]);
        return result.rows;
    }
    async findByTrackingNumber(trackingNumber) {
        const result = await this.executeQuery(`SELECT * FROM split_label_pages 
       WHERE tracking_number = $1`, [trackingNumber]);
        return result.rows[0] || null;
    }
}
exports.SplitLabelPageRepository = SplitLabelPageRepository;
//# sourceMappingURL=SplitLabelPageRepository.js.map