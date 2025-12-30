import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, time, title, address, notes } = body;

    if (!date || !time || !title || !address) {
      return NextResponse.json({ 
        error: 'Date, time, title, and address are required' 
      }, { status: 400 });
    }

    // Aktualizovat událost (pouze pokud je uživatel vlastník)
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        date,
        time,
        title,
        address,
        notes: notes || null,
      })
      .eq('id', params.id)
      .eq('technician_id', user.id) // Pouze vlastní události
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error('Error in calendar PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Smazat událost (pouze pokud je uživatel vlastník)
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', params.id)
      .eq('technician_id', user.id); // Pouze vlastní události

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in calendar DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
