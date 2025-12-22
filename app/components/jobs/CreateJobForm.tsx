'use client'

import { useState } from 'react'
import { Card } from '../ui/card'

interface CreateJobFormData {
  type: string
  customerId: string
  scheduledAt: string
  notes?: string
}

export function CreateJobForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [formData, setFormData] = useState<CreateJobFormData>({
    type: 'INSTALLATION',
    customerId: '',
    scheduledAt: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          type: 'INSTALLATION',
          customerId: '',
          scheduledAt: '',
          notes: ''
        })
        onJobCreated()
      }
    } catch (error) {
      console.error('Failed to create job:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Create New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="INSTALLATION">Installation</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="REPAIR">Repair</option>
            <option value="INSPECTION">Inspection</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Customer ID</label>
          <input
            type="text"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Scheduled At</label>
          <input
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Job'}
        </button>
      </form>
    </Card>
  )
}