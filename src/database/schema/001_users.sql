CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authorization_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    linnworks_unique_identifier UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    integrate_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_config_active BOOLEAN DEFAULT FALSE,
    config_status VARCHAR(50) DEFAULT '',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_authorization_token ON users(authorization_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_linnworks_id ON users(linnworks_unique_identifier);
