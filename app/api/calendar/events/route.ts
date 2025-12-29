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
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month required' }, { status: 400 });
    }

    // Načíst události pro daný měsíc a firmu
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        date,
        time,
        title,
        address,
        notes,
        technician_id,
        profiles!calendar_events_technician_id_fkey(full_name)
      `)
      .eq('company_id', profile.company_id)
      .gte('date', `${year}-${month.padStart(2, '0')}-01`)
      .lt('date', `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Formátovat výsledky
    const formattedEvents = events?.map(event => ({
      id: event.id,
      date: event.date,
      time: event.time,
      title: event.title,
      address: event.address,
      notes: event.notes,
      technicianId: event.technician_id,
      technicianName: event.profiles?.full_name || 'Neznámý',
    })) || [];

    return NextResponse.json({ events: formattedEvents }, { status: 200 });
  } catch (error) {
    console.error('Error in calendar GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { date, time, title, address, notes } = body;

    if (!date || !time || !title || !address) {
      return NextResponse.json({ 
        error: 'Date, time, title, and address are required' 
      }, { status: 400 });
    }

    // Vytvořit událost
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        company_id: profile.company_id,
        technician_id: user.id,
        date,
        time,
        title,
        address,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error in calendar POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
