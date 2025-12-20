'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobList } from './jobs/JobList'
import { CreateJobForm } from './jobs/CreateJobForm'
import { useJobs } from '../src/hooks/useJobs'

export function Dashboard() {
  const { jobs, loading, error, fetchJobs, createNewJob } = useJobs()

  React.useEffect(() => {
    fetchJobs()
  }, [])

  if (loading) return <div>Načítání...</div>
  if (error) return <div>Chyba: {error}</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vytvořit nový job</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateJobForm onSubmit={createNewJob} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seznam jobů</CardTitle>
          </CardHeader>
          <CardContent>
            <JobList jobs={jobs} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}