CREATE TABLE rfq_requests (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    sent_at TIMESTAMP,
    deadline TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rfq_status CHECK (status IN ('DRAFT', 'SENT', 'RESPONDED', 'DECLINED'))
);

CREATE INDEX idx_rfq_project_id ON rfq_requests(project_id);
CREATE INDEX idx_rfq_supplier_id ON rfq_requests(supplier_id);
CREATE INDEX idx_rfq_status ON rfq_requests(status);
