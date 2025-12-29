import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    // Najdi poslední job pro tohoto zákazníka
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (jobsError || !jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No job found for customer' }, { status: 404 });
    }

    const jobId = jobs[0].id;

    // Najdi report pro tento job
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', jobId)
      .limit(1);

    if (reportsError || !reports || reports.length === 0) {
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }

    return NextResponse.json({ report: reports[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
