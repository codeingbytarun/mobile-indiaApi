const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// 3.1 GET /phones
router.get('/', phoneController.getPhones);

// 3.2 GET /phones/featured
router.get('/featured', phoneController.getFeaturedPhones);

// 3.4 GET /phones/compare
router.get('/compare', phoneController.comparePhones);

// 3.5 POST /phones
router.post('/', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.createPhone);

// 3.3 GET /phones/:id
router.get('/:id', phoneController.getPhoneById);

// 3.6 PUT /phones/:id
router.put('/:id', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.updatePhone);

// 3.7 PATCH /phones/:id/price
router.patch('/:id/price', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.updatePhonePrice);

// 3.8 PATCH /phones/:id/sold
router.patch('/:id/sold', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.togglePhoneSoldStatus);

// 3.9 PATCH /phones/:id/images
router.patch('/:id/images', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.updatePhoneImages);

// 3.10 DELETE /phones/:id
router.delete('/:id', authenticate, authorizeRoles('shopkeeper', 'admin'), phoneController.deletePhone);

module.exports = router;
