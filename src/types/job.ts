export interface Job {
  id: string
  customer_id: string
  company_id: string
  type: 'inspection' | 'passport'
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string | null
  created_by: string
  scheduled_at?: string | null
  completed_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  customer?: Customer
  assigned_technician?: Profile
  creator?: Profile
}

export interface CreateJobRequest {
  customer: {
    email: string
    name?: string
    phone?: string
    address?: string
  }
  type: 'inspection' | 'passport'
  assigned_to?: string
  scheduled_at?: string
  notes?: string
}

export interface CreateJobResponse {
  job: Job
}

interface Customer {
  id: string
  email: string
  name?: string
  phone?: string
  address?: string
  company_id: string
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  full_name?: string
  email: string
}