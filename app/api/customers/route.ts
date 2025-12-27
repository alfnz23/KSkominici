import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Načíst všechny zákazníky firmy s jejich posledními kontrolami
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_email,
        inspection_address,
        inspection_date,
        status,
        metadata,
        reports (
          id,
          data,
          created_at
        )
      `)
      .eq('company_id', profile.company_id)
      .gte('inspection_date', `${year}-01-01`)
      .lte('inspection_date', `${year}-12-31`)
      .order('inspection_date', { ascending: false });

    if (jobsError) {
      console.error('Jobs fetch error:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // Agregovat data o zákaznících
    const customersMap = new Map();

    jobs?.forEach((job) => {
      const report = job.reports?.[0];
      const reportData = report?.data || {};
      
      if (!customersMap.has(job.customer_email)) {
        // Vypočítat datum příští kontroly (obvykle +1 rok)
        const nextInspectionDate = reportData.nextInspectionDate || 
          new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1))
            .toISOString().split('T')[0];

        // Vypočítat dny do vypršení
        const today = new Date();
        const expirationDate = new Date(nextInspectionDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Určit status
        let status: 'active' | 'expiring_soon' | 'expired' = 'active';
        if (daysUntilExpiration < 0) {
          status = 'expired';
        } else if (daysUntilExpiration <= 14) {
          status = 'expiring_soon';
        }

        customersMap.set(job.customer_email, {
          id: job.id,
          name: reportData.customerName || 'Neznámý zákazník',
          email: job.customer_email,
          phone: reportData.customerPhone || '',
          address: reportData.permanentAddress || '',
          inspection_address: job.inspection_address,
          last_inspection_date: job.inspection_date,
          next_inspection_date: nextInspectionDate,
          status,
          days_until_expiration: daysUntilExpiration,
        });
      }
    });

    const customers = Array.from(customersMap.values());

    // Seřadit podle statusu (expired > expiring_soon > active)
    customers.sort((a, b) => {
      const statusOrder = { expired: 0, expiring_soon: 1, active: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
