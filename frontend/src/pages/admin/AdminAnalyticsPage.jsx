import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, DollarSign, Users, Shield, TrendingUp } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdminAnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/overview');
      setOverview(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = [
    { month: 'Jan', revenue: 1420, commission: 142 },
    { month: 'Feb', revenue: 2150, commission: 215 },
    { month: 'Mar', revenue: 3200, commission: 320 },
    { month: 'Apr', revenue: 4100, commission: 410 },
    { month: 'May', revenue: 5600, commission: 560 },
    { month: 'Jun', revenue: overview?.totalRevenue || 6850, commission: overview?.platformCommission || 685 }
  ];

  const categoryData = [
    { name: 'Plumbing', value: 35, color: '#3b82f6' },
    { name: 'Electrical', value: 25, color: '#10b981' },
    { name: 'AC/HVAC', value: 20, color: '#f59e0b' },
    { name: 'Cleaning', value: 12, color: '#ec4899' },
    { name: 'Pest Control', value: 8, color: '#8b5cf6' }
  ];

  if (loading) return <div className="py-12 text-center text-slate-400">Loading platform analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Badge variant="purple" className="mb-1">Platform Admin Control</Badge>
        <h1 className="text-3xl font-bold text-slate-100">Financial Analytics & Platform Governance</h1>
        <p className="text-xs text-slate-400">Real-time marketplace transaction volume, commission revenue, and user metrics.</p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total GMV Revenue</span>
            <span className="text-2xl font-extrabold text-emerald-400">₹{overview?.totalRevenue?.toFixed(2) || '6,850.00'}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Platform Commission (10%)</span>
            <span className="text-2xl font-extrabold text-blue-400">₹{overview?.platformCommission?.toFixed(2) || '685.00'}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Registered Users</span>
            <span className="text-2xl font-extrabold text-slate-100">{overview?.totalUsers || 12} Users</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Providers</span>
            <span className="text-2xl font-extrabold text-amber-400">{overview?.totalProviders || 4} Verified</span>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Bar Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Platform Transaction Volume Growth
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Gross Revenue (₹)" />
                <Bar dataKey="commission" fill="#10b981" radius={[6, 6, 0, 0]} name="Platform Fee (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Share Pie Chart */}
        <Card className="space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">Service Category Distribution</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {categoryData.map(c => (
              <div key={c.name} className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                  {c.name}
                </span>
                <span className="font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
