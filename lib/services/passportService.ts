import { createClient } from '@/lib/supabase';

export interface PassportPackageRequest {
  jobId: string;
  customerId?: string;
  documents?: string[];
}

export interface PassportPackageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class PassportService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async sendPassportPackage(request: PassportPackageRequest): Promise<PassportPackageResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send_passport_package', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to send passport package');
      }

      return {
        success: true,
        messageId: data?.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getJobDocuments(jobId: string) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('job_id', jobId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, documents: data || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents';
      return { success: false, error: errorMessage, documents: [] };
    }
  }

  async validateJobForPackageSending(jobId: string) {
    try {
      const { data: job, error: jobError } = await this.supabase
        .from('jobs')
        .select('*, customers(*)')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        throw new Error('Job not found');
      }

      if (!job.customers?.email) {
        throw new Error('Customer email is required to send passport package');
      }

      return { valid: true, job };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return { valid: false, error: errorMessage };
    }
  }
}

export const passportService = new PassportService();
export default passportService;