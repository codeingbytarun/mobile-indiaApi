const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticate, authorizeRoles('admin'));

// 9.1 GET /admin/shops/pending
router.get('/shops/pending', adminController.getPendingShops);

// 9.2 PATCH /admin/shops/:id/verify
router.patch('/shops/:id/verify', adminController.verifyShop);

// 9.3 GET /admin/stats
router.get('/stats', adminController.getAdminStats);

// 9.4 PATCH /admin/listings/:id/flag
router.patch('/listings/:id/flag', adminController.flagListing);

module.exports = router;
