import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, DollarSign, FileText, MapPin, Save, ShieldCheck, Star, UserRound, Wallet } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const statusLabel = (value = '') => value.replaceAll('_', ' ');

const useProviderData = () => {
  const [data, setData] = useState({ user: null, providerProfile: null });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/providers/me').then((response) => setData(response.data.data)).finally(() => setLoading(false));
  }, []);
  return { ...data, loading };
};

const ProviderShell = ({ eyebrow, title, description, children }) => (
  <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
    <div>
      <Badge variant="info" className="mb-2">{eyebrow}</Badge>
      <h1 className="text-3xl font-bold text-slate-100">{title}</h1>
      <p className="text-sm text-slate-400 mt-2">{description}</p>
    </div>
    {children}
  </div>
);

const statToneClasses = {
  blue: 'bg-blue-500/10 text-blue-300',
  amber: 'bg-amber-500/10 text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  cyan: 'bg-cyan-500/10 text-cyan-300'
};

const StatCard = ({ icon: Icon, label, value, href, tone = 'blue' }) => (
  <Link to={href} className="block">
    <Card className="h-full group">
      <div className="flex items-start justify-between">
        <span className={`p-2 rounded-xl ${statToneClasses[tone]}`}><Icon className="w-5 h-5" /></span>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-300 transition" />
      </div>
      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mt-5">{label}</p>
      <p className="text-2xl font-extrabold text-slate-100 mt-1">{value}</p>
    </Card>
  </Link>
);

export const ProviderHomePage = () => {
  const { user, providerProfile, loading } = useProviderData();
  const [stats, setStats] = useState({ requests: 0, quotes: 0, active: 0, completed: 0, earnings: 0 });
  useEffect(() => {
    Promise.all([api.get('/requests'), api.get('/quotes/mine'), api.get('/bookings'), api.get('/invoices')]).then(([requests, quotes, bookings, invoices]) => {
      const jobs = bookings.data.data || [];
      const paidOrIssued = invoices.data.data || [];
      setStats({
        requests: requests.data.data?.length || 0,
        quotes: quotes.data.data?.filter((quote) => quote.status === 'SUBMITTED').length || 0,
        active: jobs.filter((job) => ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'].includes(job.status)).length,
        completed: jobs.filter((job) => ['COMPLETED', 'CUSTOMER_CONFIRMED'].includes(job.status)).length,
        earnings: paidOrIssued.reduce((total, invoice) => total + Number(invoice.totalAmount || 0), 0)
      });
    }).catch(() => {});
  }, []);

  return (
    <ProviderShell eyebrow="Provider command center" title={`Good to see you, ${user?.name?.split(' ')[0] || 'provider'}.`} description="Your work pipeline, trust profile, and earnings in one place.">
      <div className="flex flex-wrap gap-2">
        <Link to="/provider/requests"><Button icon={BriefcaseBusiness}>Browse matching requests</Button></Link>
        <Link to="/provider/profile"><Button variant="secondary" icon={UserRound}>Edit profile</Button></Link>
      </div>
      {loading ? <div className="h-24 rounded-2xl bg-slate-900 animate-pulse" /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={BriefcaseBusiness} label="New requests" value={stats.requests} href="/provider/requests" />
          <StatCard icon={Clock3} label="Pending quotes" value={stats.quotes} href="/provider/quotes" tone="amber" />
          <StatCard icon={Wallet} label="Active jobs" value={stats.active} href="/provider/bookings" tone="emerald" />
          <StatCard icon={CheckCircle2} label="Completed jobs" value={stats.completed} href="/provider/bookings" tone="cyan" />
          <StatCard icon={DollarSign} label="Earnings" value={money(stats.earnings)} href="/provider/invoices" tone="emerald" />
          <StatCard icon={Star} label="Rating" value={`${providerProfile?.ratingAverage || 0}/5`} href="/provider/reviews" tone="amber" />
        </div>
      )}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card>
          <div className="flex justify-between items-center mb-5"><h2 className="font-bold text-slate-100">Provider readiness</h2><Badge variant={providerProfile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{providerProfile?.verificationStatus || 'PENDING'}</Badge></div>
          <div className="space-y-4 text-sm">
            {[['Profile', Boolean(providerProfile?.bio && providerProfile?.skillTags?.length), '/provider/profile'], ['Verification', providerProfile?.verificationStatus === 'VERIFIED', '/provider/verification'], ['Availability', Boolean(providerProfile?.isAvailableNow), '/provider/availability']].map(([label, complete, href]) => (
              <Link key={label} to={href} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0"><span className="text-slate-300">{label}</span><span className={complete ? 'text-emerald-400' : 'text-amber-400'}>{complete ? 'Ready' : 'Action needed'}</span></Link>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold text-slate-100 mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {['/provider/requests', '/provider/quotes', '/provider/bookings', '/provider/notifications'].map((href) => <Link key={href} to={href} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-blue-500/40">{href.split('/').pop().replace('-', ' ')}</Link>)}
          </div>
        </Card>
      </div>
    </ProviderShell>
  );
};

export const ProviderProfilePage = () => {
  const { user, providerProfile, loading } = useProviderData();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (user && providerProfile) setForm({ name: user.name || '', phone: user.phone || '', businessName: providerProfile.businessName || '', bio: providerProfile.bio || '', skillTags: (providerProfile.skillTags || []).join(', '), serviceAreaRadiusKm: providerProfile.serviceAreaRadiusKm || 25, hourlyRate: providerProfile.hourlyRate || 45, experienceYears: providerProfile.experienceYears || 0, street: user.address?.street || '', city: user.address?.city || '', zipCode: user.address?.zipCode || '' });
  }, [user, providerProfile]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    await api.put('/providers/me', { name: form.name, phone: form.phone, address: { street: form.street, city: form.city, zipCode: form.zipCode }, providerProfile: { businessName: form.businessName, bio: form.bio, skillTags: form.skillTags.split(',').map((tag) => tag.trim()).filter(Boolean), serviceAreaRadiusKm: Number(form.serviceAreaRadiusKm), hourlyRate: Number(form.hourlyRate), experienceYears: Number(form.experienceYears) } });
    setMessage('Profile saved successfully.');
  };
  const field = (label, key, type = 'text') => <label className="space-y-1 text-xs text-slate-300"><span>{label}</span><input type={type} value={form?.[key] || ''} onChange={(event) => update(key, event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100" /></label>;
  return <ProviderShell eyebrow="Provider profile" title="Build trust before the first visit" description="Keep your public expertise, coverage, and contact details current.">{loading || !form ? <div className="h-96 rounded-2xl bg-slate-900 animate-pulse" /> : <form onSubmit={save} className="space-y-6">{message && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-sm">{message}</div>}<Card><div className="grid md:grid-cols-2 gap-4">{field('Your name', 'name')}{field('Phone', 'phone', 'tel')}{field('Business name', 'businessName')}{field('Hourly rate', 'hourlyRate', 'number')}{field('Experience (years)', 'experienceYears', 'number')}{field('Service radius (km)', 'serviceAreaRadiusKm', 'number')}{field('Street', 'street')}{field('City', 'city')}{field('ZIP code', 'zipCode')}</div><label className="block space-y-1 text-xs text-slate-300 mt-4"><span>Skills and specialties</span><input value={form.skillTags} onChange={(event) => update('skillTags', event.target.value)} placeholder="Plumbing, leak detection, fixture repair" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100" /></label><label className="block space-y-1 text-xs text-slate-300 mt-4"><span>About your work</span><textarea rows={5} value={form.bio} onChange={(event) => update('bio', event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100" /></label></Card><Button type="submit" icon={Save}>Save profile</Button></form>}</ProviderShell>;
};

export const ProviderVerificationPage = () => {
  const { providerProfile, loading } = useProviderData();
  return <ProviderShell eyebrow="Trust & verification" title="Verification status" description="Verification protects customers and unlocks higher-confidence matching.">{loading ? <div className="h-48 rounded-2xl bg-slate-900 animate-pulse" /> : <Card><div className="flex items-start gap-4"><ShieldCheck className="w-10 h-10 text-emerald-300" /><div><Badge variant={providerProfile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{providerProfile?.verificationStatus}</Badge><h2 className="text-xl font-bold text-slate-100 mt-3">{providerProfile?.verificationStatus === 'VERIFIED' ? 'Your profile is verified' : 'Review in progress'}</h2><p className="text-sm text-slate-400 mt-2">CareConnect operations reviews provider identity and service information before approving marketplace access. Keep your profile complete while your review is pending.</p><Link to="/provider/profile" className="inline-flex mt-5"><Button variant="secondary" icon={UserRound}>Review profile</Button></Link></div></div></Card>}</ProviderShell>;
};

export const ProviderQuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  useEffect(() => { api.get('/quotes/mine').then((response) => setQuotes(response.data.data || [])); }, []);
  return <ProviderShell eyebrow="Quote desk" title="Your submitted quotes" description="Track every proposal and jump back into matching requests when you need to adjust your pipeline."><div className="space-y-3">{quotes.length === 0 ? <Card className="text-center text-sm text-slate-500">No quotes submitted yet. <Link className="text-blue-300" to="/provider/requests">Browse matching requests</Link>.</Card> : quotes.map((quote) => <Card key={quote._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Badge variant={quote.status === 'SUBMITTED' ? 'info' : 'neutral'}>{statusLabel(quote.status)}</Badge><span className="text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</span></div><h3 className="font-bold text-slate-100 mt-2">{quote.requestId?.title || 'Service request'}</h3><p className="text-xs text-slate-400 mt-1">{quote.notes || 'No additional notes'}</p></div><span className="text-xl font-bold text-emerald-300">{money(quote.amount)}</span></Card>)}</div></ProviderShell>;
};

export const ProviderBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  useEffect(() => { api.get('/bookings').then((response) => setBookings(response.data.data || [])); }, []);
  return <ProviderShell eyebrow="Booking board" title="Manage your bookings" description="See scheduled work, customer context, and the next action for each job."><div className="space-y-3">{bookings.length === 0 ? <Card className="text-center text-sm text-slate-500">No bookings assigned yet.</Card> : bookings.map((booking) => <Link key={booking._id} to={`/provider/jobs/${booking._id}`}><Card className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><Badge variant={booking.status === 'COMPLETED' ? 'success' : 'info'}>{statusLabel(booking.status)}</Badge><h3 className="font-bold text-slate-100 mt-2">{booking.requestId?.title || 'Service job'}</h3><p className="text-xs text-slate-400 mt-1">{booking.customerId?.name} · {new Date(booking.scheduledStart).toLocaleString()}</p></div><div className="text-right"><p className="font-bold text-emerald-300">{money(booking.totalAmount)}</p><p className="text-xs text-slate-500">View job <ArrowRight className="inline w-3 h-3" /></p></div></Card></Link>)}</div></ProviderShell>;
};

export const ProviderJobPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => { api.get(`/bookings/${id}`).then((response) => { setJob(response.data.data); setStatus(response.data.data.status); }); }, [id]);
  const saveStatus = async () => { await api.patch(`/bookings/${id}/status`, { status }); const response = await api.get(`/bookings/${id}`); setJob(response.data.data); };
  const createInvoice = async () => { await api.post('/invoices', { bookingId: id }); };
  if (!job) return <ProviderShell eyebrow="Job detail" title="Loading job" description=""><div className="h-48 rounded-2xl bg-slate-900 animate-pulse" /></ProviderShell>;
  return <ProviderShell eyebrow="Job detail" title={job.requestId?.title || 'Service job'} description="Update the job lifecycle and keep the customer informed."><div className="grid lg:grid-cols-[1.4fr_1fr] gap-6"><Card><Badge variant="info">{statusLabel(job.status)}</Badge><h2 className="text-xl font-bold text-slate-100 mt-3">Customer: {job.customerId?.name}</h2><p className="text-sm text-slate-400 mt-2"><MapPin className="inline w-4 h-4 mr-1" />{job.customerId?.address?.street}, {job.customerId?.address?.city}</p><p className="text-sm text-slate-400 mt-2">Scheduled: {new Date(job.scheduledStart).toLocaleString()}</p></Card><Card><label className="block text-xs text-slate-300 mb-2">Next status</label><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100"><option value="PROVIDER_ON_THE_WAY">Provider on the way</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select><Button onClick={saveStatus} className="w-full mt-4" icon={CheckCircle2}>Update job status</Button>{['COMPLETED', 'CUSTOMER_CONFIRMED'].includes(job.status) && <Button onClick={createInvoice} variant="secondary" className="w-full mt-2" icon={FileText}>Create invoice</Button>}<Link to="/provider/jobs" className="text-xs text-blue-300 block text-center mt-4">Open evidence and job tools</Link></Card></div></ProviderShell>;
};

export const ProviderInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => { api.get('/invoices').then((response) => setInvoices(response.data.data || [])); }, []);
  return <ProviderShell eyebrow="Finance" title="Invoices and earnings" description="Review generated invoices linked to your completed work."><div className="space-y-3">{invoices.length === 0 ? <Card className="text-center text-sm text-slate-500">Invoices appear after a completed job.</Card> : invoices.map((invoice) => <Card key={invoice._id} className="flex items-center justify-between"><div><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-300" /><span className="font-bold text-slate-100">{invoice.invoiceNumber || invoice._id.slice(-8)}</span><Badge variant="neutral">{statusLabel(invoice.paymentStatus)}</Badge></div><p className="text-xs text-slate-500 mt-2">{invoice.customerId?.name} · {new Date(invoice.createdAt).toLocaleDateString()}</p></div><span className="text-lg font-bold text-emerald-300">{money(invoice.totalAmount)}</span></Card>)}</div></ProviderShell>;
};

export const ProviderReviewsPage = () => {
  const { providerProfile } = useProviderData();
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api.get('/providers/me/reviews').then((response) => setReviews(response.data.data || [])); }, []);
  return <ProviderShell eyebrow="Customer voice" title="Your reviews" description="Use customer feedback to understand what is working and where to improve."><Card className="flex items-center gap-4"><Star className="w-8 h-8 text-amber-300 fill-amber-300" /><div><p className="text-2xl font-bold text-slate-100">{providerProfile?.ratingAverage || 0}/5</p><p className="text-xs text-slate-500">{providerProfile?.ratingCount || 0} reviews</p></div></Card><div className="space-y-3">{reviews.length === 0 ? <Card className="text-center text-sm text-slate-500">No customer reviews yet.</Card> : reviews.map((review) => <Card key={review._id}><div className="flex justify-between"><span className="font-semibold text-slate-200">{review.customerId?.name || 'Customer'}</span><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="text-sm text-slate-400 mt-3">{review.comment || 'No written feedback.'}</p></Card>)}</div></ProviderShell>;
};

export const ProviderNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => { api.get('/notifications').then((response) => setNotifications(response.data.data || [])); }, []);
  return <ProviderShell eyebrow="Inbox" title="Provider notifications" description="Stay current on matches, bookings, reviews, and payment events."><div className="space-y-3">{notifications.length === 0 ? <Card className="text-center text-sm text-slate-500">You are all caught up.</Card> : notifications.map((notification) => <Card key={notification._id} className={!notification.read ? 'border-blue-500/40' : ''}><div className="flex items-start gap-3"><BellDot className="w-5 h-5 text-blue-300 mt-0.5" /><div><p className="font-semibold text-slate-100">{notification.title}</p><p className="text-sm text-slate-400 mt-1">{notification.message}</p><p className="text-[11px] text-slate-600 mt-2">{new Date(notification.createdAt).toLocaleString()}</p></div></div></Card>)}</div></ProviderShell>;
};

const BellDot = ({ className }) => <span className={className}><span className="block w-3 h-3 rounded-full bg-current mt-1" /></span>;