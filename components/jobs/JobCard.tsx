import React from 'react'
import type { Job } from '../../src/types/job'
import { JobService } from '../../src/services/jobService'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const handleFinalizeReport = async () => {
    try {
      await JobService.finalizeReport(job.id)
      alert('Report finalized successfully!')
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const handleSendPassport = async () => {
    const email = prompt('Enter recipient email:')
    if (email) {
      try {
        await JobService.sendPassportPackage(job.id, email)
        alert('Passport package sent!')
      } catch (error) {
        alert(`Error: ${error}`)
      }
    }
  }

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold">{job.customer?.address || 'No address'}</h3>
      <p className="text-sm text-gray-600">Status: {job.status}</p>
      <p className="text-sm text-gray-600">Type: {job.type}</p>
      <p className="text-sm text-gray-600">Customer: {job.customer?.name || job.customer?.email}</p>
      {job.assigned_technician && (
        <p className="text-sm text-gray-600">Assigned: {job.assigned_technician.full_name}</p>
      )}
      {job.scheduled_at && (
        <p className="text-sm text-gray-600">Scheduled: {new Date(job.scheduled_at).toLocaleDateString()}</p>
      )}
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={handleFinalizeReport}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Finalize Report
        </button>
        <button 
          onClick={handleSendPassport}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Send Passport
        </button>
      </div>
    </div>
  )
}