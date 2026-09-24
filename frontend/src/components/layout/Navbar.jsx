import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  Sparkles,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  MapPin,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markNotificationRead, markAllAsRead } = useNotificationStore();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
    const interval = isAuthenticated ? window.setInterval(fetchNotifications, 30000) : null;
    return () => interval && window.clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const roleLinks = user?.role === 'CUSTOMER'
    ? [{ to: '/customer/dashboard', label: 'Dashboard' }, { to: '/customer/requests', label: 'Requests' }, { to: '/customer/bookings', label: 'Bookings' }, { to: '/customer/invoices', label: 'Invoices' }]
    : user?.role === 'SERVICE_PROVIDER'
      ? [{ to: '/provider/dashboard', label: 'Dashboard' }, { to: '/provider/requests', label: 'Requests' }, { to: '/provider/bookings', label: 'Bookings' }, { to: '/provider/availability', label: 'Availability' }]
      : user?.role === 'PLATFORM_ADMIN'
        ? [{ to: '/admin/dashboard', label: 'Control center' }]
        : user?.role === 'OPERATIONS_MANAGER'
          ? [{ to: '/operations/dashboard', label: 'Operations center' }]
          : user?.role === 'SUPPORT_AGENT' ? [{ to: '/support/dashboard', label: 'Support queue' }] : [];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 lg:px-5">
        <Link to="/customer/dashboard" className="flex min-w-[180px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[2rem] font-black tracking-tight text-sky-700">CareConnect</div>
            <div className="text-[11px] font-medium tracking-[0.08em] text-slate-500 uppercase">Home Services Made Easy</div>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-3 lg:flex">
          <div className="flex w-full max-w-[520px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              readOnly
              value="Search for services (e.g. AC repair, cleaning...)"
              className="w-full border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex min-w-[160px] items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-slate-700">Hyderabad</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Notifications</span>
                    <Badge variant="neutral">{unreadCount} unread</Badge>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <button
                          key={n._id}
                          onClick={() => {
                            markNotificationRead(n._id);
                            setShowNotifDropdown(false);
                            if (n.linkUrl) navigate(n.linkUrl);
                          }}
                          className={`w-full rounded-xl border p-2.5 text-left text-xs ${n.read ? 'border-slate-200 bg-slate-50' : 'border-sky-200 bg-sky-50'}`}
                        >
                          <p className="font-semibold text-slate-700">{n.title}</p>
                          <p className="mt-1 text-slate-500">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <button onClick={markAllAsRead} className="mt-2 text-xs font-medium text-sky-600 hover:underline">
                    Mark all read
                  </button>
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-sm transition hover:border-sky-200"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-sm font-semibold text-white">
                  {(user?.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-0 text-left md:block">
                  <div className="truncate text-sm font-semibold text-slate-700">{user?.name || 'Priya'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">Sign In</Link>
              <Link to="/register" className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500">Sign Up</Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500">Search for services...</span>
          </div>
          <div className="space-y-1">
            {roleLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
