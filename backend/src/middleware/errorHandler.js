const errorHandler = (err, _req, res, _next) => {
  console.error(err.stack || err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
};

module.exports = { errorHandler };
