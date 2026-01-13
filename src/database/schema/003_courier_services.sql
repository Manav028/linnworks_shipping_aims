CREATE TABLE IF NOT EXISTS courier_services (
    courier_service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_unique_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    service_code VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_tag VARCHAR(100),
    service_group VARCHAR(100), 
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courier_service_config_items (
    service_config_item_id SERIAL PRIMARY KEY,
    courier_service_id UUID NOT NULL REFERENCES courier_services(courier_service_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_name VARCHAR(100),
    sort_order INT DEFAULT 0,
    regex_validation VARCHAR(500),
    regex_error TEXT,
    must_be_specified BOOLEAN DEFAULT FALSE,
    read_only BOOLEAN DEFAULT FALSE,
    value_type INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courier_service_items_list_values (
    service_list_value_id SERIAL PRIMARY KEY,
    service_config_item_id INT NOT NULL REFERENCES courier_service_config_items(service_config_item_id) ON DELETE CASCADE,
    display VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_available_services (
    user_service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    courier_service_id UUID NOT NULL REFERENCES courier_services(courier_service_id),
    is_enabled BOOLEAN DEFAULT TRUE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, courier_service_id)
);

CREATE TABLE IF NOT EXISTS courier_service_properties (
    service_property_id SERIAL PRIMARY KEY,
    courier_service_id UUID NOT NULL REFERENCES courier_services(courier_service_id) ON DELETE CASCADE,
    property_name VARCHAR(255) NOT NULL,
    property_value TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courier_services_code ON courier_services(service_code);
CREATE INDEX IF NOT EXISTS idx_courier_services_group ON courier_services(service_group);
CREATE INDEX IF NOT EXISTS idx_user_services_user ON user_available_services(user_id);