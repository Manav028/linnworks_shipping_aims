"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaultUser = void 0;
const connection_1 = require("../connection");
const uuid_1 = require("uuid");
const seedDefaultUser = async () => {
    console.log('Seeding default user...');
    const linnworksId = (0, uuid_1.v4)();
    try {
        const existing = await (0, connection_1.query)('SELECT user_id FROM users WHERE email = $1', ['admin@linnworks-shipping.com']);
        if (existing.rowCount && existing.rowCount > 0) {
            console.log('Default user already exists, skipping...');
            return;
        }
        await (0, connection_1.query)(`INSERT INTO users (
        linnworks_unique_identifier,
        email,
        account_name,
        is_config_active,
        config_status
      ) VALUES ($1, $2, $3, $4, $5)`, [
            (0, uuid_1.v4)(),
            'admin@linnworks-shipping.com',
            'Default Admin Account',
            false,
            ""
        ]);
        console.log('Default user created');
        console.log('Email:', 'admin@linnworks-shipping.com');
        console.log('Save this token for API testing!\n');
    }
    catch (error) {
        console.error('Error seeding default user:', error.message);
        throw error;
    }
};
exports.seedDefaultUser = seedDefaultUser;
//# sourceMappingURL=001_default_user.js.map