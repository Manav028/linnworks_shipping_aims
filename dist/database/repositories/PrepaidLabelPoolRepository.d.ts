import { BaseRepository } from './BaseRepository';
import { PrepaidLabelPool } from '../../types/database.types';
export declare class PrepaidLabelPoolRepository extends BaseRepository<PrepaidLabelPool> {
    constructor();
    create(data: {
        bulkUploadId: string;
        splitPageId: string;
        orderReference: string;
        trackingNumber: string;
        courierServiceId: string;
        userId: string;
    }): Promise<PrepaidLabelPool>;
    findAvailableByOrderRef(orderReference: string, courierServiceId: string, userId: string): Promise<PrepaidLabelPool | null>;
    claimLabel(poolLabelId: string, orderId: number): Promise<PrepaidLabelPool | null>;
    releaseLabel(poolLabelId: string): Promise<boolean>;
    getAvailableLabels(userId: string, courierServiceId?: string): Promise<PrepaidLabelPool[]>;
    getPoolStats(userId: string): Promise<{
        total: number;
        available: number;
        claimed: number;
        expired: number;
    }>;
    expireOldLabels(daysOld?: number): Promise<number>;
    getSplitPage(splitPageId: string): Promise<any>;
}
//# sourceMappingURL=PrepaidLabelPoolRepository.d.ts.map