import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { QueryFilters } from '../../components/common/QueryFilters';

export const ProviderDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ urgency: '', date: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  // Quote Submission Modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState(120);
  const [labor, setLabor] = useState(85);
  const [materials, setMaterials] = useState(25);
  const [calloutFee, setCalloutFee] = useState(10);
  const [notes, setNotes] = useState('');
  const [includedServices, setIncludedServices] = useState('');
  const [additionalChargeDescription, setAdditionalChargeDescription] = useState('');
  const [additionalChargeAmount, setAdditionalChargeAmount] = useState('');
  const [editingQuote, setEditingQuote] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, [appliedFilters]);

  const fetchOpportunities = async () => {
    try {
      const res = await api.get('/requests', { params: { ...appliedFilters, limit: 50 } });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load opportunities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = async (req) => {
    setSelectedReq(req);
    setEditingQuote(null);
    const minEst = req.aiAnalysis?.estimatedCostRange?.min || 90;
    setQuoteAmount(minEst);
    setLabor(Math.round(minEst * 0.7));
    setMaterials(Math.round(minEst * 0.2));
    setCalloutFee(Math.round(minEst * 0.1));
    setNotes('Includes diagnostic, parts guarantee, and full testing.');
    setIncludedServices('');
    setAdditionalChargeDescription('');
    setAdditionalChargeAmount('');

    try {
      const response = await api.get(`/quotes/request/${req._id}`);
      const existing = response.data.data?.[0];
      if (existing?.status === 'SUBMITTED') {
        setEditingQuote(existing);
        setQuoteAmount(existing.amount);
        setLabor(existing.breakdown?.labor || 0);
        setMaterials(existing.breakdown?.materials || 0);
        setCalloutFee(existing.breakdown?.calloutFee || 0);
        setNotes(existing.notes || '');
        setIncludedServices(existing.includedServices?.join(', ') || '');
        setAdditionalChargeDescription(existing.additionalCharges?.[0]?.description || '');
        setAdditionalChargeAmount(existing.additionalCharges?.[0]?.amount || '');
      }
    } catch (err) {
      console.error('Failed to load existing quote', err);
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        amount: Number(quoteAmount),
        breakdown: { labor: Number(labor), materials: Number(materials), calloutFee: Number(calloutFee) },
        notes,
        includedServices: includedServices.split(',').map((item) => item.trim()).filter(Boolean),
        additionalCharges: additionalChargeDescription && Number(additionalChargeAmount) > 0
          ? [{ description: additionalChargeDescription, amount: Number(additionalChargeAmount) }]
          : []
      };
      if (editingQuote) {
        await api.put(`/quotes/${editingQuote._id}`, payload);
      } else {
        await api.post('/quotes', { ...payload, requestId: selectedReq._id });
      }
      setMessage(editingQuote ? 'Quote updated successfully!' : 'Quote submitted successfully!');
      setSelectedReq(null);
      fetchOpportunities();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawQuote = async () => {
    if (!editingQuote) return;
    try {
      await api.post(`/quotes/${editingQuote._id}/withdraw`);
      setMessage('Quote withdrawn successfully.');
      setSelectedReq(null);
      fetchOpportunities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="success" className="mb-1">Verified Provider Portal</Badge>
          <h1 className="text-3xl font-bold text-slate-100">Opportunity Feed & Quoting Center</h1>
          <p className="text-xs text-slate-400">View requests where your skill tags match AI dispatcher criteria and submit competitive quotes.</p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          {message}
        </div>
      )}

      <QueryFilters
        fields={[
          { key: 'urgency', label: 'Urgency', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map((value) => ({ value, label: value })) },
          { key: 'date', label: 'Preferred date', type: 'date' }
        ]}
        values={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onApply={() => { setLoading(true); setAppliedFilters(filters); }}
        onReset={() => { setLoading(true); setFilters({ urgency: '', date: '' }); setAppliedFilters({}); }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl glass-panel animate-pulse"></div>
          ))
        ) : requests.length === 0 ? (
          <Card className="col-span-2 text-center py-12">
            <p className="text-slate-400 text-sm">No open requests matching your skill category right now.</p>
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req._id} className="flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Category: {req.aiAnalysis?.classifiedCategoryName || 'General'}</Badge>
                  <span className="text-[11px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 text-base">{req.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{req.description}</p>
                </div>

                {req.images?.length > 0 && (
                  <div className="flex items-center gap-2">
                    {req.images.slice(0, 3).map((image, index) => (
                      <a key={image} href={image} target="_blank" rel="noreferrer" className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 hover:border-blue-400/60">
                        <img src={image} alt={`Request issue ${index + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                    <span className="text-[10px] text-slate-500">{req.images.length} issue photo{req.images.length === 1 ? '' : 's'}</span>
                  </div>
                )}

                {req.aiAnalysis && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] flex justify-between text-slate-300">
                    <span>Skills: <strong className="text-blue-400">{req.aiAnalysis.identifiedSkills?.join(', ')}</strong></span>
                    <span>Urgency: <strong className="text-amber-400">{req.urgency}</strong></span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  Est: ₹{req.aiAnalysis?.estimatedCostRange?.min} - ₹{req.aiAnalysis?.estimatedCostRange?.max}
                </span>
                <Button onClick={() => handleOpenQuoteModal(req)} size="sm" icon={DollarSign}>
                  Submit Quote
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Submit Quote Modal */}
      {selectedReq && (
        <Modal isOpen={true} onClose={() => setSelectedReq(null)} title={`Submit Quote for "${selectedReq.title}"`}>
          <form onSubmit={handleSubmitQuote} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Labor Charge (₹)</label>
                <input
                  type="number"
                  value={labor}
                  onChange={(e) => setLabor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Materials (₹)</label>
                <input
                  type="number"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Callout Fee (₹)</label>
                <input
                  type="number"
                  value={calloutFee}
                  onChange={(e) => setCalloutFee(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Provider Notes / Scope of Work</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Included Services (comma separated)</label>
              <input value={includedServices} onChange={(e) => setIncludedServices(e.target.value)} placeholder="Diagnostics, repair, testing" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input value={additionalChargeDescription} onChange={(e) => setAdditionalChargeDescription(e.target.value)} placeholder="Additional charge" className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
              <input type="number" min="0" value={additionalChargeAmount} onChange={(e) => setAdditionalChargeAmount(e.target.value)} placeholder="Amount (₹)" className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving Quote...' : editingQuote ? 'Save Quote Changes' : 'Confirm Quote Submission'}
              </Button>
              {editingQuote && <Button type="button" onClick={handleWithdrawQuote} disabled={submitting} variant="danger">Withdraw</Button>}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
