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

    // UPDATE - RLS automaticky kontroluje že technician_id = auth.uid()
    const { error } = await supabase
      .from('calendar_events')
      .update({
        date,
        time,
        title,
        address,
        notes: notes || null,
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    // Success - RLS už zkontrolovalo oprávnění
    return NextResponse.json({ success: true }, { status: 200 });

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

    // DELETE - RLS automaticky kontroluje že technician_id = auth.uid()
    const { error, count } = await supabase
      .from('calendar_events')
      .delete({ count: 'exact' })
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    // Kontrola že něco bylo smazáno
    if (count === 0) {
      return NextResponse.json({ 
        error: 'Event not found or you do not have permission to delete this event' 
      }, { status: 404 });
    }

    // Success
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error in calendar DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
