import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Bell, CheckCircle2, AlertCircle, Award, MessageSquare, Info, X } from 'lucide-react';

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const list = await apiRequest<NotificationItem[]>('/notifications');
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', 'POST');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl shadow-2xl overflow-hidden mt-14 sm:mt-12 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)] bg-[var(--card-bg-to)]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-[var(--text-primary)]">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] sm:max-h-[400px] overflow-y-auto divide-y divide-[var(--panel-border)]">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">No notifications found</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 transition-colors ${n.is_read ? 'bg-transparent opacity-75' : 'bg-emerald-500/10 border-l-4 border-emerald-500'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--card-bg-to)] text-emerald-500 shrink-0 mt-0.5 border border-[var(--panel-border)]">
                    {n.type === 'task_approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                     n.type === 'task_declined' ? <AlertCircle className="w-4 h-4 text-rose-500" /> :
                     n.type === 'points_awarded' ? <Award className="w-4 h-4 text-amber-500" /> :
                     n.type === 'announcement' ? <Info className="w-4 h-4 text-sky-500" /> :
                     <MessageSquare className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed break-words">{n.body}</p>
                    <span className="text-[10px] text-[var(--text-muted)] mt-2 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
