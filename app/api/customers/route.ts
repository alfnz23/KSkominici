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

    // 1. Zákazníci z vlastních non-passport jobů
    const { data: ownJobs, error: ownJobsError } = await supabase
      .from('jobs')
      .select('customer_id')
      .eq('assigned_to', user.id)
      .neq('type', 'passport');

    console.log('🔍 Own jobs:', ownJobs?.length || 0, ownJobsError);
    const ownCustomerIds = Array.from(new Set(ownJobs?.map(j => j.customer_id) || []));
    console.log('🔍 Own customer IDs:', ownCustomerIds);

    // 2. Zákazníci z passport jobů firmy
    const { data: passportJobs, error: passportJobsError } = await supabase
      .from('jobs')
      .select('customer_id')
      .eq('company_id', profile.company_id)
      .eq('type', 'passport');

    console.log('🔍 Passport jobs:', passportJobs?.length || 0, passportJobsError);
    const passportCustomerIds = Array.from(new Set(passportJobs?.map(j => j.customer_id) || []));
    console.log('🔍 Passport customer IDs:', passportCustomerIds);

    // 3. Spojit ID zákazníků
    const allowedCustomerIds = Array.from(new Set([...ownCustomerIds, ...passportCustomerIds]));
    console.log('🔍 Total allowed customer IDs:', allowedCustomerIds.length, allowedCustomerIds);

    if (allowedCustomerIds.length === 0) {
      console.log('⚠️ NO CUSTOMER IDS FOUND!');
      return NextResponse.json({ customers: [] }, { status: 200 });
    }

    // 4. Načti zákazníky
    console.log('🔍 Fetching customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .in('id', allowedCustomerIds)
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ Customers error:', customersError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    console.log('✅ Customers fetched:', customers?.length || 0);

    // Pro každého zákazníka načti poslední job + report + dokument
    const customersWithJobs = await Promise.all(
      (customers || []).map(async (customer) => {
        console.log('🔍 Processing customer:', customer.name);

        // 1. Zkus najít inspection job
        const { data: inspectionJobs } = await supabase
          .from('jobs')
          .select('id, type, inspection_date')
          .eq('customer_id', customer.id)
          .eq('type', 'inspection')
          .order('inspection_date', { ascending: false })
          .limit(1);

        let lastJob = inspectionJobs?.[0];
        let isPassportCustomer = false;

        // 2. Pokud nemá inspection job, zkus najít passport job
        if (!lastJob) {
          const { data: passportReports } = await supabase
            .from('reports')
            .select('job_id, data, created_at')
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false });

          const customerReport = passportReports?.find(r => 
            r.data?.customerEmail === customer.email
          );

          if (customerReport) {
            const { data: passportJobs } = await supabase
              .from('jobs')
              .select('id, type, inspection_date')
              .eq('id', customerReport.job_id)
              .eq('type', 'passport')
              .single();

            if (passportJobs) {
              lastJob = passportJobs;
              isPassportCustomer = true;
            }
          }
        }

        if (!lastJob) {
          console.log('⚠️ No job found for customer:', customer.name);
          return {
            ...customer,
            last_inspection_date: null,
            next_inspection_date: null,
            inspection_address: null,
            status: 'active',
            days_until_expiration: 0,
            pdfUrl: null,
            is_passport: false,
          };
        }

        console.log('✅ Found job for customer:', customer.name, 'Job ID:', lastJob.id);

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
          const { data: signedUrl } = await supabase.storage
            .from('documents')
            .createSignedUrl(pdfDoc.storage_path, 3600);

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
          last_inspection_date: reportData.inspectionDate || lastJob.inspection_date || null,
          next_inspection_date: reportData.nextInspectionDate || null,
          inspection_address: reportData.inspectionAddress || null,
          status,
          days_until_expiration: daysUntilExpiration,
          pdfUrl,
          is_passport: isPassportCustomer,
        };
      })
    );

    console.log('✅ Returning customers:', customersWithJobs.length);
    return NextResponse.json({ customers: customersWithJobs }, { status: 200 });
  } catch (error) {
    console.error('❌ CATCH ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
