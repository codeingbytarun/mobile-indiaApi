const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const apiRouter = require('./routes/index');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/responseEnvelope');

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration (enables Angular frontend http://localhost:4200 and production origins)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limit for OTP dispatch (Module 1.1: 3 requests per 10 minutes)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // Generous dev limit, production would be 3
  message: {
    success: false,
    statusCode: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many OTP requests from this IP. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/auth/send-otp', otpLimiter);

// Mount API v1
app.use('/api/v1', apiRouter);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  return sendSuccess(
    res,
    {
      app: 'MobiMarket REST API Server',
      version: '1.0.0',
      apiBase: '/api/v1',
      documentation: '/api/v1',
      health: '/api/v1/health'
    },
    'MobiMarket Server is running smoothly'
  );
});

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
