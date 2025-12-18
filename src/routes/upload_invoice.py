from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import base64
import uuid
import os
from datetime import datetime
import mimetypes

from ..database import get_db
from ..models import Document
from ..s3_client import upload_file_to_s3
from ..auth import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(filename: str, file_size: int) -> None:
    """Validate file extension and size"""
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File size {file_size} exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
        )

@router.post("/upload_invoice")
async def upload_invoice(
    job_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form(None),
    base64_content: Optional[str] = Form(None),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Upload invoice document to job passport
    
    Two input modes:
    1. Multipart upload: job_id + file
    2. Base64 upload: job_id + filename + base64_content
    """
    
    # Validate job exists
    job_exists = db.execute(
        "SELECT id FROM jobs WHERE id = ?", (job_id,)
    ).fetchone()
    
    if not job_exists:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check user has access to this job
    user_job_access = db.execute(
        "SELECT j.id FROM jobs j WHERE j.id = ? AND j.user_id = ?", 
        (job_id, current_user['id'])
    ).fetchone()
    
    if not user_job_access:
        raise HTTPException(status_code=403, detail="Access denied to this job")
    
    try:
        # Handle multipart upload
        if file:
            if base64_content or filename:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot mix multipart upload with base64 parameters"
                )
            
            file_content = await file.read()
            file_filename = file.filename
            file_size = len(file_content)
            content_type = file.content_type or mimetypes.guess_type(file_filename)[0]
            
        # Handle base64 upload
        elif filename and base64_content:
            if file:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot mix base64 upload with multipart file"
                )
            
            try:
                file_content = base64.b64decode(base64_content)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid base64 content")
            
            file_filename = filename
            file_size = len(file_content)
            content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either file upload or filename+base64_content required"
            )
        
        # Validate file
        validate_file(file_filename, file_size)
        
        # Generate unique filename
        file_ext = os.path.splitext(file_filename)[1].lower()
        unique_filename = f"invoice_{job_id}_{uuid.uuid4().hex}{file_ext}"
        
        # Upload to S3 invoices bucket
        s3_key = f"invoices/{unique_filename}"
        s3_url = upload_file_to_s3(
            file_content, 
            s3_key, 
            content_type=content_type,
            bucket_name="invoices"
        )
        
        # Create document record
        cursor = db.execute(
            """
            INSERT INTO documents (
                job_id, filename, s3_key, s3_url, file_size, 
                content_type, document_type, uploaded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id,
                file_filename,
                s3_key,
                s3_url,
                file_size,
                content_type,
                'invoice',
                current_user['id'],
                datetime.utcnow().isoformat()
            )
        )
        
        document_id = cursor.lastrowid
        db.commit()
        
        # Get created document
        document_record = db.execute(
            """
            SELECT d.*, u.username as uploaded_by_username 
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.id = ?
            """,
            (document_id,)
        ).fetchone()
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "Invoice uploaded successfully",
                "document": {
                    "id": document_record["id"],
                    "job_id": document_record["job_id"],
                    "filename": document_record["filename"],
                    "s3_url": document_record["s3_url"],
                    "file_size": document_record["file_size"],
                    "content_type": document_record["content_type"],
                    "document_type": document_record["document_type"],
                    "uploaded_by": document_record["uploaded_by_username"],
                    "created_at": document_record["created_at"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/jobs/{job_id}/invoices")
async def get_job_invoices(
    job_id: int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all invoice documents for a job"""
    
    # Validate job exists and user has access
    job_record = db.execute(
        "SELECT id FROM jobs WHERE id = ? AND user_id = ?", 
        (job_id, current_user['id'])
    ).fetchone()
    
    if not job_record:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    
    # Get all invoice documents for this job
    invoices = db.execute(
        """
        SELECT d.*, u.username as uploaded_by_username 
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.job_id = ? AND d.document_type = 'invoice'
        ORDER BY d.created_at DESC
        """,
        (job_id,)
    ).fetchall()
    
    invoice_list = []
    for invoice in invoices:
        invoice_list.append({
            "id": invoice["id"],
            "job_id": invoice["job_id"],
            "filename": invoice["filename"],
            "s3_url": invoice["s3_url"],
            "file_size": invoice["file_size"],
            "content_type": invoice["content_type"],
            "document_type": invoice["document_type"],
            "uploaded_by": invoice["uploaded_by_username"],
            "created_at": invoice["created_at"]
        })
    
    return {
        "job_id": job_id,
        "invoices": invoice_list,
        "count": len(invoice_list)
    }