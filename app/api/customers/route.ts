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

    // Get customers for this company
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Customers error:', customersError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({ customers: customers || [] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
