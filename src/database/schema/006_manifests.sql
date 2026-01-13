CREATE TABLE IF NOT EXISTS manifests (
    manifest_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    manifest_reference VARCHAR(100) UNIQUE NOT NULL,
    manifest_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_consignments INT DEFAULT 0,
    manifest_status VARCHAR(50) DEFAULT 'CREATED',
    pdf_s3_path VARCHAR(500),  -- S3 path
    printed_date TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manifest_consignments (
    manifest_consignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_id UUID NOT NULL REFERENCES manifests(manifest_id) ON DELETE CASCADE,
    consignment_id UUID NOT NULL REFERENCES consignments(consignment_id),
    order_reference VARCHAR(100),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manifest_id, consignment_id)
);

CREATE INDEX IF NOT EXISTS idx_manifests_user ON manifests(user_id);
CREATE INDEX IF NOT EXISTS idx_manifests_reference ON manifests(manifest_reference);
CREATE INDEX IF NOT EXISTS idx_manifests_date ON manifests(manifest_date);
CREATE INDEX IF NOT EXISTS idx_manifest_consignments_manifest ON manifest_consignments(manifest_id);
CREATE INDEX IF NOT EXISTS idx_manifest_consignments_consignment ON manifest_consignments(consignment_id);