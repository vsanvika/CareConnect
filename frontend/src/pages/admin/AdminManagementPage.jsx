import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, DollarSign, FileText, FolderKanban, LayoutDashboard, ListFilter, Search, ShieldCheck, Tags, UserCheck, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/providers', label: 'Providers', icon: UserCheck },
  { path: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { path: '/admin/categories', label: 'Categories', icon: FolderKanban },
  { path: '/admin/skills', label: 'Skills', icon: Tags },
  { path: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { path: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { path: '/admin/disputes', label: 'Disputes', icon: Activity },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/audit-logs', label: 'Audit logs', icon: FileText }
];

const titleBySection = {
  dashboard: ['Platform dashboard', 'A real-time view of CareConnect operations.'],
  users: ['User management', 'Search accounts and control platform access.'],
  providers: ['Provider management', 'Review provider status, ratings, and account access.'],
  verification: ['Provider verification', 'Approve or reject provider profiles awaiting review.'],
  categories: ['Service categories', 'Manage service domains and their active state.'],
  skills: ['Skill library', 'Maintain the skill vocabulary used by matching.'],
  pricing: ['Pricing policies', 'Manage category base prices used by the marketplace.'],
  bookings: ['Booking monitor', 'Inspect booking status and participant activity.'],
  disputes: ['Dispute monitor', 'Track support and escalated dispute cases.'],
  analytics: ['Platform analytics', 'Inspect booking, revenue, and dispute trends.'],
  'audit-logs': ['Audit logs', 'Review privileged platform actions.']
};

const sectionFromPath = (pathname) => pathname.split('/')[2] || 'dashboard';
const statusVariant = (status) => ['VERIFIED', 'COMPLETED', 'CUSTOMER_CONFIRMED', 'RESOLVED', 'PAID', 'ACTIVE'].includes(status) ? 'success' : ['REJECTED', 'CANCELLED', 'DISPUTED'].includes(status) ? 'danger' : ['PENDING', 'OPEN', 'UNDER_REVIEW', 'ESCALATED', 'IN_PROGRESS'].includes(status) ? 'warning' : 'neutral';

export const AdminManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(location.pathname);
  const [data, setData] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [auditUser, setAuditUser] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', basePrice: '' });
  const [skillForm, setSkillForm] = useState({ name: '', category: '', description: '' });
  const [confirmation, setConfirmation] = useState(null);

  const heading = titleBySection[section] || titleBySection.dashboard;
  const currentNav = useMemo(() => navItems.find((item) => item.path.endsWith(`/${section}`)), [section]);

  const load = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      if (section === 'dashboard') {
        const response = await api.get('/admin/dashboard');
        setDashboard(response.data.data);
      } else if (section === 'analytics') {
        const response = await api.get('/admin/analytics');
        setAnalytics(response.data.data);
      } else {
        const endpoint = section === 'verification' ? 'providers' : section;
        const response = await api.get(`/admin/${endpoint}`, { params: { page, search, status, entityType: section === 'audit-logs' ? auditEntity : undefined, user: section === 'audit-logs' ? auditUser : undefined, date: section === 'audit-logs' ? auditDate : undefined } });
        setData(response.data.data || []);
        setPagination({ page: response.data.page || 1, pages: response.data.pages || 1, total: response.data.total ?? response.data.count ?? 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
    load(1);
  }, [section, search, status, auditEntity, auditUser, auditDate]);

  const mutate = async (method, endpoint, body) => {
    try {
      await api[method](endpoint, body);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Admin action failed.');
    }
  };

  const requestMutation = (message, method, endpoint, body) => setConfirmation({ message, method, endpoint, body });

  const confirmMutation = async () => {
    const action = confirmation;
    setConfirmation(null);
    await mutate(action.method, action.endpoint, action.body);
  };

  const createCategory = async (event) => {
    event.preventDefault();
    await mutate('post', '/admin/categories', { ...categoryForm, basePrice: Number(categoryForm.basePrice) });
    setCategoryForm({ name: '', description: '', basePrice: '' });
  };

  const createSkill = async (event) => {
    event.preventDefault();
    await mutate('post', '/admin/skills', skillForm);
    setSkillForm({ name: '', category: '', description: '' });
  };

  const renderDashboard = () => {
    const stats = [
      ['Total users', dashboard?.totalUsers, Users, 'text-blue-300'],
      ['Total providers', dashboard?.totalProviders, UserCheck, 'text-emerald-300'],
      ['Verified providers', dashboard?.verifiedProviders, ShieldCheck, 'text-cyan-300'],
      ['Active bookings', dashboard?.activeBookings, Activity, 'text-amber-300'],
      ['Completed jobs', dashboard?.completedJobs, CheckCircle2, 'text-emerald-300'],
      ['Revenue', `₹${Number(dashboard?.revenue || 0).toFixed(2)}`, DollarSign, 'text-green-300'],
      ['Open disputes', dashboard?.openDisputes, Activity, 'text-rose-300'],
      ['Average rating', `${Number(dashboard?.averageRating || 0).toFixed(1)} / 5`, ShieldCheck, 'text-amber-300']
    ];
    return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{stats.map(([label, value, Icon, color]) => <Card key={label} className="flex items-center gap-3"><Icon className={`w-5 h-5 ${color}`} /><div><span className="text-[10px] uppercase font-bold text-slate-500 block">{label}</span><strong className="text-xl text-slate-100">{value ?? '-'}</strong></div></Card>)}</div>;
  };

  const renderTable = () => {
    if (section === 'users') return <Table headers={['User', 'Role', 'Status', 'Actions']} rows={data.map((user) => [<div><strong>{user.name}</strong><span className="block text-xs text-slate-500">{user.email}</span></div>, user.role, <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>, <Button size="sm" variant="outline" onClick={() => requestMutation(`${user.isActive ? 'Deactivate' : 'Activate'} ${user.email}?`, 'patch', `/admin/users/${user._id}/status`, { isActive: !user.isActive })}>{user.isActive ? 'Deactivate' : 'Activate'}</Button>])} />;
    if (section === 'providers' || section === 'verification') return <Table headers={['Provider', 'Verification', 'Rating', 'Account', 'Actions']} rows={data.map((entry) => { const user = entry.user || entry; const profile = entry.profile || {}; return [<div><strong>{user.name}</strong><span className="block text-xs text-slate-500">{user.email}</span></div>, <Badge variant={statusVariant(profile.verificationStatus)}>{profile.verificationStatus || 'PENDING'}</Badge>, `${Number(profile.ratingAverage || 0).toFixed(1)} (${profile.ratingCount || 0})`, <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'ACTIVE' : 'SUSPENDED'}</Badge>, <div className="flex flex-wrap gap-1">{profile.verificationStatus !== 'VERIFIED' && <Button size="sm" onClick={() => requestMutation(`Verify ${user.email}?`, 'patch', `/admin/providers/${user._id}/verify`, {})}>Verify</Button>}{profile.verificationStatus !== 'REJECTED' && <Button size="sm" variant="outline" onClick={() => requestMutation(`Reject ${user.email}?`, 'patch', `/admin/providers/${user._id}/reject`, {})}>Reject</Button>}<Button size="sm" variant="danger" onClick={() => requestMutation(`Suspend ${user.email}?`, 'patch', `/admin/providers/${user._id}/suspend`, {})}>Suspend</Button></div>]; })} />;
    if (section === 'categories' || section === 'pricing') return <Table headers={['Category', 'Description', 'Base price', 'Status', 'Actions']} rows={data.map((category) => [<strong>{category.name}</strong>, category.description, <span>₹{category.basePrice}</span>, <Badge variant={category.isActive ? 'success' : 'neutral'}>{category.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>, <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { const price = window.prompt('New base price', category.basePrice); if (price !== null) requestMutation('Update this pricing policy?', 'patch', `/admin/pricing/${category._id}`, { basePrice: Number(price) }); }}>Edit price</Button><Button size="sm" variant="danger" onClick={() => requestMutation(`Deactivate ${category.name}?`, 'delete', `/admin/categories/${category._id}`, null)}>Deactivate</Button></div>])} />;
    if (section === 'skills') return <Table headers={['Skill', 'Category', 'Description', 'Status', 'Actions']} rows={data.map((skill) => [<strong>{skill.name}</strong>, skill.category?.name, skill.description, <Badge variant={skill.isActive ? 'success' : 'neutral'}>{skill.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>, <Button size="sm" variant="danger" onClick={() => requestMutation(`Deactivate ${skill.name}?`, 'delete', `/admin/skills/${skill._id}`, null)}>Deactivate</Button>])} />;
    if (section === 'bookings') return <Table headers={['Booking', 'Customer', 'Provider', 'Status', 'Schedule']} rows={data.map((booking) => [booking.requestId?.title || booking._id.slice(-6), booking.customerId?.email, booking.providerId?.email, <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>, new Date(booking.scheduledStart).toLocaleString()])} />;
    if (section === 'disputes') return <Table headers={['Dispute', 'Reason', 'Status', 'Opened by', 'Created', 'Actions']} rows={data.map((dispute) => [dispute._id.slice(-8), dispute.reason, <Badge variant={statusVariant(dispute.status)}>{dispute.status}</Badge>, dispute.openedBy?.email, new Date(dispute.createdAt).toLocaleString(), <div className="flex flex-wrap gap-1">{['OPEN', 'OPENED', 'UNDER_REVIEW', 'ESCALATED'].includes(dispute.status) && <><Button size="sm" variant="outline" onClick={() => requestMutation('Assign this dispute to the admin review queue?', 'patch', `/disputes/${dispute._id}/assign`, {})}>Assign</Button><Button size="sm" variant="danger" onClick={() => requestMutation('Reject this dispute?', 'post', `/disputes/${dispute._id}/reject`, { notes: 'Rejected by platform administrator.' })}>Reject</Button></>}</div>])} />;
    if (section === 'audit-logs') return <Table headers={['Action', 'Actor', 'Entity', 'Previous', 'New state', 'Time', 'Metadata']} rows={data.map((log) => [log.action, log.actorId?.email || 'System', `${log.entityType || log.targetCollection || ''} ${log.entityId || log.targetId || ''}`, JSON.stringify(log.previousState || {}), JSON.stringify(log.newState || {}), new Date(log.createdAt).toLocaleString(), JSON.stringify(log.metadata || log.details || {})])} />;
    return null;
  };

  return (
    <div className="max-w-[1500px] mx-auto py-6 px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <Card className="lg:sticky lg:top-24 p-2 space-y-1">
            <div className="px-3 py-3 border-b border-slate-800 mb-1"><span className="text-[10px] uppercase font-bold text-blue-400">Platform admin</span><h2 className="text-sm font-bold text-slate-100 mt-1">Control center</h2></div>
            {navItems.map((item) => { const Icon = item.icon; return <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left ${location.pathname === item.path ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}><Icon className="w-4 h-4" />{item.label}</button>; })}
          </Card>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div><Badge variant="purple" className="mb-1">{currentNav?.label || 'Admin'}</Badge><h1 className="text-3xl font-bold text-slate-100">{heading[0]}</h1><p className="text-sm text-slate-400 mt-1">{heading[1]}</p></div>
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">{error}</div>}
          {loading ? <Card className="h-48 animate-pulse" /> : section === 'dashboard' ? renderDashboard() : section === 'analytics' ? <Analytics data={analytics} /> : <>
            {(section !== 'categories' && section !== 'skills' && section !== 'pricing') || <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(section === 'categories' || section === 'pricing') && <Card><h3 className="font-bold text-slate-200 mb-3">Add category</h3><form onSubmit={createCategory} className="flex flex-wrap gap-2"><input required placeholder="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="input" /><input required placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="input" /><input required type="number" placeholder="Base price" value={categoryForm.basePrice} onChange={(e) => setCategoryForm({ ...categoryForm, basePrice: e.target.value })} className="input w-28" /><Button type="submit" size="sm">Add</Button></form></Card>}{section === 'skills' && <Card><h3 className="font-bold text-slate-200 mb-3">Add skill</h3><form onSubmit={createSkill} className="flex flex-wrap gap-2"><input required placeholder="Skill name" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} className="input" /><input required placeholder="Category ID" value={skillForm.category} onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })} className="input" /><Button type="submit" size="sm">Add</Button></form></Card>}</div>}
            <Card className="p-0 overflow-hidden"><div className="flex flex-wrap gap-3 p-4 border-b border-slate-800"><div className="relative flex-1 min-w-[180px]"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"><option value="">All statuses</option><option value="PENDING">PENDING</option><option value="VERIFIED">VERIFIED</option><option value="OPEN">OPEN</option><option value="UNDER_REVIEW">UNDER_REVIEW</option><option value="ESCALATED">ESCALATED</option><option value="COMPLETED">COMPLETED</option></select>{section === 'audit-logs' && <><input value={auditEntity} onChange={(e) => setAuditEntity(e.target.value)} placeholder="Entity type" className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" /><input value={auditUser} onChange={(e) => setAuditUser(e.target.value)} placeholder="Actor user ID" className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" /><input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" /></>}<ListFilter className="w-4 h-4 text-slate-500 mt-2.5" /></div>{renderTable()}<div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-500"><span>{pagination.total} records</span><div className="flex items-center gap-2"><button disabled={pagination.page <= 1} onClick={() => { setPagination({ ...pagination, page: pagination.page - 1 }); load(pagination.page - 1); }} className="p-1.5 rounded border border-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><span>{pagination.page} / {pagination.pages}</span><button disabled={pagination.page >= pagination.pages} onClick={() => { setPagination({ ...pagination, page: pagination.page + 1 }); load(pagination.page + 1); }} className="p-1.5 rounded border border-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div></div></Card>
          </>}
        </main>
      </div>
      <Modal isOpen={Boolean(confirmation)} onClose={() => setConfirmation(null)} title="Confirm admin action">
        <p className="text-sm text-slate-300">{confirmation?.message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setConfirmation(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmMutation}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

const Table = ({ headers, rows }) => <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-bold whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-800/80">{rows.length ? rows.map((row, index) => <tr key={index} className="hover:bg-slate-900/50"><>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-slate-300 align-middle max-w-xs">{cell}</td>)}</></tr>) : <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-slate-500">No records found.</td></tr>}</tbody></table></div>;

const Analytics = ({ data }) => <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card><span className="text-[10px] uppercase text-slate-500 font-bold">Revenue</span><strong className="text-2xl text-emerald-300 block mt-2">₹{Number(data?.revenue?.revenue || 0).toFixed(2)}</strong><span className="text-xs text-slate-500">Fees: ₹{Number(data?.revenue?.fees || 0).toFixed(2)}</span></Card><Card><span className="text-[10px] uppercase text-slate-500 font-bold">Booking statuses</span><div className="mt-3 space-y-2">{data?.bookingsByStatus?.map((item) => <div key={item._id} className="flex justify-between text-xs"><span>{item._id}</span><strong>{item.count}</strong></div>)}</div></Card><Card><span className="text-[10px] uppercase text-slate-500 font-bold">Dispute statuses</span><div className="mt-3 space-y-2">{data?.disputesByStatus?.map((item) => <div key={item._id} className="flex justify-between text-xs"><span>{item._id}</span><strong>{item.count}</strong></div>)}</div></Card></div>;
