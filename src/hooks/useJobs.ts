import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { JobService } from '@/services/jobService'
import type { CreateJobRequest } from '@/types/job'

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: JobService.getJobs
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => JobService.getJobById(id),
    enabled: !!id
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobData: CreateJobRequest) => JobService.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      JobService.updateJobStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', data.id] })
    }
  })
}