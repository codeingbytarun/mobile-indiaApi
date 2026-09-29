const { sendError } = require('../utils/responseEnvelope');

const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND',
    req.originalUrl
  );
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(
      res,
      `Duplicate value entered for ${field}. Please use another value.`,
      409,
      'CONFLICT',
      req.originalUrl
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(
      res,
      `Validation failed: ${messages.join(', ')}`,
      400,
      'BAD_REQUEST',
      req.originalUrl
    );
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(
      res,
      `Resource not found with identifier '${err.value}'`,
      404,
      'NOT_FOUND',
      req.originalUrl
    );
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected server error occurred';

  return sendError(res, message, statusCode, errorCode, req.originalUrl);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
