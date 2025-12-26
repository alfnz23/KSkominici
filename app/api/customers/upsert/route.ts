import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabase'
import { z } from 'zod'

const upsertCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to get company_id
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = upsertCustomerSchema.parse(body)
    
    // Check if customer exists
    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('email', validatedData.email)
      .single()

    let customer
    if (existingCustomer) {
      // Update existing customer
      const { data, error } = await supabaseServer
        .from('customers')
        .update({
          name: validatedData.name,
          phone: validatedData.phone,
          address: validatedData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
        .select()
        .single()

      if (error) throw error
      customer = data
    } else {
      // Create new customer
      const { data, error } = await supabaseServer
        .from('customers')
        .insert({
          email: validatedData.email,
          name: validatedData.name,
          phone: validatedData.phone,
          address: validatedData.address,
          company_id: profile.company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      customer = data
    }

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    
    console.error('Upsert customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}