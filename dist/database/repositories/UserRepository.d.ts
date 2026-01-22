import { BaseRepository } from './BaseRepository';
import { User } from '../../types/database.types';
export declare class UserRepository extends BaseRepository<User> {
    constructor();
    findByAuthToken(authToken: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: {
        authorizationToken: string;
        linnworksUniqueIdentifier: string;
        email: string;
        accountName: string;
    }): Promise<User>;
    updateConfigStatus(userId: string, configStatus: string, isConfigActive: boolean): Promise<User | null>;
    softDelete(userId: string): Promise<boolean>;
}
//# sourceMappingURL=UserRepository.d.ts.map