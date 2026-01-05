import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { report_id, data } = body;

    if (!report_id || !data) {
      return NextResponse.json(
        { error: 'report_id and data are required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating report:', report_id);

    // Update report data
    const { error: updateError } = await supabase
      .from('reports')
      .update({ 
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', report_id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Report updated successfully');

    return NextResponse.json(
      { 
        success: true,
        message: 'Report updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
