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

    // Načti všechny joby s jejich zákazníky a reporty
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        inspection_address,
        inspection_date,
        status,
        type,
        customers!inner (
          id,
          email,
          name,
          phone,
          address
        ),
        reports (
          id,
          data,
          created_at
        )
      `)
      .eq('company_id', profile.company_id)
      .eq('type', 'inspection') // jen kontroly, ne pasporty
      .gte('inspection_date', `${year}-01-01`)
      .lte('inspection_date', `${year}-12-31`)
      .order('inspection_date', { ascending: false });

    if (jobsError) {
      console.error('Jobs fetch error:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Agreguj zákazníky
    const customersMap = new Map();

    jobs?.forEach((job: any) => {
      // customers je pole - vezmeme první prvek
      const customerArray = job.customers;
      if (!customerArray || customerArray.length === 0) return;
      
      const customer = customerArray[0];
      const report = job.reports?.[0];
      const reportData = report?.data || {};
      
      if (!customersMap.has(customer.id)) {
        // Vypočítej příští kontrolu (+1 rok)
        const nextInspectionDate = reportData.nextInspectionDate || 
          new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1))
            .toISOString().split('T')[0];

        // Vypočítej dny do vypršení
        const today = new Date();
        const expirationDate = new Date(nextInspectionDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Urči status
        let status: 'active' | 'expiring_soon' | 'expired' = 'active';
        if (daysUntilExpiration < 0) {
          status = 'expired';
        } else if (daysUntilExpiration <= 14) {
          status = 'expiring_soon';
        }

        customersMap.set(customer.id, {
          id: customer.id,
          name: customer.name || reportData.customerName || 'Neznámý zákazník',
          email: customer.email,
          phone: customer.phone || reportData.customerPhone || '',
          address: customer.address || reportData.permanentAddress || '',
          inspection_address: job.inspection_address,
          last_inspection_date: job.inspection_date,
          next_inspection_date: nextInspectionDate,
          status,
          days_until_expiration: daysUntilExpiration,
        });
      }
    });

    const customers = Array.from(customersMap.values());

    // Seřaď podle statusu
    customers.sort((a, b) => {
      const statusOrder = { expired: 0, expiring_soon: 1, active: 2 };
      return (statusOrder as any)[a.status] - (statusOrder as any)[b.status];
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
