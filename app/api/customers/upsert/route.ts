import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

const upsertCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = upsertCustomerSchema.parse(body)
    
    const customer = await db.customer.upsert({
      where: {
        companyId_email: {
          companyId: session.user.companyId,
          email: validatedData.email
        }
      },
      update: {
        name: validatedData.name,
        phone: validatedData.phone,
        address: validatedData.address,
        updatedAt: new Date()
      },
      create: {
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        address: validatedData.address,
        companyId: session.user.companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    
    console.error('Upsert customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}