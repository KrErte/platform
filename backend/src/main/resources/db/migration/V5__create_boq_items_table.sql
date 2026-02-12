CREATE TABLE boq_items (
    id BIGSERIAL PRIMARY KEY,
    boq_id BIGINT NOT NULL REFERENCES bill_of_quantities(id) ON DELETE CASCADE,
    item_number VARCHAR(50),
    description TEXT NOT NULL,
    material_type VARCHAR(100),
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    specification TEXT,
    notes TEXT
);

CREATE INDEX idx_boq_items_boq_id ON boq_items(boq_id);
