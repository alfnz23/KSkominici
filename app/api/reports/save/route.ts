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
    const { job_id, report_id, report_kind, data } = body;

    if (!job_id || !report_kind || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Pokud report_id existuje, aktualizujeme, jinak vytvoříme nový
    if (report_id) {
      const { data: updated, error: updateError } = await supabase
        .from('reports')
        .update({ data })
        .eq('id', report_id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (updateError) {
        console.error('Report update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update report' },
          { status: 500 }
        );
      }

      return NextResponse.json({ report: updated }, { status: 200 });
    } else {
      const { data: created, error: createError } = await supabase
        .from('reports')
        .insert({
          company_id: profile.company_id,
          job_id,
          report_kind,
          data,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Report creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create report' },
          { status: 500 }
        );
      }

      return NextResponse.json({ report: created }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in report save:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const jobId = searchParams.get('job_id');
    const reportId = searchParams.get('report_id');

    let query = supabase
      .from('reports')
      .select('*')
      .eq('company_id', profile.company_id);

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (reportId) {
      query = query.eq('id', reportId);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Reports fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
