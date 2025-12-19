import React from 'react'
import { JobList } from './jobs/JobList'
import { CreateJobForm } from './jobs/CreateJobForm'

export function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Job Management Dashboard</h1>
      
      <div className="grid gap-8">
        {/* Create New Job Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Job</h2>
          <CreateJobForm />
        </div>
        
        {/* Jobs List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <JobList />
        </div>
      </div>
    </div>
  )
}