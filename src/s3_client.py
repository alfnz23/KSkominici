import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from typing import Optional

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'eu-central-1')
    )
except NoCredentialsError:
    s3_client = None
    print("Warning: AWS credentials not found. S3 functionality disabled.")

def upload_file_to_s3(
    file_content: bytes, 
    s3_key: str, 
    content_type: str = 'application/octet-stream',
    bucket_name: Optional[str] = None
) -> str:
    """
    Upload file content to S3 bucket
    
    Args:
        file_content: Binary file content
        s3_key: S3 object key (path)
        content_type: MIME type of the file
        bucket_name: S3 bucket name (defaults to env var)
    
    Returns:
        S3 URL of uploaded file
    
    Raises:
        Exception: If upload fails
    """
    if not s3_client:
        raise Exception("S3 client not initialized. Check AWS credentials.")
    
    bucket = bucket_name or os.getenv('AWS_S3_BUCKET')
    if not bucket:
        raise Exception("S3 bucket name not specified")
    
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        # Generate S3 URL
        s3_url = f"https://{bucket}.s3.amazonaws.com/{s3_key}"
        return s3_url
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        raise Exception(f"S3 upload failed [{error_code}]: {error_message}")
    except Exception as e:
        raise Exception(f"S3 upload failed: {str(e)}")

def delete_file_from_s3(s3_key: str, bucket_name: Optional[str] = None) -> bool:
    """
    Delete file from S3 bucket
    
    Args:
        s3_key: S3 object key (path)
        bucket_name: S3 bucket name (defaults to env var)
    
    Returns:
        True if deleted successfully, False otherwise
    """
    if not s3_client:
        print("Warning: S3 client not initialized. Cannot delete file.")
        return False
    
    bucket = bucket_name or os.getenv('AWS_S3_BUCKET')
    if not bucket:
        print("Warning: S3 bucket name not specified. Cannot delete file.")
        return False
    
    try:
        s3_client.delete_object(Bucket=bucket, Key=s3_key)
        return True
    except Exception as e:
        print(f"S3 delete failed: {str(e)}")
        return False

def generate_presigned_url(s3_key: str, expiration: int = 3600, bucket_name: Optional[str] = None) -> Optional[str]:
    """
    Generate presigned URL for S3 object
    
    Args:
        s3_key: S3 object key (path)
        expiration: URL expiration time in seconds (default: 1 hour)
        bucket_name: S3 bucket name (defaults to env var)
    
    Returns:
        Presigned URL string or None if failed
    """
    if not s3_client:
        return None
    
    bucket = bucket_name or os.getenv('AWS_S3_BUCKET')
    if not bucket:
        return None
    
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return response
    except Exception as e:
        print(f"Presigned URL generation failed: {str(e)}")
        return None