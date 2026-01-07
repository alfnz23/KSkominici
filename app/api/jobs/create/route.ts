import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      customer_email,
      customer_name,
      job_type,
      inspection_address,
      inspection_date,
    } = body;

    // Najdi nebo vytvoř zákazníka
    let customer_id = null;
    if (customer_email) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('email', customer_email)
        .single();
      
      if (customer) {
        customer_id = customer.id;
      } else {
        // Vytvoř nového zákazníka
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            company_id: profile.company_id,
            email: customer_email,
            name: customer_name || '', // ← PŘIDÁNO!
            created_by: user.id,
          })
          .select('id')
          .single();
        customer_id = newCustomer?.id;
      }
    }

    // Mapování job_type na tvůj enum
    const type = job_type === 'single_report' ? 'inspection' : 'passport';

    // Vytvoř job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        company_id: profile.company_id,
        customer_id,
        type, // tvůj enum: 'inspection' nebo 'passport'
        status: 'draft', // tvůj enum
        inspection_address,
        inspection_date,
        assigned_to: user.id,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error in job creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let query = supabase
      .from('jobs')
      .select('*, customers(*)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query
        .gte('inspection_date', startDate)
        .lte('inspection_date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Jobs fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
