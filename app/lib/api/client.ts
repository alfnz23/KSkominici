import { createClient } from '../supabase'
const supabase = createClient()

interface JobData {
  customer: {
    email: string
    name?: string
    phone?: string
    address?: string
  }
  type: 'INSPECTION' | 'MAINTENANCE' | 'REPAIR' | 'INSTALLATION'
  assigned_to?: string
  scheduled_at?: string
  notes?: string
}

interface CustomerData {
  email: string
  name?: string
  phone?: string
  address?: string
  company_id: string
}

class ApiClient {
  /**
   * Create new job with customer upsert
   */
  async createJob(data: JobData) {
    const { data: result, error } = await supabase.functions.invoke('create_job', {
      body: data
    })
    
    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }
    
    return result
  }

  /**
   * Upsert customer (create or update)
   */
  async upsertCustomer(data: CustomerData) {
    const { data: result, error } = await supabase.functions.invoke('upsert_customer', {
      body: data
    })
    
    if (error) {
      throw new Error(`Failed to upsert customer: ${error.message}`)
    }
    
    return result
  }

  /**
   * Get all jobs with relations
   */
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!jobs_assigned_to_fkey(id, full_name, email),
        creator:profiles!jobs_created_by_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }

    return data
  }

  /**
   * Get single job by ID
   */
  async getJobById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!jobs_assigned_to_fkey(id, full_name, email),
        creator:profiles!jobs_created_by_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`)
    }

    return data
  }

  /**
   * Update job status
   */
  async updateJobStatus(id: string, status: string) {
    const updateData: any = { status }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!jobs_assigned_to_fkey(id, full_name, email),
        creator:profiles!jobs_created_by_fkey(id, full_name, email)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`)
    }

    return data
  }
}

export const apiClient = new ApiClient()