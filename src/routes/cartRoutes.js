const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// All buyer cart routes require authenticated session
router.use(authenticate);

// 4.1 GET /buyer/cart
router.get('/', cartController.getCart);

// 4.2 POST /buyer/cart
router.post('/', cartController.addToCart);

// 4.4 DELETE /buyer/cart
router.delete('/', cartController.clearCart);

// 4.5 POST /buyer/cart/sync
router.post('/sync', cartController.syncCart);

// 4.3 DELETE /buyer/cart/:phoneId
router.delete('/:phoneId', cartController.removeFromCart);

module.exports = router;
