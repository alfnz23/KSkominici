import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateJobRequest {
  customer: {
    email: string
    name?: string
    phone?: string
    address?: string
  }
  type: "inspection" | "passport"
  assigned_to?: string
  scheduled_at?: string
  notes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get company_id from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'Company not found for user' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const requestBody: CreateJobRequest = await req.json()
    const { customer, type, assigned_to, scheduled_at, notes } = requestBody

    // Validate required fields
    if (!customer?.email || !type) {
      return new Response(
        JSON.stringify({ error: 'Email and type are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Upsert customer
    const { data: existingCustomer, error: customerFindError } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', customer.email)
      .eq('company_id', profile.company_id)
      .single()

    let customerId: string

    if (existingCustomer) {
      // Update existing customer
      const { data: updatedCustomer, error: updateError } = await supabaseClient
        .from('customers')
        .update({
          name: customer.name || null,
          phone: customer.phone || null,
          address: customer.address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
        .select('id')
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update customer', details: updateError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      customerId = updatedCustomer.id
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabaseClient
        .from('customers')
        .insert({
          email: customer.email,
          name: customer.name || null,
          phone: customer.phone || null,
          address: customer.address || null,
          company_id: profile.company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create customer', details: createError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      customerId = newCustomer.id
    }

    // Create job
    const jobData = {
      customer_id: customerId,
      type,
      status: 'draft',
      assigned_to: assigned_to || null,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      notes: notes || null,
      company_id: profile.company_id,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert(jobData)
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!jobs_assigned_to_fkey(id, full_name, email),
        creator:profiles!jobs_created_by_fkey(id, full_name, email)
      `)
      .single()

    if (jobError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create job', details: jobError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ job }),
      { 
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})