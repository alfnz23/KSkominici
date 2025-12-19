import { useState, useEffect } from 'react'
import { createJob, getJobs, getJobById, updateJobStatus } from '../../lib/api/jobs'
import type { Job, CreateJobRequest } from '../types/job'

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getJobs()
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const createNewJob = async (jobData: CreateJobRequest) => {
    try {
      setLoading(true)
      const newJob = await createJob(jobData)
      setJobs(prev => [newJob, ...prev])
      return newJob
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const updatedJob = await updateJobStatus(id, status)
      setJobs(prev => prev.map(job => 
        job.id === id ? updatedJob : job
      ))
      return updatedJob
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job')
      throw err
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return {
    jobs,
    loading,
    error,
    createNewJob,
    updateStatus,
    refetch: fetchJobs
  }
}