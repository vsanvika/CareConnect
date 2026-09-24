import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { StarRating } from '../common/StarRating';

export const ProviderReviews = ({ providerId }) => {
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let active = true;
    api.get(`/providers/${providerId}/reviews`).then((response) => {
      if (!active) return;
      setSummary({ averageRating: response.data.averageRating || 0, totalReviews: response.data.totalReviews || 0 });
      setReviews(response.data.data || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [providerId]);

  return (
    <div className="pt-3 border-t border-slate-800 space-y-2">
      <div className="flex items-center gap-2">
        <StarRating value={summary.averageRating} showValue />
        <span className="text-[10px] text-slate-500">({summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'})</span>
      </div>
      {reviews.slice(0, 2).map((review) => (
        <div key={review._id} className="text-xs text-slate-400">
          <span className="text-slate-300 font-semibold">{review.customerId?.name || 'Customer'}</span>
          <span className="mx-1 text-slate-600">·</span>
          <span className="text-amber-400">{review.rating}/5</span>
          {review.comment && <p className="mt-0.5 line-clamp-2">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
};
