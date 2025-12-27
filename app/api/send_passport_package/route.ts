import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send_passport_package', {
      body: { jobId }
    });

    if (error) {
      console.error('Error calling send_passport_package function:', error);
      return NextResponse.json({ error: 'Failed to send passport package' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in send_passport_package route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
