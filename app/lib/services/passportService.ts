import { supabase } from '../supabase'

export interface PassportPackage {
  customerId: string
  documents: {
    type: string
    filename: string
    data: string // base64 encoded
  }[]
  email: string
  subject: string
}

export const passportService = {
  async sendPackage(packageData: PassportPackage): Promise<void> {
    const { data, error } = await supabase.functions.invoke('send_passport_package', {
      body: packageData
    })

    if (error) throw error
    return data
  },

  async generateDocuments(jobId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('generate_documents', {
      body: { jobId }
    })

    if (error) throw error
    return data
  },

  async uploadInvoice(jobId: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobId', jobId)

    const { data, error } = await supabase.functions.invoke('upload_invoice', {
      body: formData
    })

    if (error) throw error
    return data
  }
}