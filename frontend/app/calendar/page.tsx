'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Edit2, Trash2, X, MapPin, Clock, Flag, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RaceEvent {
  id: string;
  user_id: string;
  event_name: string;
  track_name: string;
  event_date: string;
  event_time: string;
  location: string;
  description?: string;
  event_type: 'race' | 'practice' | 'qualifying' | 'test';
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

interface Alert {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function RaceCalendar() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RaceEvent | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState<{
    event_name: string;
    track_name: string;
    event_date: string;
    event_time: string;
    location: string;
    description: string;
    event_type: 'race' | 'practice' | 'qualifying' | 'test';
    status: 'upcoming' | 'completed' | 'cancelled';
  }>({
    event_name: '',
    track_name: '',
    event_date: '',
    event_time: '',
    location: '',
    description: '',
    event_type: 'race',
    status: 'upcoming',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const showAlert = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('race_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert('error', `Failed to fetch events: ${message}`);
    }
  }, [user?.id, showAlert]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('race_events')
          .update(formData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        showAlert('success', 'Event updated successfully!');
      } else {
        const { error } = await supabase
          .from('race_events')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        showAlert('success', 'Event created successfully!');
      }

      fetchEvents();
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert('error', `Failed to save event: ${message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('race_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showAlert('success', 'Event deleted successfully!');
      fetchEvents();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert('error', `Failed to delete event: ${message}`);
    }
  };

  const openModal = (date?: Date, event?: RaceEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        event_name: event.event_name,
        track_name: event.track_name,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        description: event.description || '',
        event_type: event.event_type,
        status: event.status,
      });
    } else {
      setEditingEvent(null);
      const dateStr = date ? date.toISOString().split('T')[0] : '';
      setFormData({
        event_name: '',
        track_name: '',
        event_date: dateStr,
        event_time: '14:00',
        location: '',
        description: '',
        event_type: 'race',
        status: 'upcoming',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'race': return 'bg-red-500';
      case 'qualifying': return 'bg-yellow-500';
      case 'practice': return 'bg-blue-500';
      case 'test': return 'bg-green-500';
      default: return 'bg-zinc-500';
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'race': return 'bg-red-950/30 border-red-500 text-red-400';
      case 'qualifying': return 'bg-yellow-950/30 border-yellow-500 text-yellow-400';
      case 'practice': return 'bg-blue-950/30 border-blue-500 text-blue-400';
      case 'test': return 'bg-green-950/30 border-green-500 text-green-400';
      default: return 'bg-zinc-950 border-zinc-700 text-zinc-400';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Stats calculations
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const thisMonthEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    return eventDate.getMonth() === currentMonth.getMonth() && 
           eventDate.getFullYear() === currentMonth.getFullYear();
  }).length;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`
                px-4 py-3 rounded-lg border flex items-center gap-3 min-w-[300px]
                ${alert.type === 'success' ? 'bg-green-950/30 border-green-500 text-green-400' :
                  alert.type === 'error' ? 'bg-red-950/30 border-red-500 text-red-400' :
                  'bg-blue-950/30 border-blue-500 text-blue-400'}
              `}
            >
              {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{alert.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              RACE CALENDAR
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Track and manage your racing events
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Total Events</span>
                <Calendar className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{events.length}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Upcoming</span>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{upcomingEvents}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Completed</span>
                <Trophy className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{completedEvents}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">This Month</span>
                <Flag className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{thisMonthEvents}</div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100 tracking-wider">{monthName}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateEvents = getEventsForDate(date);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => openModal(date)}
                    className={`
                      aspect-square p-2 rounded-lg border transition-all hover:border-orange-600 hover:bg-zinc-800
                      ${isToday ? 'border-orange-600 bg-orange-950/20' : 'border-zinc-800'}
                      ${dateEvents.length > 0 ? 'bg-zinc-800/50' : 'bg-zinc-900/30'}
                    `}
                  >
                    <div className="text-sm font-bold text-zinc-100 mb-1">{day}</div>
                    {dateEvents.length > 0 && (
                      <div className="space-y-1">
                        {dateEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`w-full h-1 rounded-full ${getEventTypeColor(event.event_type)}`}
                          />
                        ))}
                        {dateEvents.length > 2 && (
                          <div className="text-[10px] text-zinc-500">+{dateEvents.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {upcomingEvents > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-zinc-100 tracking-wider mb-4">
                UPCOMING EVENTS
              </h2>
              <div className="space-y-3">
                {events
                  .filter(e => e.status === 'upcoming')
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`
                        rounded-lg p-4 border-l-4 flex items-center justify-between
                        ${getEventTypeBadge(event.event_type)}
                      `}
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-100 mb-1">
                          {event.event_name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <div className="flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {event.track_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(undefined, event)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-zinc-400 hover:text-zinc-100" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wider">
                    {editingEvent ? 'EDIT EVENT' : 'ADD NEW EVENT'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Event Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.event_name}
                        onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600"
                        placeholder="e.g., Grand Prix Season Finale"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Track Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.track_name}
                        onChange={(e) => setFormData({ ...formData, track_name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600"
                        placeholder="e.g., Circuit of the Americas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.event_date}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Event Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.event_time}
                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600"
                        placeholder="e.g., Austin, Texas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Event Type *
                      </label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) => setFormData({ ...formData, event_type: value as 'race' | 'practice' | 'qualifying' | 'test' })}
                      >
                        <SelectTrigger className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-600">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="race">Race</SelectItem>
                          <SelectItem value="qualifying">Qualifying</SelectItem>
                          <SelectItem value="practice">Practice</SelectItem>
                          <SelectItem value="test">Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Status *
                      </label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as 'upcoming' | 'completed' | 'cancelled' })}
                      >
                        <SelectTrigger className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-600">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-orange-600 min-h-[100px]"
                      placeholder="Add any additional details about the event..."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-6 py-3 rounded-lg font-rajdhani font-bold tracking-wider transition-all"
                    >
                      {editingEvent ? 'UPDATE EVENT' : 'CREATE EVENT'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-3 rounded-lg font-rajdhani font-bold tracking-wider transition-all"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
