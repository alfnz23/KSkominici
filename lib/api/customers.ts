export interface UpsertCustomerData {
  email: string
  name?: string
  phone?: string
  address?: string
}

export interface Customer {
  id: string
  email: string
  name?: string
  phone?: string
  address?: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

export async function upsertCustomer(data: UpsertCustomerData): Promise<Customer> {
  const response = await fetch('/api/customers/upsert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upsert customer')
  }

  return response.json()
}