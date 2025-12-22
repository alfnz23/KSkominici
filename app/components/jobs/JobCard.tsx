import { Card } from '../ui/card'

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

export function JobCard({ job }: { job: Job }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{job.type}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
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
  )
}