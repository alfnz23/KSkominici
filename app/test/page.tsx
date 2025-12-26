'use client'

import { useState } from 'react'
import { CreateJobForm } from '../components/jobs/CreateJobForm'
import { JobList } from '../components/jobs/JobList'
import { Card } from '../components/ui/card'

const mockJobs = [
  {
    id: '1',
    type: 'INSTALLATION',
    status: 'PENDING',
    scheduledAt: '2024-01-15T10:00:00Z',
    customer: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    notes: 'Standard installation'
  },
  {
    id: '2',
    type: 'INSPECTION',
    status: 'IN_PROGRESS',
    scheduledAt: '2024-01-16T14:30:00Z',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    notes: 'Annual safety inspection'
  },
  {
    id: '3',
    type: 'MAINTENANCE',
    status: 'COMPLETED',
    scheduledAt: '2024-01-14T09:00:00Z',
    customer: {
      name: 'Bob Wilson',
      email: 'bob@example.com'
    }
  },
  {
    id: '4',
    type: 'REPAIR',
    status: 'CANCELLED',
    scheduledAt: '2024-01-17T11:15:00Z',
    customer: {
      name: 'Alice Brown',
      email: 'alice@example.com'
    },
    notes: 'Emergency repair - cancelled by customer'
  }
]

const testData = [
  {
    id: 'test-1',
    customerId: 'customer-1',
    type: 'INSPECTION',
    status: 'pending',
    scheduledAt: '2024-01-20T10:00:00Z',
    notes: 'Test inspection job',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'test-2',
    customerId: 'customer-2',
    type: 'INSTALLATION',
    status: 'completed',
    scheduledAt: '2024-01-18T14:00:00Z',
    notes: 'Test installation completed',
    createdAt: '2024-01-16T09:30:00Z'
  }
]

export default function TestPage() {
  const [activeTab, setActiveTab] = useState('jobs')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleJobCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Test Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Development and testing interface for job management
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Jobs Overview
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Job
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Data
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'jobs' && (
            <div>
              <JobList key={refreshKey} />
              
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Mock Jobs for Testing</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockJobs.map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{job.type}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Customer:</strong> {job.customer.name}</p>
                        <p><strong>Email:</strong> {job.customer.email}</p>
                        <p><strong>Scheduled:</strong> {new Date(job.scheduledAt).toLocaleString()}</p>
                        {job.notes && (
                          <p><strong>Notes:</strong> {job.notes}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <CreateJobForm onJobCreated={handleJobCreated} />
          )}

          {activeTab === 'data' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Test Data Structure</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Sample Job Data</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(testData, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Job Types</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>INSTALLATION - New system installation</li>
                    <li>MAINTENANCE - Regular maintenance check</li>
                    <li>REPAIR - Fix existing issues</li>
                    <li>INSPECTION - Safety and compliance inspection</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Job Statuses</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>PENDING - Job scheduled but not started</li>
                    <li>IN_PROGRESS - Currently being worked on</li>
                    <li>COMPLETED - Job finished successfully</li>
                    <li>CANCELLED - Job cancelled before completion</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}