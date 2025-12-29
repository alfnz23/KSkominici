import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Customers error:', customersError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Pro každého zákazníka načti poslední job + report + dokument
    const customersWithJobs = await Promise.all(
      (customers || []).map(async (customer) => {
        // Najdi poslední job pro tohoto zákazníka
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, scheduled_at')
          .eq('customer_id', customer.id)
          .order('inspection_date', { ascending: false })
          .limit(1);

        const lastJob = jobs?.[0];

        if (!lastJob) {
          return {
            ...customer,
            lastInspectionDate: null,
            nextInspectionDate: null,
            inspectionAddress: null,
            pdfUrl: null,
          };
        }

        // Načti report pro tento job
        const { data: reports } = await supabase
          .from('reports')
          .select('id, data')
          .eq('job_id', lastJob.id)
          .limit(1);

        const report = reports?.[0];
        const reportData = report?.data || {};

        // Načti PDF dokument
        const { data: documents } = await supabase
          .from('documents')
          .select('id, storage_path')
          .eq('job_id', lastJob.id)
          .eq('type', 'pdf')
          .limit(1);

        const pdfDoc = documents?.[0];
        let pdfUrl = null;

        if (pdfDoc) {
          // Vytvoř signed URL pro PDF
          const { data: signedUrl } = await supabase.storage
            .from('documents')
            .createSignedUrl(pdfDoc.storage_path, 3600); // 1 hodina platnost

          pdfUrl = signedUrl?.signedUrl || null;
        }

        const today = new Date();
        const nextDate = reportData.nextInspectionDate ? new Date(reportData.nextInspectionDate) : null;
        
        let status: 'active' | 'expiring_soon' | 'expired' = 'active';
        let daysUntilExpiration = 0;
        
        if (nextDate) {
          const diffTime = nextDate.getTime() - today.getTime();
          daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiration < 0) {
            status = 'expired';
          } else if (daysUntilExpiration <= 30) {
            status = 'expiring_soon';
          }
        }

        return {
          ...customer,
          last_inspection_date: reportData.inspectionDate || null,
          next_inspection_date: reportData.nextInspectionDate || null,
          inspection_address: reportData.inspectionAddress || null,
          status,
          days_until_expiration: daysUntilExpiration,
          pdfUrl,
        };
      })
    );

    return NextResponse.json({ customers: customersWithJobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
