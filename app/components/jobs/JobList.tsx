'use client'

import { useEffect, useState } from 'react'
import { JobCard } from './JobCard'

interface Job {
  id: string
  type: string
  status: string
  scheduledAt: string
  customer: {
    name: string
    email: string
  }
  notes?: string
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading jobs...</div>
  }

  if (jobs.length === 0) {
    return <div className="text-center py-4 text-gray-500">No jobs found</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Jobs</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}