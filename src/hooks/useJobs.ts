import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api/client'
import type { CreateJobRequest } from '@/app/types'

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.getJobs()
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => apiClient.getJobById(id),
    enabled: !!id
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobData: CreateJobRequest) => apiClient.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateJobStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', data.id] })
    }
  })
}