import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, ArrowRight, FileText } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const CustomerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, bookRes] = await Promise.all([
          api.get('/requests'),
          api.get('/bookings')
        ]);
        setRequests(reqRes.data.data || []);
        setBookings(bookRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'QUOTING': return <Badge variant="info">Collecting Quotes</Badge>;
      case 'BOOKED': return <Badge variant="purple">Booked & Confirmed</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">In Progress</Badge>;
      case 'PROVIDER_ON_THE_WAY': return <Badge variant="info">Provider On The Way</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'DISPUTED': return <Badge variant="danger">Disputed</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Customer Service Portal</h1>
          <p className="text-xs text-slate-400">Track your requests, compare provider quotes, and inspect job evidence.</p>
        </div>
        <Link to="/customer/request/new">
          <Button icon={Sparkles}>New Service Request</Button>
        </Link>
      </div>

      {/* Active Bookings Banner */}
      {bookings.filter(b => ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span> Active Bookings in Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.filter(b => ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)).map(b => (
              <Card key={b._id} className="border-blue-500/30 bg-blue-950/20 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(b.status)}
                    <span className="text-xs font-extrabold text-emerald-400">₹{b.totalAmount}</span>
                  </div>
                  <h3 className="font-bold text-slate-100">{b.requestId?.title || 'Service Job'}</h3>
                  <p className="text-xs text-slate-400">Assigned Provider: {b.providerId?.name || 'Technician'}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
                  <Link to={`/customer/bookings/${b._id}`}>
                    <Button variant="outline" size="sm" icon={ArrowRight}>Track Job & Evidence</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Service Requests List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200">My Service Requests ({requests.length})</h2>

        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl glass-panel animate-pulse"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center py-12 space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No service requests found.</p>
            <Link to="/customer/request/new">
              <Button size="sm" icon={Sparkles}>Create Your First Request</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <Card key={req._id} className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(req.status)}
                    <span className="text-[11px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-100">{req.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{req.description}</p>
                  </div>

                  {req.aiAnalysis && (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] flex flex-wrap gap-2 items-center text-slate-300">
                      <span className="text-blue-400 font-bold">AI Classified:</span> {req.aiAnalysis.classifiedCategoryName}
                      <span className="text-slate-600">|</span>
                      <span className="text-emerald-400 font-bold">Est:</span> ₹{req.aiAnalysis.estimatedCostRange?.min}-₹{req.aiAnalysis.estimatedCostRange?.max}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {req.eligibleProviders?.length || 0} Matched Providers
                  </span>
                  <Link to={`/customer/request/${req._id}`}>
                    <Button variant="secondary" size="sm" icon={ArrowRight}>View Quotes & Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
