const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticate, optionalAuth, authorizeRoles } = require('../middleware/auth');

// 2.1 GET /shops
router.get('/', shopController.getShops);

// 2.7 GET /shops/check-slug/:slug
router.get('/check-slug/:slug', shopController.checkSlug);

// 2.4 GET /shops/:id/qr
router.get('/:id/qr', shopController.getShopQrCode);

// 2.5 GET /shops/:id/reviews
router.get('/:id/reviews', shopController.getShopReviews);

// 2.6 POST /shops/:id/reviews
router.post('/:id/reviews', optionalAuth, shopController.addShopReview);

// 2.2 GET /shops/:idOrSlug
router.get('/:idOrSlug', shopController.getShopByIdOrSlug);

// 2.3 PUT /shops/:id
router.put('/:id', authenticate, authorizeRoles('shopkeeper', 'admin'), shopController.updateShop);

module.exports = router;
