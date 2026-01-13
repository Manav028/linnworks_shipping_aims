CREATE TABLE IF NOT EXISTS configuration_stages (
    config_stage_id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL UNIQUE,
    wizard_step_title VARCHAR(255) NOT NULL,
    wizard_step_description TEXT,
    sort_order INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    next_stage_name TEXT
);

CREATE TABLE IF NOT EXISTS configuration_items (
    config_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_stage_id INT NOT NULL REFERENCES configuration_stages(config_stage_id) ON DELETE CASCADE,
    config_item_identifier VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_name VARCHAR(100),
    sort_order INT DEFAULT 0,
    default_value TEXT,
    regex_validation VARCHAR(500),
    regex_error TEXT,
    must_be_specified BOOLEAN DEFAULT FALSE,
    read_only BOOLEAN DEFAULT FALSE,
    value_type INT DEFAULT 0, 
    UNIQUE(config_stage_id, config_item_identifier)
);

CREATE TABLE IF NOT EXISTS configuration_item_list_values (
    list_value_id SERIAL PRIMARY KEY,
    config_item_id UUID NOT NULL REFERENCES configuration_items(config_item_id) ON DELETE CASCADE,
    display VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_configuration_values (
    user_config_value_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    config_stage_id INT NOT NULL REFERENCES configuration_stages(config_stage_id),
    config_item_id UUID NOT NULL REFERENCES configuration_items(config_item_id),
    config_item_identifier VARCHAR(100) NOT NULL,
    selected_value TEXT,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, config_item_id)
);

CREATE INDEX IF NOT EXISTS idx_config_items_stage ON configuration_items(config_stage_id);
CREATE INDEX IF NOT EXISTS idx_user_config_values_user ON user_configuration_values(user_id);
CREATE INDEX IF NOT EXISTS idx_user_config_values_stage ON user_configuration_values(config_stage_id);