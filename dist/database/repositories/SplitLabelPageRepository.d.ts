import { BaseRepository } from './BaseRepository';
import { SplitLabelPage } from '../../types/database.types';
export declare class SplitLabelPageRepository extends BaseRepository<SplitLabelPage> {
    constructor();
    create(data: {
        bulkUploadId: string;
        filePath: string;
        pngFilePath?: string;
        pageNumber: number;
        trackingNumber: string;
        orderReference: string;
    }): Promise<SplitLabelPage>;
    findByBulkUploadId(bulkUploadId: string): Promise<SplitLabelPage[]>;
    findByTrackingNumber(trackingNumber: string): Promise<SplitLabelPage | null>;
}
//# sourceMappingURL=SplitLabelPageRepository.d.ts.map