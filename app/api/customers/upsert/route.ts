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
    
    // Zkontrolovat jestli zákazník existuje
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('company_id', profile.company_id)
      .maybeSingle();
    
    let customer;
    
    if (existingCustomer) {
      // Update existujícího zákazníka
      console.log('📝 Updating existing customer:', existingCustomer.id);
      
      // Pokud je invoiceOnly a zákazník ještě není shared → update
      if (shared && !existingCustomer.shared) {
        const { data: updated, error: updateError } = await supabase
          .from('customers')
          .update({
            name: name || existingCustomer.name,
            phone: phone || existingCustomer.phone,
            address: address || existingCustomer.address,
            shared: true, // Nastavit jako sdílený
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Customer update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update customer', details: updateError.message },
            { status: 500 }
          );
        }
        
        customer = updated;
        console.log('✅ Customer updated to shared');
      } else {
        // Použít existujícího zákazníka
        customer = existingCustomer;
        console.log('✅ Using existing customer');
      }
    } else {
      // Vytvořit nového zákazníka
      console.log('➕ Creating new customer');
      
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          email: email,
          name: name || '',
          phone: phone || '',
          address: address || '',
          company_id: profile.company_id,
          created_by: user.id,
          shared: shared,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Customer insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create customer', details: insertError.message },
          { status: 500 }
        );
      }
      
      customer = newCustomer;
      console.log('✅ Customer created');
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
