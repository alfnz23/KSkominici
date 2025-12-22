'use client'

import { useState } from 'react'
import { apiClient } from '@/app/lib/api/client'

export default function TestPage() {
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testCreateJob = async () => {
    setIsLoading(true)
    setResult('Testing...')
    
    try {
      const response = await apiClient.createJob({
        customer: {
          email: 'test@example.com',
          name: 'Test Customer',
          phone: '+420123456789',
          address: 'Test Address 123'
        },
        type: 'inspection',
        notes: 'Test job from API test page'
      })
      
      setResult(JSON.stringify(response, null, 2))
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testGetJobs = async () => {
    setIsLoading(true)
    setResult('Loading jobs...')
    
    try {
      const jobs = await apiClient.getJobs()
      setResult(JSON.stringify(jobs, null, 2))
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testCreateJob}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded font-medium"
        >
          Test Create Job
        </button>
        
        <button
          onClick={testGetJobs}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded font-medium ml-4"
        >
          Test Get Jobs
        </button>
      </div>
      
      <div className="bg-gray-900 text-gray-100 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap overflow-auto max-h-96">
          {result || 'Click a button to test API connection'}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">⚠️ Don't forget:</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Fill in .env.local with your Supabase credentials</li>
          <li>Make sure Edge Functions are deployed</li>
          <li>Verify database tables exist (run migrations)</li>
          <li>Check RLS policies are configured</li>
        </ul>
      </div>
    </div>
  )
}