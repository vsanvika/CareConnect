import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, CheckCircle2, FileText, MessageSquare, Plus, Save, ShieldAlert, Star } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { QueryFilters } from '../../components/common/QueryFilters';

const activeBookingStatuses = ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'];
const activeRequestStatuses = ['AI_ANALYZED', 'QUOTING', 'BOOKED', 'IN_PROGRESS'];
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (value = '') => value.replaceAll('_', ' ');
const statusVariant = (value = '') => ['COMPLETED', 'CUSTOMER_CONFIRMED', 'PAID', 'RESOLVED'].includes(value) ? 'success' : ['DISPUTED', 'CANCELLED', 'REJECTED'].includes(value) ? 'danger' : ['PENDING', 'QUOTING', 'IN_PROGRESS', 'UNDER_REVIEW', 'OPEN', 'OPENED'].includes(value) ? 'warning' : 'info';

const CustomerShell = ({ eyebrow, title, description, children, action }) => (
  <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div><Badge variant="info" className="mb-2">{eyebrow}</Badge><h1 className="text-3xl font-bold text-slate-100">{title}</h1><p className="text-sm text-slate-400 mt-2">{description}</p></div>
      {action}
    </div>
    {children}
  </div>
);

const statToneClasses = { blue: 'bg-blue-500/10 text-blue-300', amber: 'bg-amber-500/10 text-amber-300', emerald: 'bg-emerald-500/10 text-emerald-300', cyan: 'bg-cyan-500/10 text-cyan-300', rose: 'bg-rose-500/10 text-rose-300', violet: 'bg-violet-500/10 text-violet-300' };
const Stat = ({ icon: Icon, title, value, href, tone = 'blue' }) => (
  <Link to={href} className="block group"><Card className="h-full"><div className="flex justify-between"><span className={`p-2 rounded-xl ${statToneClasses[tone]}`}><Icon className="w-5 h-5" /></span><ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-300" /></div><p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-5">{title}</p><p className="text-2xl font-extrabold text-slate-100 mt-1">{value}</p></Card></Link>
);

const RequestCard = ({ request }) => <Card className="flex flex-col justify-between"><div><div className="flex justify-between gap-3"><Badge variant={statusVariant(request.status)}>{label(request.status)}</Badge><span className="text-[11px] text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</span></div><h3 className="font-bold text-slate-100 mt-3">{request.title}</h3><p className="text-xs text-slate-400 line-clamp-2 mt-1">{request.description}</p><p className="text-xs text-blue-300 mt-3">{request.eligibleProviders?.length || 0} matched providers</p></div><Link to={`/customer/requests/${request._id}`} className="mt-4"><Button variant="secondary" size="sm" icon={ArrowRight}>View request</Button></Link></Card>;

export const CustomerHomePage = () => {
  const [data, setData] = useState({ requests: [], bookings: [], notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [requestsRes, bookingsRes, notificationsRes] = await Promise.all([
          api.get('/requests'),
          api.get('/bookings'),
          api.get('/notifications')
        ]);

        setData({
          requests: requestsRes.data.data || [],
          bookings: bookingsRes.data.data || [],
          notifications: notificationsRes.data.data || []
        });
      } catch (error) {
        console.error('Failed to load customer dashboard data', error);
        setData({ requests: [], bookings: [], notifications: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const customerName = localStorage.getItem('careconnect-user')
    ? JSON.parse(localStorage.getItem('careconnect-user')).name || 'Priya'
    : 'Priya';

  const activeRequests = data.requests.filter((request) => activeRequestStatuses.includes(request.status));
  const activeBookings = data.bookings.filter((booking) => activeBookingStatuses.includes(booking.status));
  const upcomingBooking = [...activeBookings].sort((a, b) => new Date(a.scheduledStart || a.createdAt) - new Date(b.scheduledStart || b.createdAt))[0];

  const serviceCards = [
    { name: 'Plumbing', icon: '🛠️', tone: 'bg-[#e8f5ff] text-[#0f66b8]' },
    { name: 'Electrical', icon: '⚡', tone: 'bg-[#fff1d6] text-[#d97706]' },
    { name: 'AC Repair', icon: '❄️', tone: 'bg-[#dffaf6] text-[#0f9d8a]' },
    { name: 'Cleaning', icon: '🧼', tone: 'bg-[#f0f5ff] text-[#4f46e5]' },
    { name: 'Appliance Repair', icon: '🔧', tone: 'bg-[#f3ecff] text-[#7c3aed]' },
    { name: 'Painting', icon: '🎨', tone: 'bg-[#fff0f2] text-[#db2777]' },
    { name: 'Home Maintenance', icon: '🏡', tone: 'bg-[#e9fdf5] text-[#16a34a]' }
  ];

  const howItWorks = [
    { title: 'Tell us what you need', subtitle: 'Describe your service requirement', icon: '📝' },
    { title: 'Find suitable providers', subtitle: 'AI matches the best professionals', icon: '📍' },
    { title: 'Compare quotes', subtitle: 'Review pricing & ratings', icon: '💬' },
    { title: 'Book your service', subtitle: 'Choose and confirm your slot', icon: '📅' },
    { title: 'Track the job', subtitle: 'Get real-time updates', icon: '📡' }
  ];

  const testimonials = [
    { name: 'Anjali Sharma', stars: 5, review: 'Great service! The plumber was on time and fixed the issue quickly.', time: '2 days ago', avatar: 'AS' },
    { name: 'Rohit Mehta', stars: 5, review: 'The AI matching saved me time and the provider was very professional.', time: '3 days ago', avatar: 'RM' },
    { name: 'Sneha Iyer', stars: 5, review: 'Very reliable and transparent pricing. I would definitely use CareConnect again.', time: '1 week ago', avatar: 'SI' }
  ];

  const reasons = [
    { title: 'Verified Providers', text: 'Background checked & trusted', icon: '✅' },
    { title: 'Transparent Quotes', text: 'No hidden charges', icon: '💸' },
    { title: 'Real-Time Tracking', text: 'Know exactly where your job is', icon: '🔔' },
    { title: 'Secure Booking', text: 'Safe and hassle-free payments', icon: '🛡️' },
    { title: 'AI Assistance', text: 'Smarter, faster support', icon: '🤖' }
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 xl:px-2">
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_330px]">
        <aside className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <nav className="space-y-1">
            {[
              { name: 'Dashboard', icon: '🏠', active: true, to: '/customer/dashboard' },
              { name: 'Service Requests', icon: '📄', to: '/customer/requests' },
              { name: 'Bookings', icon: '📅', to: '/customer/bookings' },
              { name: 'Providers', icon: '👥', to: '/customer/providers/0' },
              { name: 'Home & Maintenance', icon: '🏡', to: '/customer/requests' },
              { name: 'Messages', icon: '💬', badge: 2, to: '/customer/notifications' },
              { name: 'Notifications', icon: '🔔', badge: 3, to: '/customer/notifications' },
              { name: 'Support', icon: '🎧', to: '/support/tickets' },
              { name: 'Profile', icon: '👤', to: '/customer/profile' }
            ].map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium transition ${
                  item.active ? 'bg-[#eef6ff] text-[#0d6efd] shadow-sm ring-1 ring-sky-100' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-base">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.badge ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{item.badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] border border-sky-100 bg-gradient-to-br from-[#eff9ff] to-white p-4 shadow-sm">
            <div className="mb-3 h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-50">
              <div className="flex h-full items-center justify-center text-5xl">🚑</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold text-slate-800">Need urgent help?</div>
              <div className="mt-1 text-sm leading-5 text-slate-600">Emergency services available 24/7</div>
              <Link
                to="/support/tickets"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#1d8ff5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
              >
                📞 Call Now
              </Link>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-[#eef8ff] p-5 shadow-[0_8px_20px_rgba(89,161,219,0.08)] sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="mb-3 text-[16px] font-semibold text-slate-700">Good morning, {customerName}! 👋</div>
                <h1 className="max-w-[420px] text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[34px]">
                  Reliable Home Services,
                  <span className="block">At Your Doorstep.</span>
                </h1>
                <p className="mt-3 max-w-[430px] text-[14px] text-slate-600">
                  Book trusted professionals for all your home service needs.
                </p>

                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="text-base">🔍</span>
                    <input
                      type="text"
                      readOnly
                      value="What service do you need?"
                      className="w-full border-0 bg-transparent text-sm text-slate-500 outline-none"
                    />
                  </div>
                  <div className="flex min-w-[140px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="text-base">📍</span>
                    <span className="text-sm font-medium text-slate-700">Hyderabad</span>
                  </div>
                  <Link
                    to="/customer/requests/new"
                    className="inline-flex items-center justify-center rounded-xl bg-[#1d8ff5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    Find Service
                  </Link>
                </div>
              </div>

              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-[#dfeeff] via-[#edf8ff] to-[#f7fbff]">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
                  alt="Technician"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">Popular Services</h2>
              <Link to="/customer/requests" className="text-sm font-semibold text-sky-700 hover:text-sky-800">View All →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {serviceCards.map((service) => (
                <Link
                  key={service.name}
                  to="/customer/requests/new"
                  className="group rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-center transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${service.tone}`}>
                    {service.icon}
                  </div>
                  <div className="mt-3 text-[14px] font-semibold text-slate-800">{service.name}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">How It Works</h2>
              <Link to="/customer/requests" className="text-sm font-semibold text-sky-700 hover:text-sky-800">View All Steps →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {howItWorks.map((step, index) => (
                <div key={step.title} className="flex items-center gap-3 md:block md:text-center">
                  <div className="flex items-center gap-3 md:justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff8ff] text-2xl text-sky-700 shadow-sm ring-1 ring-sky-100">
                      {step.icon}
                    </div>
                    {index < howItWorks.length - 1 && (
                      <div className="hidden h-px w-10 bg-sky-200 md:block" />
                    )}
                  </div>
                  <div className="mt-3 md:mt-4">
                    <div className="text-[15px] font-bold text-slate-800">{index + 1}</div>
                    <div className="text-[14px] font-semibold text-slate-700">{step.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{step.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">Why Choose CareConnect?</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {reasons.map((reason) => (
                  <div key={reason.title} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7ff] text-xl shadow-sm ring-1 ring-sky-100">
                      {reason.icon}
                    </div>
                    <div className="mt-3 text-[14px] font-bold text-slate-800">{reason.title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{reason.text}</div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br from-[#edf8ff] to-white">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                  alt="Home service lifestyle"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">What Our Customers Say</h2>
              <Link to="/customer/reviews" className="text-sm font-semibold text-sky-700 hover:text-sky-800">View All Reviews →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-cyan-100 text-xs font-bold text-sky-700">
                      {item.avatar}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-800">{item.name}</div>
                      <div className="text-amber-500">{'★'.repeat(item.stars)}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] leading-6 text-slate-600">“{item.review}”</p>
                  <div className="mt-4 text-xs text-slate-400">• {item.time}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <div className="rounded-[26px] border border-slate-200 bg-[#eefaf3] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[17px] font-bold text-slate-800">AI-Powered Service Matching</div>
            </div>
            <div className="mb-4 text-sm leading-6 text-slate-600">Tell us your problem, and let AI find the best providers for you.</div>
            <ul className="space-y-3 text-sm text-slate-700">
              {['AI Diagnosis', 'Smart Provider Matching', 'Price Estimation', 'Maintenance Recommendations'].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/customer/requests/new"
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              Try Now →
            </Link>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-slate-900">Your Upcoming Booking</h3>
              <Link to="/customer/bookings" className="text-sm font-semibold text-sky-700 hover:text-sky-800">View All →</Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-4 animate-pulse rounded bg-slate-100" />
              </div>
            ) : upcomingBooking ? (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 h-24 overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-cyan-50">
                  <img
                    src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80"
                    alt="Upcoming service"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[15px] font-bold text-slate-800">{upcomingBooking.requestId?.title || 'AC Repair'}</div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Confirmed</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">📅 {new Date(upcomingBooking.scheduledStart || upcomingBooking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div className="flex items-center gap-2">🕐 {new Date(upcomingBooking.scheduledStart || upcomingBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="flex items-center gap-2">👤 {upcomingBooking.providerId?.name || 'Rahul Kumar'}</div>
                  <div className="flex items-center gap-2">⭐ {upcomingBooking.providerId?.ratingAverage || '4.8'}</div>
                </div>
                <Link
                  to={`/customer/bookings/${upcomingBooking._id}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Details
                </Link>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No upcoming bookings yet.
              </div>
            )}
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <h3 className="mb-4 text-[18px] font-bold text-slate-900">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/customer/requests/new" className="rounded-[18px] border border-sky-200 bg-[#edf7ff] p-4 text-left text-slate-800 hover:bg-[#e2f1ff]">
                <div className="text-2xl">＋</div>
                <div className="mt-3 text-[15px] font-semibold">Request Service</div>
              </Link>
              <Link to="/support/tickets" className="rounded-[18px] border border-amber-200 bg-[#fff7eb] p-4 text-left text-slate-800 hover:bg-[#fff0d6]">
                <div className="text-2xl">⚠</div>
                <div className="mt-3 text-[15px] font-semibold">Emergency Service</div>
              </Link>
              <Link to="/customer/bookings" className="rounded-[18px] border border-sky-200 bg-[#edf7ff] p-4 text-left text-slate-800 hover:bg-[#e2f1ff]">
                <div className="text-2xl">📅</div>
                <div className="mt-3 text-[15px] font-semibold">My Bookings</div>
              </Link>
              <Link to="/customer/requests" className="rounded-[18px] border border-emerald-200 bg-[#edfdf5] p-4 text-left text-slate-800 hover:bg-[#dbf7eb]">
                <div className="text-2xl">🕐</div>
                <div className="mt-3 text-[15px] font-semibold">View History</div>
              </Link>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <h3 className="text-[18px] font-bold text-slate-900">Need Help?</h3>
            <div className="mt-2 text-sm text-slate-600">Our support team is available 24/7.</div>
            <Link
              to="/support/tickets"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#1d8ff5] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
            >
              Chat Now
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const CustomerRequestsPage = () => { const [requests, setRequests] = useState([]); const [filters, setFilters] = useState({ status: '', urgency: '', date: '' }); const [applied, setApplied] = useState({}); const load = () => api.get('/requests', { params: { ...applied, limit: 50 } }).then((response) => setRequests(response.data.data || [])); useEffect(() => { load(); }, [applied]); return <CustomerShell eyebrow="My requests" title="Service requests" description="Review every request, match, and quote in one place." action={<Link to="/customer/requests/new"><Button icon={Plus}>New request</Button></Link>}><QueryFilters fields={[{ key: 'status', label: 'Status', type: 'select', options: ['AI_ANALYZED', 'QUOTING', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'].map((value) => ({ value, label: label(value) })) }, { key: 'urgency', label: 'Urgency', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map((value) => ({ value, label: value })) }, { key: 'date', label: 'Preferred date', type: 'date' }]} values={filters} onChange={(key, value) => setFilters({ ...filters, [key]: value })} onApply={() => setApplied(filters)} onReset={() => { setFilters({ status: '', urgency: '', date: '' }); setApplied({}); }} /><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{requests.length ? requests.map((request) => <RequestCard key={request._id} request={request} />) : <Card className="md:col-span-2 text-center text-sm text-slate-500">No requests match these filters.</Card>}</div></CustomerShell>; };

export const CustomerQuoteInboxPage = () => { const [requests, setRequests] = useState([]); useEffect(() => { api.get('/requests').then((response) => setRequests((response.data.data || []).filter((request) => request.status === 'QUOTING'))); }, []); return <CustomerShell eyebrow="Quote inbox" title="Pending quotes" description="Open a request to compare provider proposals and choose the right fit."><div className="grid md:grid-cols-2 gap-4">{requests.length ? requests.map((request) => <Card key={request._id}><Badge variant="warning">{request.eligibleProviders?.length || 0} matched providers</Badge><h3 className="font-bold text-slate-100 mt-3">{request.title}</h3><p className="text-xs text-slate-400 mt-1">{request.description}</p><Link to={`/customer/quotes/${request._id}`} className="inline-flex mt-4"><Button size="sm" icon={ArrowRight}>Compare quotes</Button></Link></Card>) : <Card className="md:col-span-2 text-center text-sm text-slate-500">No requests are currently waiting for quotes.</Card>}</div></CustomerShell>; };

export const CustomerQuotesPage = () => { const { requestId } = useParams(); return <CustomerShell eyebrow="Quote comparison" title="Compare provider quotes" description="Review pricing, experience, and scope before you book."><RequestQuotes requestId={requestId} /></CustomerShell>; };

const RequestQuotes = ({ requestId }) => { const [request, setRequest] = useState(null); const [quotes, setQuotes] = useState([]); const [error, setError] = useState(''); useEffect(() => { Promise.all([api.get(`/requests/${requestId}`), api.get(`/quotes/request/${requestId}`)]).then(([requestResponse, quoteResponse]) => { setRequest(requestResponse.data.data); setQuotes(quoteResponse.data.data || []); }).catch((err) => setError(err.response?.data?.message || 'Unable to load quotes.')); }, [requestId]); const accept = async (quoteId) => { const response = await api.post(`/quotes/${quoteId}/accept`); window.location.href = `/customer/bookings/${response.data.data.booking._id}`; }; if (!request) return <Card>{error || 'Loading quotes...'}</Card>; return <div className="space-y-5"><Card><Badge variant={statusVariant(request.status)}>{label(request.status)}</Badge><h2 className="text-2xl font-bold text-slate-100 mt-3">{request.title}</h2><p className="text-sm text-slate-400 mt-2">{request.description}</p>{request.aiAnalysis && <p className="text-xs text-blue-300 mt-4">AI estimate: {money(request.aiAnalysis.estimatedCostRange?.min)} - {money(request.aiAnalysis.estimatedCostRange?.max)}</p>}</Card>{quotes.length === 0 ? <Card className="text-center text-sm text-slate-500">No quotes yet. Matched providers have been notified.</Card> : quotes.map((quote) => <Card key={quote._id} className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-3"><img src={quote.providerId?.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" /><div><h3 className="font-bold text-slate-100">{quote.providerId?.name}</h3><p className="text-xs text-amber-300">{quote.providerId?.ratingAverage || 0}/5 · {quote.providerId?.ratingCount || 0} reviews</p></div></div><p className="text-sm text-slate-400 mt-3">{quote.notes || 'Provider did not add notes.'}</p><p className="text-xs text-slate-500 mt-2">Includes: {quote.includedServices?.join(', ') || 'Scope discussed at booking'}</p></div><div className="text-right"><p className="text-2xl font-bold text-emerald-300">{money(quote.amount)}</p>{quote.status === 'SUBMITTED' && request.status !== 'BOOKED' && <Button onClick={() => accept(quote._id)} className="mt-3">Accept & book</Button>}<Link to={`/customer/providers/${quote.providerId?._id}`} className="text-xs text-blue-300 block mt-3">View provider</Link></div></Card>)}</div>; };

export const CustomerBookingsPage = () => { const [bookings, setBookings] = useState([]); useEffect(() => { api.get('/bookings').then((response) => setBookings(response.data.data || [])); }, []); return <CustomerShell eyebrow="Appointments" title="Your bookings" description="Track appointments, job progress, evidence, invoices, and reviews."><div className="space-y-3">{bookings.length ? bookings.map((booking) => <Link key={booking._id} to={`/customer/bookings/${booking._id}`}><Card className="flex flex-col md:flex-row md:items-center justify-between gap-3"><div><Badge variant={statusVariant(booking.status)}>{label(booking.status)}</Badge><h3 className="font-bold text-slate-100 mt-2">{booking.requestId?.title || 'Service booking'}</h3><p className="text-xs text-slate-500 mt-1">{booking.providerId?.name || 'Provider'} · {new Date(booking.scheduledStart).toLocaleString()}</p></div><span className="text-lg font-bold text-emerald-300">{money(booking.totalAmount)}</span></Card></Link>) : <Card className="text-center text-sm text-slate-500">No bookings yet. Compare quotes from an active request to book a provider.</Card>}</div></CustomerShell>; };

export const CustomerInvoicesPage = () => { const [invoices, setInvoices] = useState([]); useEffect(() => { api.get('/invoices').then((response) => setInvoices(response.data.data || [])); }, []); return <CustomerShell eyebrow="Payments" title="Invoices" description="View charges, pay securely, and keep your service receipts available." ><div className="space-y-3">{invoices.length ? invoices.map((invoice) => <Link key={invoice._id} to={`/customer/invoices/${invoice._id}`}><Card className="flex items-center justify-between"><div><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-300" /><span className="font-semibold text-slate-100">{invoice.invoiceNumber}</span><Badge variant={statusVariant(invoice.paymentStatus)}>{invoice.paymentStatus}</Badge></div><p className="text-xs text-slate-500 mt-2">Issued {new Date(invoice.createdAt).toLocaleDateString()}</p></div><span className="font-bold text-emerald-300">{money(invoice.totalAmount)}</span></Card></Link>) : <Card className="text-center text-sm text-slate-500">Invoices appear when a provider completes a job.</Card>}</div></CustomerShell>; };

export const CustomerDisputesPage = () => { const [disputes, setDisputes] = useState([]); useEffect(() => { api.get('/disputes').then((response) => setDisputes(response.data.data || [])); }, []); return <CustomerShell eyebrow="Support" title="Disputes and support" description="Follow open complaints and review the support response." action={<Link to="/customer/bookings"><Button variant="secondary" icon={ShieldAlert}>Open a dispute from a booking</Button></Link>}><div className="space-y-3">{disputes.length ? disputes.map((dispute) => <Card key={dispute._id}><div className="flex justify-between gap-3"><div><Badge variant={statusVariant(dispute.status)}>{label(dispute.status)}</Badge><h3 className="font-bold text-slate-100 mt-2">{dispute.reason}</h3><p className="text-sm text-slate-400 mt-2">{dispute.description}</p></div><span className="text-xs text-slate-500">{new Date(dispute.createdAt).toLocaleDateString()}</span></div>{dispute.resolutionDetails?.notes && <p className="text-xs text-emerald-300 mt-4">Resolution: {dispute.resolutionDetails.notes}</p>}</Card>) : <Card className="text-center text-sm text-slate-500">No disputes or complaints on your account.</Card>}</div></CustomerShell>; };

export const CustomerReviewsPage = () => { const [reviews, setReviews] = useState([]); useEffect(() => { api.get('/reviews/mine').then((response) => setReviews(response.data.data || [])); }, []); return <CustomerShell eyebrow="Your feedback" title="Reviews you have left" description="Your feedback helps reliable providers stand out." ><div className="space-y-3">{reviews.length ? reviews.map((review) => <Card key={review._id}><div className="flex justify-between"><span className="font-semibold text-slate-200">{review.providerId?.name}</span><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="text-sm text-slate-400 mt-3">{review.comment || 'No written comment.'}</p></Card>) : <Card className="text-center text-sm text-slate-500">Reviews become available after you confirm a completed booking.</Card>}</div></CustomerShell>; };

export const CustomerProviderPage = () => { const { id } = useParams(); const [provider, setProvider] = useState(null); const [reviews, setReviews] = useState([]); useEffect(() => { Promise.all([api.get(`/providers/${id}`), api.get(`/providers/${id}/reviews`)]).then(([profile, reviewResponse]) => { setProvider(profile.data.data); setReviews(reviewResponse.data.data || []); }); }, [id]); return <CustomerShell eyebrow="Provider profile" title={provider?.providerProfile?.businessName || provider?.user?.name || 'Provider'} description="Review experience, coverage, and customer feedback before you choose.">{!provider ? <Card>Loading provider profile...</Card> : <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6"><Card><img src={provider.user?.avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" /><h2 className="text-xl font-bold text-slate-100 mt-4">{provider.user?.name}</h2><p className="text-sm text-slate-400 mt-1">{provider.providerProfile?.bio}</p><p className="text-sm text-amber-300 mt-4"><Star className="inline w-4 h-4 fill-current" /> {provider.providerProfile?.ratingAverage || 0}/5 ({provider.providerProfile?.ratingCount || 0})</p><p className="text-xs text-slate-400 mt-3">{provider.providerProfile?.experienceYears} years experience · {provider.providerProfile?.serviceAreaRadiusKm} km service area</p><div className="flex flex-wrap gap-2 mt-4">{provider.providerProfile?.skillTags?.map((skill) => <Badge key={skill} variant="neutral">{skill}</Badge>)}</div></Card><Card><h2 className="font-bold text-slate-100 mb-4">Recent customer reviews</h2>{reviews.length ? reviews.map((review) => <div key={review._id} className="border-b border-slate-800 py-3 last:border-0"><div className="flex justify-between text-sm"><span className="text-slate-200">{review.customerId?.name || 'Customer'}</span><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="text-xs text-slate-400 mt-2">{review.comment}</p></div>) : <p className="text-sm text-slate-500">No reviews yet.</p>}</Card></div>}</CustomerShell>; };

const ProfileForm = ({ settings = false }) => { const [form, setForm] = useState(null); const [saved, setSaved] = useState(false); useEffect(() => { api.get('/auth/me').then((response) => { const user = response.data.data; setForm({ name: user.name || '', phone: user.phone || '', street: user.address?.street || '', city: user.address?.city || '', zipCode: user.address?.zipCode || '', emailUpdates: localStorage.getItem('careconnect-email-updates') !== 'false', smsUpdates: localStorage.getItem('careconnect-sms-updates') !== 'false' }); }); }, []); const update = (key, value) => setForm((current) => ({ ...current, [key]: value })); const save = async (event) => { event.preventDefault(); await api.put('/auth/profile', { name: form.name, phone: form.phone, address: { street: form.street, city: form.city, zipCode: form.zipCode } }); localStorage.setItem('careconnect-email-updates', form.emailUpdates); localStorage.setItem('careconnect-sms-updates', form.smsUpdates); setSaved(true); }; if (!form) return <Card>Loading profile...</Card>; return <Card><form onSubmit={save} className="space-y-5">{saved && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-sm">Your preferences were saved.</div>}<div className="grid md:grid-cols-2 gap-4"><label className="text-xs text-slate-300 space-y-1"><span>Full name</span><input value={form.name} onChange={(event) => update('name', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" /></label><label className="text-xs text-slate-300 space-y-1"><span>Phone</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" /></label><label className="text-xs text-slate-300 space-y-1"><span>Street</span><input value={form.street} onChange={(event) => update('street', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" /></label><label className="text-xs text-slate-300 space-y-1"><span>City</span><input value={form.city} onChange={(event) => update('city', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" /></label><label className="text-xs text-slate-300 space-y-1"><span>ZIP code</span><input value={form.zipCode} onChange={(event) => update('zipCode', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" /></label></div>{settings && <div className="space-y-3 border-t border-slate-800 pt-5"><label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" checked={form.emailUpdates} onChange={(event) => update('emailUpdates', event.target.checked)} /> Email updates about bookings and invoices</label><label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" checked={form.smsUpdates} onChange={(event) => update('smsUpdates', event.target.checked)} /> SMS updates for provider arrival</label></div>}<Button type="submit" icon={Save}>Save changes</Button></form></Card>; };

export const CustomerProfilePage = () => <CustomerShell eyebrow="Account" title="Your profile" description="Keep your contact and service address ready for every booking."><ProfileForm /></CustomerShell>;
export const CustomerSettingsPage = () => <CustomerShell eyebrow="Preferences" title="Notification settings" description="Choose how CareConnect keeps you informed."><ProfileForm settings /></CustomerShell>;

export const CustomerNotificationsPage = () => { const [notifications, setNotifications] = useState([]); useEffect(() => { api.get('/notifications').then((response) => setNotifications(response.data.data || [])); }, []); const markRead = async (id) => { await api.put(`/notifications/${id}/read`); setNotifications((items) => items.map((item) => item._id === id ? { ...item, read: true } : item)); }; return <CustomerShell eyebrow="Inbox" title="Notifications" description="Stay up to date on matches, quotes, appointments, and support." ><div className="space-y-3">{notifications.length ? notifications.map((item) => <button key={item._id} onClick={() => markRead(item._id)} className={`w-full text-left ${!item.read ? 'border-blue-500/40' : ''}`}><Card><div className="flex gap-3"><Bell className="w-5 h-5 text-blue-300" /><div><p className="font-semibold text-slate-200">{item.title}</p><p className="text-sm text-slate-400 mt-1">{item.message}</p><p className="text-[11px] text-slate-600 mt-2">{new Date(item.createdAt).toLocaleString()}</p></div></div></Card></button>) : <Card className="text-center text-sm text-slate-500">You are all caught up.</Card>}</div></CustomerShell>; };
