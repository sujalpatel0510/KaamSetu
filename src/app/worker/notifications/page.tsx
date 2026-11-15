'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Bell, CheckCheck, Clock } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function WorkerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="WORKER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500">
              Updates on job applications and employer responses
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No notifications yet</h3>
            <p className="text-xs text-slate-400">You will be notified when employers review your applications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-teal-50/70 border-teal-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-teal-600"></span>}
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 pl-4 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
