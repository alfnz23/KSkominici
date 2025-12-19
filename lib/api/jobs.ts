import { supabase } from '../supabase'
import type { CreateJobRequest, Job } from '../../src/types/job'

export async function createJob(jobData: CreateJobRequest): Promise<Job> {
  const { data, error } = await supabase.functions.invoke('create_job', {
    body: jobData
  })
  
  if (error) throw error
  return data
}

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function updateJobStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}