import { BaseRepository } from './BaseRepository';
import { CourierService } from '../../types/database.types';
export declare class CourierServiceRepository extends BaseRepository<CourierService> {
    constructor();
    protected getIdColumn(): string;
    getAllActive(): Promise<CourierService[]>;
    findByUniqueId(serviceUniqueId: string): Promise<CourierService | null>;
    findByServiceCode(serviceCode: string): Promise<CourierService | null>;
    findByGroup(serviceGroup: string): Promise<CourierService[]>;
    getServiceConfigItems(courierServiceId: string): Promise<any[]>;
    getServiceConfigItemListValues(serviceConfigItemId: number): Promise<any[]>;
    getServiceProperties(courierServiceId: string): Promise<any[]>;
    getUserAvailableServices(userId: string): Promise<string[]>;
    hasUserAccess(userId: string, courierServiceId: string): Promise<boolean>;
    assignServiceToUser(userId: string, courierServiceId: string): Promise<void>;
    removeServiceFromUser(userId: string, courierServiceId: string): Promise<void>;
}
//# sourceMappingURL=CourierServiceRepository.d.ts.map