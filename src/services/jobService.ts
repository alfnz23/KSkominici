import { supabase } from '@/lib/supabase'
import type { CreateJobRequest, CreateJobResponse } from '@/types/job'

export class JobService {
  static async createJob(jobData: CreateJobRequest): Promise<CreateJobResponse> {
    const { data, error } = await supabase.functions.invoke('create_job', {
      body: jobData
    })

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }

    return data
  }

  static async getJobs() {
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

  static async getJobById(id: string) {
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

  static async updateJobStatus(id: string, status: string) {
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