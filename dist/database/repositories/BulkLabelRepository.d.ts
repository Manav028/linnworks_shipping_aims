import { BaseRepository } from "./BaseRepository";
import { BulkLabelUpload } from "../../types/database.types";
export declare class BulkLabelRepository extends BaseRepository<BulkLabelUpload> {
    constructor();
    protected getIdColumn(): string;
    findByUser(userId: string, limit?: number): Promise<BulkLabelUpload[]>;
    findLatestByUser(userId: string): Promise<BulkLabelUpload | null>;
    findByStatus(status: string, limit?: number): Promise<BulkLabelUpload[]>;
    create(data: {
        userId: string;
        courierServiceId: string;
        originalFileName: string;
        originalFilePath: string;
        originalFileSize: number;
        totalPagesInPdf: number;
    }): Promise<BulkLabelUpload>;
    updateStatus(bulkUploadId: string, status: string): Promise<BulkLabelUpload | null>;
    setProcessingStart(bulkUploadId: string): Promise<void>;
    setProcessingEnd(bulkUploadId: string, status: "COMPLETED" | "FAILED"): Promise<void>;
}
export declare const bulkLabelRepository: BulkLabelRepository;
//# sourceMappingURL=BulkLabelRepository.d.ts.map