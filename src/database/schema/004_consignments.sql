CREATE TABLE IF NOT EXISTS consignments (
    consignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    service_unique_id UUID NOT NULL REFERENCES courier_services(service_unique_id),
    pool_label_id UUID,
    order_reference VARCHAR(100) NOT NULL,
    linnworks_order_id INT,
    recipient_name VARCHAR(255),
    recipient_company_name VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    address_line3 VARCHAR(255),
    town VARCHAR(100),
    region VARCHAR(100),
    country_code VARCHAR(5),
    postalcode VARCHAR(20),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    lead_tracking_number VARCHAR(100),
    consignment_status VARCHAR(50) DEFAULT 'CREATED',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    manifest_date TIMESTAMP,
    cancelled_date TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_extended_properties (
    property_id SERIAL PRIMARY KEY,
    consignment_id UUID NOT NULL REFERENCES consignments(consignment_id) ON DELETE CASCADE,
    property_name VARCHAR(100) NOT NULL,
    property_value TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consignments_user ON consignments(user_id);
CREATE INDEX IF NOT EXISTS idx_consignments_service ON consignments(service_unique_id);
CREATE INDEX IF NOT EXISTS idx_consignments_order_ref ON consignments(order_reference);
CREATE INDEX IF NOT EXISTS idx_consignments_linnworks_id ON consignments(linnworks_order_id);
CREATE INDEX IF NOT EXISTS idx_consignments_tracking ON consignments(lead_tracking_number);
CREATE INDEX IF NOT EXISTS idx_consignments_status ON consignments(consignment_status);
CREATE INDEX IF NOT EXISTS idx_order_props_consignment ON order_extended_properties(consignment_id);