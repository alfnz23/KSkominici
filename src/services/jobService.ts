import { supabase } from '@/lib/supabase'
import type { CreateJobRequest, CreateJobResponse, Job } from '../types/job'

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

  // Vytvoření nové zakázky s generováním dokumentů
  static async createJobWithDocuments(jobData: CreateJobRequest): Promise<Job> {
    try {
      // 1. Vytvoř job přes Edge Function
      const response = await this.createJob(jobData)
      const job = response.job
      
      // 2. Automaticky generuj dokumenty
      const { error: docsError } = await supabase.functions.invoke('generate_documents', {
        body: { jobId: job.id }
      })
      
      if (docsError) {
        console.warn('Document generation failed:', docsError)
        // Pokračuj bez chyby - dokumenty lze vygenerovat později
      }
      
      return job
    } catch (error) {
      throw new Error(`Failed to create job with documents: ${error}`)
    }
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

  // Finalizace reportu
  static async finalizeReport(jobId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('finalize_report', {
        body: { jobId }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      await this.updateJobStatus(jobId, 'completed')
    } catch (error) {
      throw new Error(`Failed to finalize report: ${error}`)
    }
  }

  // Odeslání passport package
  static async sendPassportPackage(jobId: string, recipientEmail: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send_passport_package', {
        body: { jobId, recipientEmail }
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(`Failed to send passport package: ${error}`)
    }
  }

  // Odeslání report emailu
  static async sendReportEmail(jobId: string, recipientEmail: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send_report_email', {
        body: { jobId, recipientEmail }
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(`Failed to send report email: ${error}`)
    }
  }

  // Upload faktury
  static async uploadInvoice(jobId: string, invoiceFile: File): Promise<void> {
    try {
      // Pro Edge Functions používáme base64 enkódování souboru
      const fileBuffer = await invoiceFile.arrayBuffer()
      const base64File = btoa(String.fromCharCode(...Array.from(new Uint8Array(fileBuffer))))
      
      const { error } = await supabase.functions.invoke('upload_invoice', {
        body: { 
          jobId, 
          fileName: invoiceFile.name,
          fileType: invoiceFile.type,
          fileData: base64File
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(`Failed to upload invoice: ${error}`)
    }
  }

  // Generování dokumentů pro existující job
  static async generateDocuments(jobId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('generate_documents', {
        body: { jobId }
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(`Failed to generate documents: ${error}`)
    }
  }

  // Uložení reportu
  static async saveReport(jobId: string, reportData: any): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('save_report', {
        body: { jobId, reportData }
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(`Failed to save report: ${error}`)
    }
  }
}