import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, MapPin, RefreshCw, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';

const navItems = [
  ['/operations/dashboard', 'Dashboard', BarChart3],
  ['/operations/bookings', 'Bookings', CalendarDays],
  ['/operations/jobs', 'Active jobs', BriefcaseBusiness],
  ['/operations/providers', 'Providers', Users],
  ['/operations/escalations', 'Escalations', AlertTriangle]
];

const pageFromPath = (pathname) => pathname.split('/')[2] || 'dashboard';
const statusVariant = (status) => ['COMPLETED', 'CUSTOMER_CONFIRMED', 'VERIFIED'].includes(status) ? 'success' : ['DISPUTED', 'CANCELLED', 'REJECTED'].includes(status) ? 'danger' : ['IN_PROGRESS', 'PROVIDER_ON_THE_WAY', 'ESCALATED', 'PENDING'].includes(status) ? 'warning' : 'info';
const closedStates = ['COMPLETED', 'CUSTOMER_CONFIRMED', 'CANCELLED', 'DISPUTED'];

export const OperationsManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const current = pageFromPath(location.pathname);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      if (current === 'dashboard') {
        const response = await api.get('/operations/dashboard');
        setStats(response.data.data);
      } else if (current === 'providers') {
        const response = await api.get('/operations/providers');
        setProviders(response.data.data || []);
      } else if (current === 'escalations') {
        const response = await api.get('/operations/escalations');
        setRecords(response.data.data || []);
      } else {
        const [bookingResponse, providerResponse] = await Promise.all([
          api.get(`/operations/${current}`, { params: { status, delayed: current === 'jobs' ? 'true' : undefined, page, limit: 15 } }),
          api.get('/operations/providers')
        ]);
        setRecords(bookingResponse.data.data || []);
        setPagination({ page: bookingResponse.data.page || page, pages: bookingResponse.data.pages || 1, total: bookingResponse.data.total || 0 });
        setProviders(providerResponse.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [current, status]);

  const requestAssignment = (bookingId, providerId, providerName) => setConfirmation({ bookingId, providerId, providerName });
  const confirmAssignment = async () => {
    const action = confirmation;
    setConfirmation(null);
    try {
      await api.patch(`/operations/bookings/${action.bookingId}/assign`, { providerId: action.providerId });
      await load(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Provider assignment failed.');
    }
  };

  const titles = {
    dashboard: ['Operations dashboard', 'A live dispatch view of service delivery, capacity, and risk.'],
    bookings: ['Booking monitor', 'Assign or reassign providers across scheduled work.'],
    jobs: ['Active and delayed jobs', 'Prioritize work that is in progress or past its scheduled end.'],
    providers: ['Provider operations', 'Review verification, skills, coverage, and current availability.'],
    escalations: ['Escalated cases', 'Surface cases that need operations-level intervention.']
  };

  return (
    <div className="max-w-[1450px] mx-auto py-6 px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <Card className="lg:sticky lg:top-24 p-2 space-y-1">
            <div className="px-3 py-3 border-b border-slate-800 mb-1"><span className="text-[10px] uppercase font-bold text-amber-400">Operations</span><h2 className="text-sm font-bold text-slate-100 mt-1">Dispatch control</h2></div>
            {navItems.map(([path, label, Icon]) => <button key={path} onClick={() => navigate(path)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left ${location.pathname === path ? 'bg-amber-500/15 text-amber-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon className="w-4 h-4" />{label}</button>)}
          </Card>
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          <div><Badge variant="warning" className="mb-1">Operations manager</Badge><h1 className="text-3xl font-bold text-slate-100">{titles[current]?.[0] || titles.dashboard[0]}</h1><p className="text-sm text-slate-400 mt-1">{titles[current]?.[1] || titles.dashboard[1]}</p></div>
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">{error}</div>}
          {loading ? <Card className="h-48 animate-pulse" /> : current === 'dashboard' ? <Stats stats={stats} /> : current === 'providers' ? <ProviderTable providers={providers} /> : current === 'escalations' ? <EscalationTable records={records} navigate={navigate} /> : <BookingTable records={records} providers={providers} onAssign={requestAssignment} status={status} setStatus={setStatus} current={current} pagination={pagination} onPageChange={load} />}
        </main>
      </div>
      <Modal isOpen={Boolean(confirmation)} onClose={() => setConfirmation(null)} title="Confirm provider assignment">
        <p className="text-sm text-slate-300">Assign {confirmation?.providerName} to this booking? Eligibility and schedule checks will run before the assignment is saved.</p>
        <div className="flex justify-end gap-2 mt-6"><Button variant="secondary" onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="accent" onClick={confirmAssignment}>Assign provider</Button></div>
      </Modal>
    </div>
  );
};

const Stats = ({ stats }) => {
  const entries = [["Today's bookings", stats?.todaysBookings, CalendarDays, 'text-blue-300'], ['Active jobs', stats?.activeJobs, Activity, 'text-emerald-300'], ['Delayed jobs', stats?.delayedJobs, AlertTriangle, 'text-rose-300'], ['Pending assignments', stats?.pendingAssignments, Users, 'text-amber-300'], ['Escalated cases', stats?.escalatedCases, AlertTriangle, 'text-purple-300'], ['Completed jobs', stats?.completedJobs, CheckCircle2, 'text-green-300']];
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{entries.map(([label, value, Icon, color]) => <Card key={label} className="flex items-center gap-3"><Icon className={`w-5 h-5 ${color}`} /><div><span className="text-[10px] uppercase font-bold text-slate-500 block">{label}</span><strong className="text-2xl text-slate-100">{value ?? 0}</strong></div></Card>)}</div>;
};

const BookingTable = ({ records, providers, onAssign, status, setStatus, current, pagination, onPageChange }) => <Card className="p-0 overflow-hidden"><div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-800"><div><span className="text-sm font-bold text-slate-200 block">{current === 'jobs' ? 'Delayed work queue' : 'Scheduled bookings'}</span><span className="text-xs text-slate-500">{pagination.total} records</span></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="ml-auto bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"><option value="">All statuses</option><option value="PENDING">PENDING</option><option value="CONFIRMED">CONFIRMED</option><option value="PROVIDER_ON_THE_WAY">PROVIDER_ON_THE_WAY</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option></select><button onClick={() => onPageChange(pagination.page)} className="p-2 rounded-lg border border-slate-800 text-slate-400" title="Refresh"><RefreshCw className="w-4 h-4" /></button></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900"><tr>{['Job', 'Customer', 'Provider', 'Schedule', 'Status', 'Assignment'].map((header) => <th key={header} className="px-4 py-3 whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{records.length ? records.map((record) => <BookingRow key={record._id} record={record} providers={providers} onAssign={onAssign} />) : <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No bookings match this queue.</td></tr>}</tbody></table></div><div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-500"><span>Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="p-1.5 rounded border border-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="p-1.5 rounded border border-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div></div></Card>;
const BookingRow = ({ record, providers, onAssign }) => {
  const [providerId, setProviderId] = useState(record.providerId?._id || '');
  const assignable = !closedStates.includes(record.status);
  const eligibleProviders = providers.filter(({ user, profile }) => user.isVerified && profile?.verificationStatus === 'VERIFIED');
  return <tr className="hover:bg-slate-900/50"><td className="px-4 py-4 text-slate-200 font-semibold">{record.requestId?.title || record._id.slice(-6)}</td><td className="px-4 py-4 text-slate-400">{record.customerId?.name || record.customerId?.email}</td><td className="px-4 py-4 text-slate-400">{record.providerId?.name || 'Unassigned'}</td><td className="px-4 py-4 text-slate-400 whitespace-nowrap">{new Date(record.scheduledStart).toLocaleString()}</td><td className="px-4 py-4"><Badge variant={statusVariant(record.status)}>{record.status}</Badge></td><td className="px-4 py-4">{assignable ? <div className="flex items-center gap-2 min-w-64"><select value={providerId} onChange={(event) => setProviderId(event.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"><option value="">Select provider</option>{eligibleProviders.map(({ user, profile }) => <option key={user._id} value={user._id}>{user.name} - {profile.isAvailableNow ? 'Available' : 'Busy'}</option>)}</select><Button size="sm" disabled={!providerId} onClick={() => onAssign(record._id, providerId, eligibleProviders.find(({ user }) => user._id === providerId)?.user.name || 'selected provider')}>{record.providerId ? 'Reassign' : 'Assign'}</Button></div> : <span className="text-slate-500">Closed</span>}</td></tr>;
};

const ProviderTable = ({ providers }) => <Card className="p-0 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900"><tr>{['Provider', 'Verification', 'Skills', 'Rating', 'Coverage', 'Availability'].map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{providers.length ? providers.map((provider) => <tr key={provider.user._id}><td className="px-4 py-4"><strong className="text-slate-200">{provider.user.name}</strong><span className="block text-slate-500">{provider.user.email}</span></td><td className="px-4 py-4"><Badge variant={statusVariant(provider.profile?.verificationStatus)}>{provider.profile?.verificationStatus || 'PENDING'}</Badge></td><td className="px-4 py-4 text-slate-400">{provider.profile?.skillTags?.join(', ') || 'No skills listed'}</td><td className="px-4 py-4 text-amber-300">{Number(provider.profile?.ratingAverage || 0).toFixed(1)} ({provider.profile?.ratingCount || 0})</td><td className="px-4 py-4 text-slate-400"><MapPin className="w-3 h-3 inline mr-1" />{provider.profile?.serviceAreaRadiusKm || 0} km</td><td className="px-4 py-4"><Badge variant={provider.profile?.isAvailableNow ? 'success' : 'neutral'}>{provider.profile?.isAvailableNow ? 'AVAILABLE' : 'BUSY'}</Badge></td></tr>) : <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No providers found.</td></tr>}</tbody></table></div></Card>;

const EscalationTable = ({ records, navigate }) => <Card className="space-y-3">{records.length ? records.map((record) => <div key={record._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Badge variant="danger">ESCALATED</Badge><strong className="text-slate-200">{record.reason}</strong></div><p className="text-xs text-slate-400 mt-2">{record.description}</p><span className="text-[10px] text-slate-500">{record.openedBy?.email} · {new Date(record.updatedAt).toLocaleString()}</span></div><Button size="sm" variant="outline" onClick={() => navigate('/support/dashboard')}>Open support case</Button></div>) : <p className="text-center py-12 text-sm text-slate-500">No escalated cases.</p>}</Card>;
