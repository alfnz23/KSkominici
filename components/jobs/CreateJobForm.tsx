import React, { useState } from 'react'
import { useJobs } from '../../src/hooks/useJobs'
import type { CreateJobRequest } from '../../src/types/job'

export function CreateJobForm() {
  const { createNewJob, loading } = useJobs()
  const [formData, setFormData] = useState<CreateJobRequest>({
    customer: {
      email: '',
      name: '',
      phone: '',
      address: ''
    },
    type: 'inspection',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createNewJob(formData)
      alert('Job created successfully!')
      setFormData({
        customer: {
          email: '',
          name: '',
          phone: '',
          address: ''
        },
        type: 'inspection',
        notes: ''
      })
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const handleCustomerChange = (field: keyof typeof formData.customer, value: string) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Email *</label>
          <input
            type="email"
            value={formData.customer.email}
            onChange={(e) => handleCustomerChange('email', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            value={formData.customer.name}
            onChange={(e) => handleCustomerChange('name', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={formData.customer.phone}
            onChange={(e) => handleCustomerChange('phone', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'inspection' | 'passport' }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="inspection">Inspection</option>
            <option value="passport">Passport</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          value={formData.customer.address}
          onChange={(e) => handleCustomerChange('address', e.target.value)}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes or requirements..."
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creating Job...' : 'Create Job'}
      </button>
    </form>
  )
}