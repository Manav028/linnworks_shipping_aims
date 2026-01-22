"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourierServiceRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const connection_1 = require("../connection");
class CourierServiceRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('courier_services');
    }
    getIdColumn() {
        return 'courier_service_id';
    }
    async getAllActive() {
        const result = await this.executeQuery(`SELECT * FROM courier_services 
       ORDER BY service_group ASC, service_name ASC`);
        return result.rows;
    }
    async findByUniqueId(serviceUniqueId) {
        const result = await this.executeQuery(`SELECT * FROM courier_services 
       WHERE service_unique_id = $1`, [serviceUniqueId]);
        return result.rows[0] || null;
    }
    async findByServiceCode(serviceCode) {
        const result = await this.executeQuery(`SELECT * FROM courier_services 
       WHERE service_code = $1`, [serviceCode]);
        return result.rows[0] || null;
    }
    async findByGroup(serviceGroup) {
        const result = await this.executeQuery(`SELECT * FROM courier_services 
       WHERE service_group = $1 
       ORDER BY service_name ASC`, [serviceGroup]);
        return result.rows;
    }
    async getServiceConfigItems(courierServiceId) {
        const result = await (0, connection_1.query)(`SELECT 
        service_config_item_id,
        name,
        description,
        group_name,
        sort_order,
        regex_validation,
        regex_error,
        must_be_specified,
        read_only,
        value_type
       FROM courier_service_config_items 
       WHERE courier_service_id = $1 
       ORDER BY sort_order ASC`, [courierServiceId]);
        return result.rows;
    }
    async getServiceConfigItemListValues(serviceConfigItemId) {
        const result = await (0, connection_1.query)(`SELECT display, value 
       FROM courier_service_items_list_values 
       WHERE service_config_item_id = $1 
       AND is_active = true
       ORDER BY display ASC`, [serviceConfigItemId]);
        return result.rows;
    }
    async getServiceProperties(courierServiceId) {
        const result = await (0, connection_1.query)(`SELECT property_name, property_value 
       FROM courier_service_properties 
       WHERE courier_service_id = $1`, [courierServiceId]);
        return result.rows;
    }
    async getUserAvailableServices(userId) {
        const result = await (0, connection_1.query)(`SELECT courier_service_id 
       FROM user_available_services 
       WHERE user_id = $1 AND is_enabled = true`, [userId]);
        return result.rows.map(row => row.courier_service_id);
    }
    async hasUserAccess(userId, courierServiceId) {
        const result = await (0, connection_1.query)(`SELECT 1 FROM user_available_services 
       WHERE user_id = $1 
       AND courier_service_id = $2 
       AND is_enabled = true`, [userId, courierServiceId]);
        return result.rowCount > 0;
    }
    async assignServiceToUser(userId, courierServiceId) {
        await (0, connection_1.query)(`INSERT INTO user_available_services (user_id, courier_service_id, is_enabled)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, courier_service_id) 
       DO UPDATE SET is_enabled = true, assigned_date = CURRENT_TIMESTAMP`, [userId, courierServiceId]);
    }
    async removeServiceFromUser(userId, courierServiceId) {
        await (0, connection_1.query)(`UPDATE user_available_services 
       SET is_enabled = false 
       WHERE user_id = $1 AND courier_service_id = $2`, [userId, courierServiceId]);
    }
}
exports.CourierServiceRepository = CourierServiceRepository;
//# sourceMappingURL=CourierServiceRepository.js.map