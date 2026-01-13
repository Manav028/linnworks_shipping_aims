CREATE TABLE IF NOT EXISTS bulk_label_uploads (
    bulk_upload_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    courier_service_id UUID NOT NULL REFERENCES courier_services(courier_service_id),
    original_file_name VARCHAR(255) NOT NULL,
    original_file_path VARCHAR(500),  -- S3 path
    original_file_size BIGINT,
    total_pages_in_pdf INT NOT NULL,
    upload_status VARCHAR(50) DEFAULT 'UPLOADED',
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS split_label_pages (
    split_page_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_upload_id UUID NOT NULL REFERENCES bulk_label_uploads(bulk_upload_id) ON DELETE CASCADE,
    file_path VARCHAR(500),  -- S3 path for individual label
    page_number INT NOT NULL,
    tracking_number VARCHAR(100),
    order_reference VARCHAR(100),
    split_status VARCHAR(50) DEFAULT 'SPLIT',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bulk_upload_id, page_number)
);

CREATE TABLE IF NOT EXISTS prepaid_label_pool (
    pool_label_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_upload_id UUID NOT NULL REFERENCES bulk_label_uploads(bulk_upload_id),
    split_page_id UUID NOT NULL REFERENCES split_label_pages(split_page_id),
    order_reference VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    label_status VARCHAR(20) DEFAULT 'AVAILABLE', 
    courier_service_id UUID NOT NULL REFERENCES courier_services(courier_service_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    claimed_date TIMESTAMP,
    claimed_by_order_id INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP
);

ALTER TABLE consignments
DROP CONSTRAINT IF EXISTS fk_consignment_pool_label;

ALTER TABLE consignments
ADD CONSTRAINT fk_consignment_pool_label
FOREIGN KEY (pool_label_id)
REFERENCES prepaid_label_pool(pool_label_id);

CREATE INDEX IF NOT EXISTS idx_bulk_uploads_user ON bulk_label_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_uploads_service ON bulk_label_uploads(courier_service_id);
CREATE INDEX IF NOT EXISTS idx_bulk_uploads_status ON bulk_label_uploads(upload_status);

CREATE INDEX IF NOT EXISTS idx_split_pages_bulk ON split_label_pages(bulk_upload_id);
CREATE INDEX IF NOT EXISTS idx_split_pages_tracking ON split_label_pages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_split_pages_ref ON split_label_pages(order_reference);

CREATE INDEX IF NOT EXISTS idx_pool_order_ref ON prepaid_label_pool(order_reference);
CREATE INDEX IF NOT EXISTS idx_pool_tracking ON prepaid_label_pool(tracking_number);
CREATE INDEX IF NOT EXISTS idx_pool_status ON prepaid_label_pool(label_status);
CREATE INDEX IF NOT EXISTS idx_pool_status_service ON prepaid_label_pool(label_status, courier_service_id);
CREATE INDEX IF NOT EXISTS idx_pool_user ON prepaid_label_pool(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_claimed_order ON prepaid_label_pool(claimed_by_order_id);