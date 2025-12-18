import { supabase } from '@/lib/supabase'

export interface GenerateDocumentsRequest {
  report_id: string
  formats?: ('pdf' | 'xlsx')[]
}

export interface GenerateDocumentsResponse {
  success: boolean
  document_ids: string[]
  download_paths: string[]
  generated_formats: string[]
  error?: string
}

export async function generateDocuments(
  request: GenerateDocumentsRequest
): Promise<GenerateDocumentsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('generate_documents', {
      body: request
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error generating documents:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to generate documents')
  }
}

export async function getDocumentsByReport(reportId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getDocumentsByJob(jobId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function downloadDocument(storagePath: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1 hodina

  if (error) {
    throw error
  }

  return data.signedUrl
}

export async function deleteDocument(documentId: string) {
  // Nejdříve získáme storage path
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // Smažeme ze storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.storage_path])

  if (storageError) {
    console.error('Storage deletion error:', storageError)
    // Pokračujeme i při chybě storage
  }

  // Smažeme z databáze
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    throw dbError
  }

  return true
}