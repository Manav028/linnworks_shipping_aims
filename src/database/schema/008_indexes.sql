CREATE INDEX IF NOT EXISTS idx_pool_lookup 
ON prepaid_label_pool(order_reference, label_status, courier_service_id) 
WHERE label_status = 'AVAILABLE';

-- User's available labels
CREATE INDEX IF NOT EXISTS idx_pool_user_available 
ON prepaid_label_pool(user_id, label_status) 
WHERE label_status = 'AVAILABLE';

-- Consignment tracking lookup
CREATE INDEX IF NOT EXISTS idx_consignments_user_ref 
ON consignments(user_id, order_reference);

-- Active consignments
CREATE INDEX IF NOT EXISTS idx_consignments_active 
ON consignments(user_id, consignment_status) 
WHERE consignment_status IN ('CREATED', 'LABEL_ASSIGNED');