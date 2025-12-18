from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class User:
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

@dataclass
class Job:
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    status: str = 'active'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@dataclass
class Document:
    id: int
    job_id: int
    filename: str
    s3_key: str
    s3_url: str
    file_size: int
    content_type: str
    document_type: str  # 'invoice', 'contract', 'photo', etc.
    uploaded_by: int
    created_at: Optional[str] = None
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'filename': self.filename,
            's3_key': self.s3_key,
            's3_url': self.s3_url,
            'file_size': self.file_size,
            'content_type': self.content_type,
            'document_type': self.document_type,
            'uploaded_by': self.uploaded_by,
            'created_at': self.created_at
        }