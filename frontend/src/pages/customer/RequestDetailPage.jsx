import { StarRating } from '../../components/common/StarRating';
import { ProviderReviews } from '../../components/domain/ProviderReviews';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [reqRes, quoteRes] = await Promise.all([
          api.get(`/requests/${id}`),
          api.get(`/quotes/request/${id}`)
        ]);
        setRequest(reqRes.data.data);
        setQuotes(quoteRes.data.data || []);
      } catch (err) {
        console.error('Failed to load request details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAcceptQuote = async (quoteId) => {
    setAcceptingQuoteId(quoteId);
    setError(null);
    try {
      const res = await api.post(`/quotes/${quoteId}/accept`);
      const booking = res.data.data.booking;
      navigate(`/customer/bookings/${booking._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept quote.');
      setAcceptingQuoteId(null);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    try {
      await api.post(`/quotes/${quoteId}/reject`);
      setQuotes((current) => current.map((quote) => quote._id === quoteId ? { ...quote, status: 'REJECTED' } : quote));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject quote.');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading AI matches & quotes...</div>;
  }

  if (!request) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Service request not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info">{request.status}</Badge>
            <span className="text-xs text-slate-400 font-medium">Req ID: {request._id.slice(-6)}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{request.title}</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {request.images?.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-200">Photos of the issue ({request.images.length})</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {request.images.map((image, index) => (
              <a key={image} href={image} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border border-slate-800 hover:border-blue-400/60">
                <img src={image} alt={`Service issue ${index + 1}`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* AI Analysis Insight Card */}
      {request.aiAnalysis && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" /> CareConnect AI Intelligence Insights
              </span>
              <Badge variant="purple">Urgency Score: {request.aiAnalysis.urgencyScore}/10</Badge>
            </div>

            <p className="text-xs text-slate-300 italic">{request.aiAnalysis.reasoning}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Classified Category</span>
                <span className="font-semibold text-slate-200">{request.aiAnalysis.classifiedCategoryName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Identified Skill Tags</span>
                <span className="font-semibold text-blue-300">
                  {request.aiAnalysis.identifiedSkills?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Fair Market Cost Range</span>
                <span className="font-semibold text-emerald-400">
                  ₹{request.aiAnalysis.estimatedCostRange?.min} - ₹{request.aiAnalysis.estimatedCostRange?.max}
                </span>
              </div>
            </div>

            {request.aiAnalysis.diagnosis && (
              <div className="mt-4 rounded-2xl p-4 bg-slate-950/60 border border-slate-800">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-300 font-bold">✨ AI Diagnosis</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{request.aiAnalysis.diagnosis.possibleIssue}</p>
                <p className="text-[11px] text-slate-300 mt-2">Urgency: {request.aiAnalysis.diagnosis.urgency} · Confidence: {(request.aiAnalysis.diagnosis.confidence * 100).toFixed(0)}%</p>
                <p className="text-[11px] text-slate-400 mt-2">{request.aiAnalysis.diagnosis.disclaimer}</p>
              </div>
            )}

            {request.aiAnalysis.priceEstimate && (
              <div className="mt-3 rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/20">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-bold">💰 AI Price Estimate</p>
                <p className="mt-2 text-lg font-extrabold text-emerald-300">₹{request.aiAnalysis.priceEstimate.estimatedMinPrice} – ₹{request.aiAnalysis.priceEstimate.estimatedMaxPrice}</p>
                <p className="text-[11px] text-slate-300 mt-2">Estimated duration: {request.aiAnalysis.priceEstimate.estimatedDuration}</p>
                <p className="text-[11px] text-slate-400 mt-2">{request.aiAnalysis.priceEstimate.disclaimer}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submitted Quotes Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200">Submitted Provider Quotes ({quotes.length})</h2>

        {quotes.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-400 text-xs">No quotes submitted by providers yet. Top AI matched providers have been notified.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <Card key={q._id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-slate-800">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={q.providerId?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                      alt={q.providerId?.name}
                      className="w-10 h-10 rounded-full border border-blue-500/30 object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{q.providerId?.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <StarRating value={q.providerId?.ratingAverage || 0} showValue />
                        <span>({q.providerId?.ratingCount || 0})</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Labor</span>
                      <span className="font-semibold text-slate-300">₹{q.breakdown?.labor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Materials</span>
                      <span className="font-semibold text-slate-300">₹{q.breakdown?.materials}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Callout Fee</span>
                      <span className="font-semibold text-slate-300">₹{q.breakdown?.calloutFee}</span>
                    </div>
                  </div>

                  {q.notes && <p className="text-xs text-slate-400 italic">"{q.notes}"</p>}
                  {q.includedServices?.length > 0 && (
                    <p className="text-xs text-slate-400">Includes: <span className="text-slate-200">{q.includedServices.join(', ')}</span></p>
                  )}
                  {q.additionalCharges?.length > 0 && (
                    <p className="text-xs text-amber-300">Additional: {q.additionalCharges.map((charge) => `${charge.description} (₹${charge.amount})`).join(', ')}</p>
                  )}
                  {q.providerId?._id && <ProviderReviews providerId={q.providerId._id} />}
                </div>

                <div className="text-right space-y-2 md:border-l md:border-slate-800 md:pl-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Total Quote</span>
                    <span className="text-2xl font-extrabold text-emerald-400">₹{q.amount}</span>
                  </div>

                  {q.status === 'SUBMITTED' && request.status !== 'BOOKED' ? (
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => handleAcceptQuote(q._id)}
                        disabled={acceptingQuoteId === q._id}
                        size="sm"
                        variant="primary"
                      >
                        {acceptingQuoteId === q._id ? 'Accepting...' : 'Accept & Book'}
                      </Button>
                      <Button onClick={() => handleRejectQuote(q._id)} size="sm" variant="outline">Reject</Button>
                    </div>
                  ) : q.status === 'ACCEPTED' ? (
                    <Badge variant="success">ACCEPTED</Badge>
                  ) : (
                    <Badge variant="neutral">{q.status}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* AI Provider Rankings Breakdown */}
      {request.eligibleProviders?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-200">AI Provider Compatibility Index</h2>
          <div className="space-y-3">
            {request.eligibleProviders.map((ep, idx) => (
              <div key={idx} className="p-3 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-200">{ep.providerId?.name || `Provider #${idx+1}`}</span>
                    <StarRating value={ep.ratingAverage || 0} showValue />
                  <p className="text-slate-400">{ep.matchReasoning}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-400">{ep.matchScore}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
