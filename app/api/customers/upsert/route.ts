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
    const { email, name, phone, address, invoiceOnly } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Určit jestli zákazník má být sdílený
    const shared = invoiceOnly === true;
    
    console.log('📦 Customer upsert:', { 
      email, 
      name,
      invoiceOnly,
      shared
    });
    
    // Upsert zákazníka
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          email: email,
          name: name || '',
          phone: phone || '',
          permanent_address: address || '',
          company_id: profile.company_id,
          created_by: user.id,
          shared: shared, // ← Nastavit shared podle invoiceOnly
        },
        { 
          onConflict: 'email,company_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();
    
    if (customerError) {
      console.error('Customer upsert error:', customerError);
      return NextResponse.json(
        { error: 'Failed to save customer', details: customerError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Customer saved:', customer.id);
    
    return NextResponse.json({ 
      success: true, 
      customer_id: customer.id,
      customer: customer
    });
  } catch (error) {
    console.error('Error upserting customer:', error);
    return NextResponse.json(
      { error: 'Failed to upsert customer', details: String(error) },
      { status: 500 }
    );
  }
}
