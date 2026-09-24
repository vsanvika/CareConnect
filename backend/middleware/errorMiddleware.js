export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'MulterError' || err.name === 'CastError' || err.name === 'ValidationError' ? 400 : (res.statusCode === 200 ? 500 : res.statusCode));

  console.error(`[Express Error] Path: ${req.originalUrl} | Message: ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : (err.message || 'Request failed')
  });
};
