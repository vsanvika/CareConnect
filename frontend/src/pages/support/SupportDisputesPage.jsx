import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle2, UserCheck, Image as ImageIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const SupportDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [action, setAction] = useState('FULL_REFUND');
  const [refundAmount, setRefundAmount] = useState(50);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes', { params: statusFilter ? { status: statusFilter } : {} });
      setDisputes(res.data.data || []);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/disputes/${id}`);
      setSelectedDetail(res.data.data);
    } catch (err) {
      console.error('Failed to load dispute details', err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedDetail || !noteText.trim()) return;
    await api.post(`/disputes/${selectedDetail._id}/notes`, { message: noteText });
    setNoteText('');
    handleOpenDetail(selectedDetail._id);
    fetchDisputes();
  };

  const handleEscalate = async () => {
    if (!selectedDetail) return;
    await api.post(`/disputes/${selectedDetail._id}/escalate`, { message: noteText || 'Escalated for operations review.' });
    setSelectedDetail(null);
    fetchDisputes();
  };

  const handleReject = async () => {
    if (!selectedDetail) return;
    await api.post(`/disputes/${selectedDetail._id}/reject`, { notes: noteText || 'Evidence did not support the complaint.' });
    setSelectedDetail(null);
    fetchDisputes();
  };

  const handleAssignToMe = async (id) => {
    try {
      await api.patch(`/disputes/${id}/assign`);
      fetchDisputes();
    } catch (err) {
      console.error('Failed to assign dispute', err);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/disputes/${selectedDispute._id}/resolve`, {
        action,
        amount: Number(refundAmount),
        notes: resolutionNotes
      });
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Badge variant="danger" className="mb-1">Support Resolution Desk</Badge>
        <h1 className="text-3xl font-bold text-slate-100">Dispute & Complaint Lifecycle Desk</h1>
        <p className="text-xs text-slate-400">Investigate customer complaints, inspect evidence photos, assign agent ownership, and issue refunds.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'REJECTED'].map((status) => (
          <button key={status || 'all'} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusFilter === status ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-slate-800 text-slate-400 hover:text-white'}`}>
            {status || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl glass-panel animate-pulse"></div>
          ))
        ) : disputes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-400 text-sm">No open dispute tickets in queue.</p>
          </Card>
        ) : (
          disputes.map((disp) => (
            <Card key={disp._id} className="space-y-4 border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={disp.status === 'RESOLVED' ? 'success' : 'danger'}>
                    {disp.status}
                  </Badge>
                  <span className="text-xs font-bold text-slate-300">Reason: {disp.reason}</span>
                </div>
                <span className="text-[11px] text-slate-500">Ticket ID: {disp._id.slice(-6)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Customer Complaint Description:</span>
                  <p className="text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    "{disp.description}"
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold block">Case Parties:</span>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-[11px]">
                    <div>Customer: <strong className="text-blue-300">{disp.openedBy?.name}</strong> ({disp.openedBy?.email})</div>
                    <div>Assigned Support Agent: <strong className="text-amber-300">{disp.assignedAgentId?.name || 'Unassigned Queue'}</strong></div>
                    <div>Booking: <strong className="text-slate-200">{disp.bookingId?.requestId?.title || 'Service booking'}</strong></div>
                    <div>Quote total: <strong className="text-emerald-300">₹{disp.bookingId?.quoteId?.amount || 'N/A'}</strong></div>
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              {disp.history?.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Case Audit Log</span>
                  <div className="space-y-1">
                    {disp.history.map((h, idx) => (
                      <div key={idx} className="text-[11px] text-slate-400 flex justify-between">
                        <span>• {h.message}</span>
                        <span className="text-[10px] text-slate-600">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <Button onClick={() => handleOpenDetail(disp._id)} size="sm" variant="secondary" icon={ImageIcon}>Inspect Case</Button>
                {!disp.assignedAgentId && (
                  <Button onClick={() => handleAssignToMe(disp._id)} size="sm" variant="outline" icon={UserCheck}>
                    Claim Ticket & Start Review
                  </Button>
                )}

                {!['RESOLVED', 'REJECTED'].includes(disp.status) && (
                  <Button onClick={() => setSelectedDispute(disp)} size="sm" variant="danger" icon={CheckCircle2}>
                    Resolve Dispute & Issue Adjustment
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedDetail && (
        <Modal isOpen={true} onClose={() => setSelectedDetail(null)} title="Dispute Case Review">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div><span className="text-slate-500 block">Booking</span><strong>{selectedDetail.bookingId?.requestId?.title}</strong></div>
              <div><span className="text-slate-500 block">Status</span><strong>{selectedDetail.status}</strong></div>
              <div><span className="text-slate-500 block">Customer</span><strong>{selectedDetail.bookingId?.customerId?.name}</strong></div>
              <div><span className="text-slate-500 block">Provider</span><strong>{selectedDetail.bookingId?.providerId?.name}</strong></div>
              <div><span className="text-slate-500 block">Quote</span><strong>₹{selectedDetail.bookingId?.quoteId?.amount || 'N/A'}</strong></div>
              <div><span className="text-slate-500 block">Invoice</span><strong>{selectedDetail.invoice ? `₹${selectedDetail.invoice.totalAmount} (${selectedDetail.invoice.paymentStatus})` : 'Not generated'}</strong></div>
            </div>
            <div>
              <span className="text-slate-500 block mb-2">Evidence ({selectedDetail.evidence?.length || 0})</span>
              {selectedDetail.evidence?.map((evidence) => <div key={evidence._id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 mb-2">{evidence.evidenceType}: {evidence.notes || 'No notes'}<div className="text-slate-500">{evidence.fileUrls?.length || 0} file(s)</div></div>)}
            </div>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Add an internal support note or escalation reason" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddNote} size="sm" variant="outline">Add Note</Button>
              {selectedDetail.status !== 'ESCALATED' && <Button onClick={handleEscalate} size="sm" variant="secondary">Escalate</Button>}
              {!['RESOLVED', 'REJECTED'].includes(selectedDetail.status) && <Button onClick={handleReject} size="sm" variant="danger">Reject</Button>}
            </div>
          </div>
        </Modal>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <Modal isOpen={true} onClose={() => setSelectedDispute(null)} title="Resolve Dispute Ticket">
          <form onSubmit={handleResolveDispute} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Resolution Decision Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              >
                <option value="FULL_REFUND">Full Refund to Customer</option>
                <option value="PARTIAL_REFUND">Partial Refund Adjustment</option>
                <option value="RE_SERVICE">Re-Service Dispatch (Free of Charge)</option>
                <option value="DISMISS">Dismiss Complaint (Maintain Provider Payout)</option>
              </select>
            </div>

            {['FULL_REFUND', 'PARTIAL_REFUND'].includes(action) && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Support Agent Resolution Notes</label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the resolution reasoning sent to both parties..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            <Button type="submit" disabled={submitting} variant="danger" className="w-full">
              {submitting ? 'Resolving...' : 'Confirm Dispute Resolution'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
