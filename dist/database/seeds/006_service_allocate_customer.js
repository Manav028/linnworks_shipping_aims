"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedServiceAllocateCustomer = void 0;
const connection_1 = require("../connection");
const seedServiceAllocateCustomer = async () => {
    console.log("Seeding courier service config items...");
    const fedexResult = await (0, connection_1.query)(`SELECT courier_service_id FROM courier_services WHERE service_code = $1`, ["FEDEX_GROUND"]);
    if (fedexResult.rowCount === 0) {
        console.log("FedEx Ground service not found, skipping...");
        return;
    }
    const fedexServiceId = fedexResult.rows[0].courier_service_id;
    const UserResult = await (0, connection_1.query)(`SELECT user_id FROM users WHERE email = $1`, [
        "admin@linnworks-shipping.com",
    ]);
    if (UserResult.rowCount === 0) {
        console.log("Admin user not found, skipping...");
        return;
    }
    const userId = UserResult.rows[0].user_id;
    try {
        const result = await (0, connection_1.query)(`INSERT INTO user_available_services (courier_service_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (courier_service_id, user_id) DO NOTHING`, [fedexServiceId, userId]);
    }
    catch (error) {
        console.error("Error seeding service config items:", error);
    }
};
exports.seedServiceAllocateCustomer = seedServiceAllocateCustomer;
//# sourceMappingURL=006_service_allocate_customer.js.map