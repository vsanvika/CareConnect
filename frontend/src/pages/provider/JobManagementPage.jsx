import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Wrench, Upload, CheckCircle2, Navigation } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BookingStatusTracker } from '../../components/domain/BookingStatusTracker';

export const JobManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Evidence Upload Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [evidenceType, setEvidenceType] = useState('AFTER_PHOTO');
  const [notes, setNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [additionalWork, setAdditionalWork] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load provider jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('evidenceType', evidenceType);
      formData.append('notes', notes);
      formData.append('partsUsed', partsUsed);
      formData.append('additionalWork', additionalWork);
      files.forEach((file) => formData.append('files', file));
      await api.post(`/bookings/${selectedBooking._id}/evidence`, formData);
      setSelectedBooking(null);
      setFiles([]);
      fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Badge variant="purple" className="mb-1">Technician Portal</Badge>
        <h1 className="text-3xl font-bold text-slate-100">Job Execution & Evidence Center</h1>
        <p className="text-xs text-slate-400">Manage real-time execution states and upload work proof for automated invoice generation.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl glass-panel animate-pulse"></div>
          ))
        ) : bookings.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-400 text-sm">No active jobs assigned currently.</p>
          </Card>
        ) : (
          bookings.map((job) => (
            <Card key={job._id} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="info">{job.status}</Badge>
                  <span className="text-xs text-slate-400">Customer: {job.customerId?.name} ({job.customerId?.phone || 'No phone'})</span>
                </div>
                <h3 className="font-bold text-slate-100 text-lg">{job.requestId?.title || 'Service Job'}</h3>
                <p className="text-xs text-slate-400">Address: {job.customerId?.address?.street}, {job.customerId?.address?.city}</p>
                <span className="text-xs font-bold text-emerald-400 block">Payout Value: ₹{job.totalAmount}</span>
                <BookingStatusTracker status={job.status} />
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                {job.status === 'CONFIRMED' && (
                    <Button onClick={() => handleStatusUpdate(job._id, 'PROVIDER_ON_THE_WAY')} size="sm" icon={Navigation}>
                    Start En Route
                  </Button>
                )}

                {job.status === 'PROVIDER_ON_THE_WAY' && (
                  <Button onClick={() => handleStatusUpdate(job._id, 'IN_PROGRESS')} size="sm" variant="warning" icon={Wrench}>
                    Start Work (In Progress)
                  </Button>
                )}

                {['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(job.status) && (
                  <Button onClick={() => setSelectedBooking(job)} size="sm" variant="secondary" icon={Upload}>
                    Upload Work Evidence
                  </Button>
                )}

                {job.status === 'IN_PROGRESS' && (
                  <Button onClick={() => handleStatusUpdate(job._id, 'COMPLETED')} size="sm" variant="accent" icon={CheckCircle2}>
                    Mark Job Completed
                  </Button>
                )}
                {['CONFIRMED', 'PROVIDER_ON_THE_WAY'].includes(job.status) && (
                  <Button onClick={() => api.post(`/bookings/${job._id}/cancel`, { reason: 'Cancelled by provider' }).then(fetchJobs)} size="sm" variant="danger">
                    Cancel Booking
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Evidence Modal */}
      {selectedBooking && (
        <Modal isOpen={true} onClose={() => setSelectedBooking(null)} title="Upload Work Proof Evidence">
          <form onSubmit={handleUploadEvidence} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Evidence Category</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              >
                <option value="BEFORE_PHOTO">Before Photo (Initial Assessment)</option>
                <option value="AFTER_PHOTO">After Photo (Completed Repair)</option>
                <option value="WORK_LOG">Work Log & Diagnostics Report</option>
                <option value="PARTS_RECEIPT">Parts Receipt / Materials Tag</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Work Proof Notes</label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe work completed, parts installed, and pressure/voltage verification tests..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Evidence Files</label>
              <input
                type="file"
                required
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              <p className="text-[10px] text-slate-500">JPG, PNG, WEBP, or PDF. Maximum 10 MB per file.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Parts Used (comma separated)</label>
              <input value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} placeholder="Trap seal, copper fitting" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Additional Work</label>
              <textarea rows={2} value={additionalWork} onChange={(e) => setAdditionalWork(e.target.value)} placeholder="Describe extra work completed" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100" />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Uploading Evidence...' : 'Confirm Upload Evidence'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
