import { POST } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

jest.mock('next-auth')
jest.mock('@/lib/db')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockDb = db as jest.Mocked<typeof db>

describe('/api/customers/upsert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create new customer when email does not exist', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { companyId: 'company-1' }
    } as any)

    const mockCustomer = {
      id: 'customer-1',
      email: 'test@example.com',
      name: 'Test User',
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockDb.customer.upsert.mockResolvedValue(mockCustomer)

    const request = new NextRequest('http://localhost/api/customers/upsert', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCustomer)
    expect(mockDb.customer.upsert).toHaveBeenCalledWith({
      where: {
        companyId_email: {
          companyId: 'company-1',
          email: 'test@example.com'
        }
      },
      update: expect.any(Object),
      create: expect.any(Object)
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/customers/upsert', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 when email is invalid', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { companyId: 'company-1' }
    } as any)

    const request = new NextRequest('http://localhost/api/customers/upsert', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})