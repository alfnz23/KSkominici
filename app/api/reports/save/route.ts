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
    const { customerData, reportData } = body;
    
    // Zjistit jestli je "Na fakturu"
    const invoiceOnly = reportData.invoiceOnly === true;
    
    // 1. VYTVOŘIT nebo NAJÍT zákazníka
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerData.email)
      .eq('company_id', profile.company_id)
      .single();
    
    let customerId;
    
    if (existingCustomer) {
      // Zákazník už existuje
      customerId = existingCustomer.id;
      
      // Pokud je "Na fakturu" → update na shared = true
      if (invoiceOnly && !existingCustomer.shared) {
        await supabase
          .from('customers')
          .update({ shared: true })
          .eq('id', customerId);
        
        console.log('✅ Existující zákazník nastaven jako sdílený');
      }
    } else {
      // Vytvořit nového zákazníka
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          permanent_address: customerData.permanentAddress,
          company_id: profile.company_id,
          created_by: user.id,
          shared: invoiceOnly, // ← Pokud "Na fakturu" → shared = true
        })
        .select()
        .single();
      
      customerId = newCustomer.id;
      console.log(`✅ Nový zákazník vytvořen (shared = ${invoiceOnly})`);
    }
    
    // 2. VYTVOŘIT JOB
    const { data: job } = await supabase
      .from('jobs')
      .insert({
        type: 'single',
        customer_id: customerId,
        company_id: profile.company_id,
        created_by: user.id,
        inspection_address: reportData.inspectionAddress,
        inspection_date: reportData.inspectionDate,
        status: 'draft',
      })
      .select()
      .single();
    
    // 3. VYTVOŘIT REPORT
    const { data: report } = await supabase
      .from('reports')
      .insert({
        job_id: job.id,
        company_id: profile.company_id,
        created_by: user.id,
        data: reportData, // Obsahuje invoiceOnly
      })
      .select()
      .single();
    
    return NextResponse.json({ success: true, report_id: report.id });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report', details: String(error) },
      { status: 500 }
    );
  }
}
