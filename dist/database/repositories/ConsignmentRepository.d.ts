import { BaseRepository } from './BaseRepository';
import { Consignment } from '../../types/database.types';
export declare class ConsignmentRepository extends BaseRepository<Consignment> {
    constructor();
    create(data: {
        userId: string;
        courierServiceId: string;
        poolLabelId: string | null;
        orderReference: string;
        linnworksOrderId: number;
        leadTrackingNumber: string;
        recipientDetails: {
            name: string;
            companyName?: string;
            addressLine1: string;
            addressLine2?: string;
            addressLine3?: string;
            town: string;
            region: string;
            countryCode: string;
            postalcode: string;
            email?: string;
            phone?: string;
        };
    }): Promise<Consignment>;
    findByOrderReference(orderReference: string, userId: string): Promise<Consignment | null>;
    findByLinnworksOrderId(linnworksOrderId: number, userId: string): Promise<Consignment | null>;
    updateStatus(consignmentId: string, status: string): Promise<Consignment | null>;
    findUnmanifested(userId: string): Promise<Consignment[]>;
    markAsManifested(consignmentId: string, manifestDate: Date): Promise<Consignment | null>;
}
//# sourceMappingURL=ConsignmentRepository.d.ts.map