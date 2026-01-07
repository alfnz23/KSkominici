import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Získat profil a company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Najít všechny passporty (jobs s type='passport')
    const { data: passportJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('type', 'passport')
      .order('inspection_date', { ascending: false });

    if (jobsError) {
      console.error('Passports error:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch passports' }, { status: 500 });
    }

    // Pro každý pasport zjistit počet bytů (reports) a zákazníka
    const passports = await Promise.all(
      (passportJobs || []).map(async (job) => {
        // Počet reportů (bytů) v pasportu
        const { count: unitsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        // Načíst zákazníka z customers tabulky (SPRÁVNĚ!)
        let customerName = 'Neznámý zákazník';
        let customerEmail = '';
        
        if (job.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('name, email')
            .eq('id', job.customer_id)
            .single();
          
          if (customer) {
            customerName = customer.name || 'Neznámý zákazník';
            customerEmail = customer.email || '';
          }
        }

        return {
          id: job.id,
          buildingAddress: job.inspection_address,
          customerName,
          customerEmail, // ← PŘIDÁNO pro PassportList seskupování
          inspectionDate: job.inspection_date,
          unitsCount: unitsCount || 0,
          status: job.status,
          createdAt: job.created_at,
        };
      })
    );

    return NextResponse.json({ passports }, { status: 200 });
  } catch (error) {
    console.error('Error fetching passports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
