import { createClient } from '../supabase'
const supabase = createClient()

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

export const documentsApi = {
  async getAll(companyId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByJobId(jobId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async upload(file: File, metadata: Omit<Document, 'id' | 'created_at'>): Promise<Document> {
    // First upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(metadata.storage_path, file)

    if (uploadError) throw uploadError

    // Then create document record
    const { data, error } = await supabase
      .from('documents')
      .insert(metadata)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    // First get the document to get storage path
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path])

    if (storageError) throw storageError

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  }
}