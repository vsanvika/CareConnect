import React, { useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useNotificationStore } from '../store/useNotificationStore';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifications, markNotificationRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const openNotification = (notification) => {
    if (!notification.read) markNotificationRead(notification._id);
    if (notification.linkUrl) navigate(notification.linkUrl);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="info" className="gap-1"><Bell className="w-3.5 h-3.5" /> Activity center</Badge>
          <h1 className="text-3xl font-bold text-slate-100 mt-2">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">Stay up to date with requests, bookings, disputes, and reviews.</p>
        </div>
        {unreadCount > 0 && <Button onClick={markAllAsRead} variant="outline" size="sm" icon={CheckCheck}>Mark all read</Button>}
      </div>

      {loading ? (
        <Card className="h-40 animate-pulse" />
      ) : notifications.length === 0 ? (
        <Card className="text-center py-16"><Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-sm text-slate-400">You are all caught up.</p></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button key={notification._id} onClick={() => openNotification(notification)} className={`w-full text-left p-4 rounded-2xl border transition ${notification.read ? 'bg-slate-900/50 border-slate-800' : 'bg-blue-950/30 border-blue-500/30 hover:border-blue-400/50'}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notification.read ? 'bg-slate-700' : 'bg-blue-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-slate-200">{notification.title}</h2>
                    <span className="text-[11px] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 mt-3">{notification.type.replaceAll('_', ' ')} <ExternalLink className="w-3 h-3" /></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">Back to CareConnect</Link>
    </div>
  );
};
