import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, MapPin, ShieldAlert, Image as ImageIcon, X } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const NewRequestPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState(searchParams.get('q') || '');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [street, setStreet] = useState('742 Evergreen Terrace');
  const [city, setCity] = useState('Metro City');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [confirmedEmergency, setConfirmedEmergency] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const previews = photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [photos]);

  const handlePhotoChange = (event) => {
    const selectedPhotos = Array.from(event.target.files || []);
    if (selectedPhotos.some((photo) => photo.size > 10 * 1024 * 1024)) {
      setError('Each photo must be 10 MB or smaller.');
      return;
    }
    setPhotos(selectedPhotos.slice(0, 5));
    setError(null);
  };

  const runAiAnalysis = async () => {
    if (!title.trim() && !description.trim()) return;
    try {
      const [diagnosisRes, estimateRes] = await Promise.all([
        api.post('/ai/diagnosis', { title, description: description || title, category: 'General Service' }),
        api.post('/ai/price-estimate', {
          category: 'General Service',
          serviceType: 'Standard service',
          severity: urgency === 'EMERGENCY' ? 'HIGH' : 'NORMAL',
          urgency,
          durationHours: 2,
          location: city || 'Local service area',
          historicalPrices: [800, 1200, 1500]
        })
      ]);
      setDiagnosis(diagnosisRes.data.data);
      setPriceEstimate(estimateRes.data.data);
    } catch (err) {
      console.error('AI analysis failed', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);

    try {
      if (!diagnosis) {
        const analysis = await api.post('/ai/diagnosis', { title, description: description || title, category: 'General Service' });
        setDiagnosis(analysis.data.data);
      }
      if (!priceEstimate) {
        const estimate = await api.post('/ai/price-estimate', {
          category: 'General Service',
          serviceType: 'Standard service',
          severity: urgency === 'EMERGENCY' ? 'HIGH' : 'NORMAL',
          urgency,
          durationHours: 2,
          location: city || 'Local service area',
          historicalPrices: [800, 1200, 1500]
        });
        setPriceEstimate(estimate.data.data);
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || title);
      formData.append('urgency', urgency);
      formData.append('preferredDate', preferredDate);
      formData.append('timeSlot', timeSlot);
      formData.append('address', JSON.stringify({ street, city, zipCode: '10001' }));
      formData.append('emergencyReason', emergencyReason);
      formData.append('confirmedEmergency', String(urgency === 'EMERGENCY' ? confirmedEmergency : true));
      formData.append('aiDiagnosis', JSON.stringify(diagnosis));
      formData.append('priceEstimate', JSON.stringify(priceEstimate));
      photos.forEach((photo) => formData.append('images', photo));

      const res = await api.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      const newReq = res.data.data;
      navigate(`/customer/requests/${newReq._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit service request.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <Badge variant="info" className="gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI-Powered Dispatcher
        </Badge>
        <h1 className="text-3xl font-bold text-slate-100">Create New Service Request</h1>
        <p className="text-xs text-slate-400">Describe what you need in plain text. CareConnect AI will classify the category, extract required skill tags, estimate pricing, and auto-match top verified providers.</p>
      </div>

      <Card>
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Service Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Kitchen sink pipe leaking under trap seal"
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Detailed Description & Symptoms</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention specifics like water pressure, noises, model numbers, or special access instructions..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl p-4 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => {
                  setUrgency(e.target.value);
                  if (e.target.value !== 'EMERGENCY') setConfirmedEmergency(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
              >
                <option value="LOW">Low (Flexible schedule)</option>
                <option value="MEDIUM">Medium (Within 24-48h)</option>
                <option value="HIGH">High (Needed today)</option>
                <option value="EMERGENCY">Emergency (Immediate hazard)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Preferred Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Time Window</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
              >
                <option value="08:00 AM - 11:00 AM">Morning (08:00 - 11:00 AM)</option>
                <option value="09:00 AM - 12:00 PM">Mid-Day (09:00 - 12:00 PM)</option>
                <option value="01:00 PM - 04:00 PM">Afternoon (01:00 - 04:00 PM)</option>
                <option value="04:00 PM - 07:00 PM">Evening (04:00 - 07:00 PM)</option>
              </select>
            </div>
          </div>

          {urgency === 'EMERGENCY' && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4" /> Use Emergency only when immediate assistance is required.
              </div>
              <textarea
                rows={2}
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="Describe the emergency, such as major water leakage, electrical danger, or gas issue."
                className="w-full bg-slate-950 border border-rose-500/25 rounded-xl p-3 text-xs text-slate-100 focus:outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={confirmedEmergency} onChange={(e) => setConfirmedEmergency(e.target.checked)} />
                I confirm this is an emergency and requires immediate response.
              </label>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <div>
                <label htmlFor="request-photos" className="text-xs font-bold text-slate-300">Photos of the issue</label>
                <p className="text-[10px] text-slate-500">Add up to 5 JPG, PNG, or WEBP photos so providers can assess the damage.</p>
              </div>
            </div>
            <input id="request-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoChange} className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {photoPreviews.map((preview, index) => (
                  <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-slate-700">
                    <img src={preview} alt={`Issue preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-slate-200" aria-label={`Remove photo ${index + 1}`}><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" /> Service Location
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street Address"
                className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={runAiAnalysis} className="flex-1 py-3 text-base">
              Run AI Diagnosis
            </Button>
            <Button
              type="submit"
              disabled={analyzing}
              className="flex-1 py-3 text-base shadow-xl shadow-blue-500/25"
              icon={Sparkles}
            >
              {analyzing ? 'Submitting...' : 'Submit & Match'}
            </Button>
          </div>

          {(diagnosis || priceEstimate) && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {diagnosis && (
                <Card className="border-blue-500/30 bg-blue-950/20">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-blue-300 font-bold">✨ AI Diagnosis</p>
                  <p className="text-sm font-semibold mt-2 text-slate-100">{diagnosis.possibleIssue}</p>
                  <p className="text-[11px] text-slate-300 mt-2">Category: {diagnosis.category} · Confidence: {(diagnosis.confidence * 100).toFixed(0)}%</p>
                  <p className="text-[11px] text-slate-400 mt-2">{diagnosis.disclaimer}</p>
                </Card>
              )}
              {priceEstimate && (
                <Card className="border-emerald-500/30 bg-emerald-950/20">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-bold">💰 AI Estimate</p>
                  <p className="text-lg font-extrabold mt-2 text-emerald-300">₹{priceEstimate.estimatedMinPrice} – ₹{priceEstimate.estimatedMaxPrice}</p>
                  <p className="text-[11px] text-slate-300 mt-2">Estimated duration: {priceEstimate.estimatedDuration}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{priceEstimate.disclaimer}</p>
                </Card>
              )}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
