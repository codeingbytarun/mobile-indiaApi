const express = require('express');
const router = express.Router();
const { isDbConnected } = require('../config/db');
const { sendSuccess } = require('../utils/responseEnvelope');

const authRoutes = require('./authRoutes');
const shopRoutes = require('./shopRoutes');
const phoneRoutes = require('./phoneRoutes');
const cartRoutes = require('./cartRoutes');
const leadRoutes = require('./leadRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const mediaRoutes = require('./mediaRoutes');
const metaRoutes = require('./metaRoutes');
const adminRoutes = require('./adminRoutes');

// API Health Check
router.get('/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'healthy',
      uptimeSeconds: Math.round(process.uptime()),
      database: isDbConnected() ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    },
    'MobiMarket API is operational',
    200
  );
});

// Mount the 9 functional modules under /api/v1
router.use('/auth', authRoutes);
router.use('/shops', shopRoutes);
router.use('/phones', phoneRoutes);
router.use('/buyer/cart', cartRoutes);
router.use('/leads', leadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/media', mediaRoutes);
router.use('/meta', metaRoutes);
router.use('/admin', adminRoutes);

// Catalog Root
router.get('/', (req, res) => {
  return sendSuccess(
    res,
    {
      name: 'MobiMarket Backend REST API',
      version: '1.0.0',
      totalModules: 9,
      totalEndpoints: 45,
      documentation: 'https://github.com/mobimarket/Mob-India-Api',
      endpoints: {
        auth: '/api/v1/auth (7 APIs)',
        shops: '/api/v1/shops (7 APIs)',
        phones: '/api/v1/phones (10 APIs)',
        cart: '/api/v1/buyer/cart (5 APIs)',
        leads: '/api/v1/leads (4 APIs)',
        analytics: '/api/v1/analytics (3 APIs)',
        media: '/api/v1/media (2 APIs)',
        meta: '/api/v1/meta (3 APIs)',
        admin: '/api/v1/admin (4 APIs)'
      }
    },
    'Welcome to MobiMarket API v1.0.0'
  );
});

module.exports = router;
