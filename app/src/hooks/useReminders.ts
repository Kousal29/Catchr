'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reminder, ReminderStatus } from '@/types';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setReminders([]);
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setReminders(data as Reminder[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = useCallback(async (data: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: newReminder, error } = await supabase
      .from('reminders')
      .insert({
        route_number: data.route_number,
        route_name: data.route_name,
        direction_label: data.direction_label,
        stop_name: data.stop_name,
        threshold_stops: data.threshold_stops,
        active_from_time: data.active_from_time,
        active_to_time: data.active_to_time,
        recurrence_rule: data.recurrence_rule,
        status: data.status,
        is_favorite: data.is_favorite,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (!error && newReminder) {
      setReminders(prev => [newReminder as Reminder, ...prev]);
      return newReminder as Reminder;
    }
    return null;
  }, []);

  const updateStatus = useCallback(async (id: string, status: ReminderStatus) => {
    // Optimistic update
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await supabase.from('reminders').update({ status }).eq('id', id);
  }, []);

  const remove = useCallback(async (id: string) => {
    // Optimistic update
    setReminders(prev => prev.filter(r => r.id !== id));
    await supabase.from('reminders').delete().eq('id', id);
  }, []);

  const togglePause = useCallback(async (id: string) => {
    const r = reminders.find(rem => rem.id === id);
    if (r) {
      const newStatus: ReminderStatus = r.status === 'paused' ? 'idle' : 'paused';
      updateStatus(id, newStatus);
    }
  }, [reminders, updateStatus]);

  return { reminders, loading, createReminder, updateStatus, remove, togglePause, refresh: fetchReminders };
}

export function usePolling(reminderId: string | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stopsAway, setStopsAway] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!enabled || !reminderId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    // Simulated polling - in production this would call BMTC API
    const poll = () => {
      // Simulate bus getting closer over time
      setStopsAway(prev => {
        if (prev === null) return Math.floor(Math.random() * 5) + 3;
        return Math.max(0, prev - 1);
      });
    };

    poll();
    intervalRef.current = setInterval(poll, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, reminderId]);

  return { stopsAway, isPolling };
}
