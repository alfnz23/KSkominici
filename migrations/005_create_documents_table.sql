-- Migration: Create documents table for file storage tracking
-- Created: 2024-12-28

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL UNIQUE,
    s3_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100),
    document_type VARCHAR(50) NOT NULL, -- 'invoice', 'contract', 'photo', etc.
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for quick job document lookups
CREATE INDEX IF NOT EXISTS idx_documents_job_id ON documents(job_id);

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Index for user document lookups
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Index for S3 key lookups
CREATE INDEX IF NOT EXISTS idx_documents_s3_key ON documents(s3_key);