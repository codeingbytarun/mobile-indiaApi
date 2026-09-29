/**
 * Standard API Response Envelope Helpers
 */

const sendSuccess = (res, data = null, message = 'Operation completed successfully', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    statusCode,
    message,
    ...(data !== null && data !== undefined ? { data } : {})
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errorCode = 'INTERNAL_ERROR', path = '') => {
  const codeToError = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR'
  };

  const formattedCode = errorCode !== 'INTERNAL_ERROR' ? errorCode : (codeToError[statusCode] || 'SERVER_ERROR');

  return res.status(statusCode).json({
    success: false,
    statusCode,
    error: formattedCode,
    message,
    timestamp: new Date().toISOString(),
    path: path || undefined
  });
};

module.exports = {
  sendSuccess,
  sendError
};
