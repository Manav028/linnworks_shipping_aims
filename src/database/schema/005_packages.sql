CREATE TABLE IF NOT EXISTS consignment_packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consignment_id UUID NOT NULL REFERENCES consignments(consignment_id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    label_width DECIMAL(5,2) DEFAULT 4,
    label_height DECIMAL(5,2) DEFAULT 6,
    png_label_s3_path VARCHAR(500),  -- S3 path instead of base64
    package_width DECIMAL(10,2),
    package_height DECIMAL(10,2),
    package_depth DECIMAL(10,2),
    package_weight DECIMAL(10,3),
    package_format VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(consignment_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS package_documentation (
    document_id SERIAL PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES consignment_packages(package_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255),
    pdf_s3_path VARCHAR(500),  -- S3 path
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES consignment_packages(package_id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    product_code VARCHAR(100),
    quantity INT DEFAULT 1,
    unit_value DECIMAL(18,2),
    total_value DECIMAL(18,2),
    unit_weight DECIMAL(10,3),
    height DECIMAL(10,2),
    width DECIMAL(10,2),
    length DECIMAL(10,2),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_extended_properties (
    property_id SERIAL PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES package_items(item_id) ON DELETE CASCADE,
    property_name VARCHAR(100) NOT NULL,
    property_value TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packages_consignment ON consignment_packages(consignment_id);
CREATE INDEX IF NOT EXISTS idx_packages_tracking ON consignment_packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_package_docs_package ON package_documentation(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_package ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_item_props_item ON item_extended_properties(item_id);