export interface Company {
  id: string
  name: string
  ico?: string
  dic?: string
  address?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  company_id: string
  name: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  company_id: string
  customer_id: string
  type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'INSPECTION'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  assigned_to?: string
  scheduled_at: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  company_id: string
  job_id?: string
  report_id?: string
  filename: string
  mime_type: string
  storage_path: string
  type: 'invoice' | 'report' | 'photo' | 'other'
  created_at: string
}

export interface Report {
  id: string
  company_id: string
  job_id: string
  sequence_no: number
  report_kind: string
  status: 'DRAFT' | 'FINAL' | 'SENT'
  data: any
  created_by: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id: string
  full_name: string
  role: 'ADMIN' | 'TECHNICIAN' | 'MANAGER'
  created_at: string
  updated_at: string
}

export interface EmailOutbox {
  id: string
  company_id: string
  job_id?: string
  to_email: string
  cc_email?: string
  subject: string
  payload: any
  status: 'PENDING' | 'SENT' | 'FAILED'
  provider_message_id?: string
  error?: string
  created_at: string
  sent_at?: string
}

export interface Lead {
  id: string
  company_id: string
  name: string
  phone?: string
  email?: string
  message?: string
  created_at: string
}

export interface CreateJobRequest {
  customer: {
    email: string
    name?: string
    phone?: string
    address?: string
  }
  type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'INSPECTION'
  assigned_to?: string
  scheduled_at?: string
  notes?: string
}