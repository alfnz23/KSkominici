import { supabase } from '../supabase'

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

export const jobsApi = {
  async getAll(companyId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(name, email)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(name, email, phone, address)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getByStatus(companyId: string, status: Job['status']): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(name, email)
      `)
      .eq('company_id', companyId)
      .eq('status', status)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }
}