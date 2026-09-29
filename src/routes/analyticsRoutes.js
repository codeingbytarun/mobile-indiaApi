const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate, authorizeRoles('shopkeeper', 'admin'));

// 6.1 GET /analytics/dashboard/:shopId
router.get('/dashboard/:shopId', analyticsController.getShopDashboard);

// 6.2 GET /analytics/top-models/:shopId
router.get('/top-models/:shopId', analyticsController.getTopModels);

// 6.3 GET /analytics/trends/:shopId
router.get('/trends/:shopId', analyticsController.getTrends);

module.exports = router;
