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
    const { job_id, report_kind, data } = body;
    
    // Kontrola povinných dat
    if (!job_id || !data) {
      return NextResponse.json(
        { error: 'Missing job_id or data' },
        { status: 400 }
      );
    }
    
    console.log('📦 Saving report:', { 
      job_id, 
      report_kind,
      has_data: !!data,
      invoiceOnly: data?.invoiceOnly
    });
    
    // Uložit report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        job_id: job_id,
        report_kind: report_kind || 'chimney_inspection',
        company_id: profile.company_id,
        created_by: user.id,
        data: data, // Obsahuje všechna data včetně invoiceOnly
      })
      .select()
      .single();
    
    if (reportError) {
      console.error('Report save error:', reportError);
      return NextResponse.json(
        { error: 'Failed to save report', details: reportError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Report saved:', report.id);
    
    // Pokud je "Na fakturu" → nastavit zákazníka jako sdíleného
    if (data?.invoiceOnly === true) {
      console.log('📢 Invoice only - updating customer to shared');
      
      // Najít customer_id z jobu
      const { data: job } = await supabase
        .from('jobs')
        .select('customer_id')
        .eq('id', job_id)
        .single();
      
      if (job?.customer_id) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ shared: true })
          .eq('id', job.customer_id);
        
        if (updateError) {
          console.error('Failed to update customer shared:', updateError);
        } else {
          console.log('✅ Customer set as shared');
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      report_id: report.id,
      report: report
    });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report', details: String(error) },
      { status: 500 }
    );
  }
}
