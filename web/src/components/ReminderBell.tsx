import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';
import type { Reminder } from '../types';
import { useAuthStore } from '../store/authStore';

/**
 * ReminderBell — mounted globally in App.tsx.
 * Polls /api/reminders every 60s and fires browser Notifications
 * when a reminder's time has passed and is not yet acknowledged.
 */
export const ReminderBell: React.FC = () => {
  const token = useAuthStore(state => state.token);
  const [pendingCount, setPendingCount] = useState(0);
  const firedIds = useRef<Set<string>>(new Set());

  const checkReminders = async () => {
    if (!token) return;
    try {
      const res = await api.get('/reminders');
      if (!res.data.success) return;

      const reminders: Reminder[] = res.data.data;
      const now = Date.now();
      let count = 0;

      for (const r of reminders) {
        if (new Date(r.reminderAt).getTime() <= now) {
          count++;
          // Fire browser notification (once per reminder per session)
          if (!firedIds.current.has(r._id)) {
            firedIds.current.add(r._id);
            fireNotification(r);
          }
        }
      }

      setPendingCount(count);
    } catch (_) {
      // Silently fail — non-critical feature
    }
  };

  const fireNotification = async (reminder: Reminder) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification('⏰ TrackOS Reminder', {
        body: reminder.title,
        icon: '/icons/icon-192.png',
        tag: reminder._id,
      });
    }
  };

  useEffect(() => {
    if (!token) return;
    checkReminders();
    const interval = setInterval(checkReminders, 60_000);
    return () => clearInterval(interval);
  }, [token]);

  if (!token) return null;

  return (
    <div className="reminder-bell" title={`${pendingCount} pending reminder${pendingCount !== 1 ? 's' : ''}`}>
      <Bell size={18} />
      {pendingCount > 0 && (
        <span className="reminder-bell-badge">{pendingCount}</span>
      )}
    </div>
  );
};
