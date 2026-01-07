import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('🔍 User ID:', user.id);
    console.log('🔍 Company ID:', profile.company_id);

    // Načíst JEN single reports (type='inspection') pro současného uživatele
    const { data: ownJobs, error: ownJobsError } = await supabase
      .from('jobs')
      .select('customer_id')
      .eq('assigned_to', user.id)
      .eq('type', 'inspection'); // ← JEN SINGLE REPORTS!

    console.log('🔍 Own inspection jobs:', ownJobs?.length || 0, ownJobsError);
    const ownCustomerIds = Array.from(new Set(ownJobs?.map(j => j.customer_id) || [])).filter(id => id !== null && id !== undefined);
    console.log('🔍 Own customer IDs:', ownCustomerIds);

    if (ownCustomerIds.length === 0) {
      console.log('⚠️ NO CUSTOMER IDS FOUND!');
      return NextResponse.json({ customers: [] }, { status: 200 });
    }

    // Načti zákazníky
    console.log('🔍 Fetching customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .in('id', ownCustomerIds)
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ Customers error:', customersError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    console.log('✅ Customers fetched:', customers?.length || 0);

    // Pro každého zákazníka načti VŠECHNY jeho inspection jobs
    const customersWithJobs = await Promise.all(
      (customers || []).map(async (customer) => {
        console.log('🔍 Processing customer:', customer.name);

        // Načti VŠECHNY inspection jobs pro tohoto zákazníka
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('id, inspection_address, inspection_date, status')
          .eq('customer_id', customer.id)
          .eq('type', 'inspection')
          .order('inspection_date', { ascending: false });

        if (!allJobs || allJobs.length === 0) {
          return null; // Skip zákazníka bez jobs
        }

        // Pro každý job načti report a dokument
        const jobsWithDetails = await Promise.all(
          allJobs.map(async (job) => {
            const { data: reports } = await supabase
              .from('reports')
              .select('id, data')
              .eq('job_id', job.id)
              .limit(1);

            const report = reports?.[0];
            const reportData = report?.data || {};

            // Načti PDF
            const { data: documents } = await supabase
              .from('documents')
              .select('id, storage_path')
              .eq('job_id', job.id)
              .eq('type', 'pdf')
              .limit(1);

            const pdfDoc = documents?.[0];
            let pdfUrl = null;

            if (pdfDoc) {
              const { data: signedUrl } = await supabase.storage
                .from('documents')
                .createSignedUrl(pdfDoc.storage_path, 3600);
              pdfUrl = signedUrl?.signedUrl || null;
            }

            // Vypočítat status expirce
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
              job_id: job.id,
              inspection_address: reportData.inspectionAddress || job.inspection_address,
              last_inspection_date: reportData.inspectionDate || job.inspection_date,
              next_inspection_date: reportData.nextInspectionDate || null,
              status,
              days_until_expiration: daysUntilExpiration,
              pdfUrl,
            };
          })
        );

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          jobs: jobsWithDetails, // Array všech jobs
        };
      })
    );

    // Filtrovat null (zákazníci bez jobs)
    const validCustomers = customersWithJobs.filter(c => c !== null);

    console.log('✅ Returning customers:', validCustomers.length);
    return NextResponse.json({ customers: validCustomers }, { status: 200 });
  } catch (error) {
    console.error('❌ CATCH ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
