export { BaseRepository } from './BaseRepository';
export { UserRepository } from './UserRepository';
export { BulkLabelRepository } from './BulkLabelRepository';
export { PrepaidLabelPoolRepository } from './PrepaidLabelPoolRepository';
export { ConsignmentRepository } from './ConsignmentRepository';
export { SplitLabelPageRepository } from './SplitLabelPageRepository';
export { ConfigurationRepository } from './ConfigurationRepository';
export { CourierServiceRepository } from './CourierServiceRepository';

import { UserRepository } from './UserRepository';
import { BulkLabelRepository } from './BulkLabelRepository';
import { PrepaidLabelPoolRepository } from './PrepaidLabelPoolRepository';
import { ConsignmentRepository } from './ConsignmentRepository';
import { SplitLabelPageRepository } from './SplitLabelPageRepository';
import { ConfigurationRepository } from './ConfigurationRepository';
import { CourierServiceRepository } from './CourierServiceRepository';

export const userRepository = new UserRepository();
export const bulkLabelRepository = new BulkLabelRepository();
export const prepaidLabelPoolRepository = new PrepaidLabelPoolRepository();
export const consignmentRepository = new ConsignmentRepository();
export const splitLabelPageRepository = new SplitLabelPageRepository();
export const configurationRepository = new ConfigurationRepository();
export const courierServiceRepository = new CourierServiceRepository();