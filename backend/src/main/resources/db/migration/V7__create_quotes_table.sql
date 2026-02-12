CREATE TABLE quotes (
    id BIGSERIAL PRIMARY KEY,
    rfq_request_id BIGINT NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    boq_item_id BIGINT NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    material_description TEXT,
    delivery_days INTEGER,
    notes TEXT,
    valid_until DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_rfq_id ON quotes(rfq_request_id);
CREATE INDEX idx_quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX idx_quotes_boq_item_id ON quotes(boq_item_id);
