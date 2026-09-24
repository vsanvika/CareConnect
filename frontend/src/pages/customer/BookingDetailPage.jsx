import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileText, ShieldAlert, DollarSign, Image as ImageIcon, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BookingStatusTracker } from '../../components/domain/BookingStatusTracker';
import { StarRating } from '../../components/common/StarRating';

export const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Dispute Form
  const [disputeReason, setDisputeReason] = useState('Poor service');
  const [disputeDesc, setDisputeDesc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    const interval = window.setInterval(() => {
      fetchBookingDetails();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data.data);
      setEvidence(res.data.data.evidence || []);

      const invRes = await api.get('/invoices');
      const matchedInv = (invRes.data.data || []).find(i => i.bookingId?._id === id || i.bookingId === id);
      setInvoice(matchedInv);
      const reviewRes = await api.get(`/reviews/booking/${id}`);
      setExistingReview(reviewRes.data.data);
    } catch (err) {
      console.error('Failed to load booking', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    try {
      await api.post(`/invoices/${invoice._id}/pay`);
      fetchBookingDetails();
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment
      });
      setShowReviewModal(false);
      setExistingReview({ rating, comment });
      fetchBookingDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/disputes', {
        bookingId: booking._id,
        reason: disputeReason,
        description: disputeDesc
      });
      setShowDisputeModal(false);
      fetchBookingDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (status) => {
    setStatusUpdating(true);
    try {
      await api.put(`/bookings/${booking._id}/status`, { status });
      await fetchBookingDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const cancelBooking = async () => {
    try {
      await api.post(`/bookings/${booking._id}/cancel`, { reason: 'Cancelled by customer' });
      await fetchBookingDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-400">Loading booking status...</div>;
  if (!booking) return <div className="py-12 text-center text-slate-400">Booking record not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Customer Dashboard
      </button>

      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple">{booking.status}</Badge>
            <span className="text-xs text-slate-400">Booking ID: {booking._id.slice(-6)}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{booking.requestId?.title || 'Service Job'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {booking.status !== 'DISPUTED' && (
            <Button variant="danger" size="sm" icon={ShieldAlert} onClick={() => setShowDisputeModal(true)}>
              File Dispute / Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress Stepper */}
      <Card className="border-slate-800">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Job Execution Progress</h3>
        <BookingStatusTracker status={booking.status} />
        <div className="flex justify-end gap-2 mt-5">
          {booking.status === 'COMPLETED' && (
            <Button onClick={() => updateStatus('CUSTOMER_CONFIRMED')} disabled={statusUpdating} size="sm" icon={CheckCircle2}>
              Confirm Completion
            </Button>
          )}
          {['CONFIRMED', 'PROVIDER_ON_THE_WAY'].includes(booking.status) && (
            <Button onClick={cancelBooking} variant="danger" size="sm" icon={XCircle}>Cancel Booking</Button>
          )}
        </div>
      </Card>

      <Card className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Provider</span>
          <span className="text-slate-200 font-semibold">{booking.providerId?.name || 'Assigned provider'}</span>
          <span className="text-xs text-slate-500 block">{booking.providerId?.phone || booking.providerId?.email}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Scheduled</span>
          <span className="text-slate-200 font-semibold">{new Date(booking.scheduledStart).toLocaleDateString()}</span>
          <span className="text-xs text-slate-500 block">{new Date(booking.scheduledStart).toLocaleTimeString()} - {new Date(booking.scheduledEnd).toLocaleTimeString()}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Job Notes</span>
          <span className="text-xs text-slate-400">{booking.jobNotes || 'No job notes yet.'}</span>
        </div>
      </Card>

      {booking.statusHistory?.length > 0 && (
        <Card>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Status Timeline</h3>
          <div className="space-y-3">
            {booking.statusHistory.map((event, index) => (
              <div key={`${event.status}-${event.changedAt}-${index}`} className="flex gap-3 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{event.status.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-slate-500">{new Date(event.changedAt).toLocaleString()}</p>
                  {event.note && <p className="text-xs text-slate-400 mt-1">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Job Evidence Proof Photos Viewer */}
      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" /> Work Proof Evidence ({evidence.length})
        </h3>

        {evidence.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No job evidence photos uploaded yet by technician.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {evidence.map((ev) => (
              <div key={ev._id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="success">{ev.evidenceType}</Badge>
                  <span className="text-[10px] text-slate-500">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                </div>
                {ev.fileUrls?.map((url, i) => (
                  url.toLowerCase().endsWith('.pdf') ? (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-xs text-blue-300 hover:underline">Open evidence document</a>
                  ) : <img key={i} src={url} alt="Proof" className="w-full h-40 object-cover rounded-xl border border-slate-800" />
                ))}
                {ev.notes && <p className="text-xs text-slate-300">"{ev.notes}"</p>}
                {ev.partsUsed?.length > 0 && <p className="text-xs text-slate-400">Parts: {ev.partsUsed.join(', ')}</p>}
                {ev.additionalWork && <p className="text-xs text-slate-400">Additional work: {ev.additionalWork}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invoice Card */}
      {invoice && (
        <Card className="border-emerald-500/30 bg-emerald-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Itemized Invoice #{invoice.invoiceNumber}
            </span>
            <Badge variant={invoice.paymentStatus === 'PAID' ? 'success' : 'warning'}>
              {invoice.paymentStatus}
            </Badge>
          </div>

          <div className="space-y-2">
            {invoice.lineItems?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-slate-300">
                <span>{item.description}</span>
                <span className="font-semibold">₹{item.amount}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 pt-2 flex justify-between text-xs text-slate-400">
              <span>Platform Fee & Tax</span>
              <span>₹{(invoice.platformFee + invoice.tax).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-slate-100">
              <span>Total Amount Due</span>
              <span className="text-emerald-400 text-base">₹{invoice.totalAmount}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {invoice.paymentStatus !== 'PAID' && (
              <Button onClick={handlePayInvoice} variant="accent" size="sm" icon={DollarSign}>
                Confirm & Pay Invoice
              </Button>
            )}
            <Button onClick={() => navigate(`/customer/invoices/${invoice._id}`)} variant="outline" size="sm" icon={FileText}>
              View Full Invoice
            </Button>
            {booking.status === 'CUSTOMER_CONFIRMED' && !existingReview && (
              <Button onClick={() => setShowReviewModal(true)} variant="primary" size="sm">
                Leave Provider Review
              </Button>
            )}
            {existingReview && <span className="text-sm text-emerald-300">Review submitted: {existingReview.rating}/5</span>}
          </div>
        </Card>
      )}

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Rate & Review Service Provider">
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block mb-2">Rating (1 to 5 Stars)</label>
            <StarRating value={rating} onChange={setRating} size="lg" showValue />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Comments</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe technician punctuality, cleanliness, and repair quality..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting Review...' : 'Submit Rating'}
          </Button>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="Open Complaint & Dispute Ticket">
        <form onSubmit={handleDisputeSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Dispute Reason</label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            >
              <option value="Provider did not arrive">Provider did not arrive</option>
              <option value="Poor service">Poor service</option>
              <option value="Incorrect charge">Incorrect charge</option>
              <option value="Service incomplete">Service incomplete</option>
              <option value="Damage caused">Damage caused</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Detailed Complaint Explanation</label>
            <textarea
              rows={4}
              required
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              placeholder="Describe what went wrong so CareConnect Support Team can investigate and process refund/reservice..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
            />
          </div>

          <Button type="submit" disabled={submitting} variant="danger" className="w-full">
            {submitting ? 'Submitting Dispute...' : 'Submit to Support Team'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
