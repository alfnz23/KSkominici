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
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    // Najdi report pro tento konkrétní job
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', jobId)
      .limit(1);

    if (reportsError || !reports || reports.length === 0) {
      return NextResponse.json({ error: 'No report found for this job' }, { status: 404 });
    }

    return NextResponse.json({ report: reports[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching report by job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
