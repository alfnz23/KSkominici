'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, X, Users, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  address: string;
  technicianName: string;
  technicianId: string;
  notes?: string;
}

export default function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    title: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/calendar/events?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleOpenForm = () => {
    // Nastaví datum na vybraný den
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setNewEvent({
      date: dateStr,
      time: '10:00',
      title: '',
      address: '',
      notes: '',
    });
    setShowAddForm(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.address) {
      alert('Vyplňte název a adresu');
      return;
    }

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        await loadEvents();
        setShowAddForm(false);
        setNewEvent({
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          title: '',
          address: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
  const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

  const selectedDateEvents = getEventsForDay(selectedDate.getDate());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 lg:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Diář kontrol</h2>
              <p className="text-slate-300">Sdílený kalendář pro všechny techniky</p>
            </div>
          </div>
          <button
            onClick={handleOpenForm}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Přidat událost
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors"
            >
              ←
            </button>
            <h3 className="text-2xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-slate-400 font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate.getDate() === day && 
                                selectedDate.getMonth() === currentDate.getMonth() && 
                                selectedDate.getFullYear() === currentDate.getFullYear();
              const isToday = new Date().getDate() === day && 
                             new Date().getMonth() === currentDate.getMonth() && 
                             new Date().getFullYear() === currentDate.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`
                    aspect-square rounded-lg border-2 transition-all duration-200
                    ${isSelected 
                      ? 'bg-orange-500/20 border-orange-500 text-white' 
                      : isToday
                      ? 'bg-blue-500/20 border-blue-500 text-white'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="font-bold">{day}</span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs mt-1">
                        {dayEvents.length} {dayEvents.length === 1 ? 'událost' : 'události'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Events for Selected Date */}
        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">
            {selectedDate.getDate()}. {monthNames[selectedDate.getMonth()]}
          </h3>

          {selectedDateEvents.length === 0 ? (
            <p className="text-slate-400">Žádné události</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold">{event.time}</span>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                          {event.technicianName}
                        </span>
                      </div>
                      <h4 className="text-white font-bold mb-1">{event.title}</h4>
                      <p className="text-slate-300 text-sm">{event.address}</p>
                      {event.notes && (
                        <p className="text-slate-400 text-sm mt-2">{event.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Přidat událost</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Název *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg border-2 border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
                  placeholder="např. Kontrola komína"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Datum *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-black rounded-lg border-2 border-slate-300 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Čas *</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-black rounded-lg border-2 border-slate-300 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Adresa *</label>
                <input
                  type="text"
                  value={newEvent.address}
                  onChange={e => setNewEvent({ ...newEvent, address: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg border-2 border-slate-300 focus:border-orange-500 outline-none"
                  placeholder="Dlouhá 123, Praha 1"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Poznámky</label>
                <textarea
                  value={newEvent.notes}
                  onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg border-2 border-slate-300 focus:border-orange-500 outline-none"
                  rows={3}
                  placeholder="Volitelné poznámky..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 font-semibold"
                >
                  Uložit
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
