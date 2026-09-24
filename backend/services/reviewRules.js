export const normalizeReviewRating = (rating) => {
  const normalized = Number(rating);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 5) return null;
  return normalized;
};

export const canReviewBooking = (status) => status === 'CUSTOMER_CONFIRMED';
