const errorBoundary = (err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorBoundary;
