import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job_id, inspection_address, inspection_date } = body;
    
    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }
    
    console.log('🔄 Updating job:', job_id);
    
    // Update job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .update({
        inspection_address,
        inspection_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id)
      .select()
      .single();
    
    if (jobError) {
      console.error('Job update error:', jobError);
      return NextResponse.json(
        { error: 'Failed to update job', details: jobError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Job updated:', job.id);
    
    return NextResponse.json({ 
      success: true, 
      job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job', details: String(error) },
      { status: 500 }
    );
  }
}
