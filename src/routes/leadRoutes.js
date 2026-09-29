const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate, optionalAuth, authorizeRoles } = require('../middleware/auth');

// 5.1 POST /leads - records an inquiry attempt (buyer or visitor)
router.post('/', optionalAuth, leadController.createLead);

// 5.4 GET /leads/buyer/my-inquiries (Must be registered before /:id routes)
router.get('/buyer/my-inquiries', authenticate, leadController.getBuyerInquiries);

// 5.2 GET /leads/shop/:shopId
router.get('/shop/:shopId', authenticate, authorizeRoles('shopkeeper', 'admin'), leadController.getShopLeads);

// 5.3 PATCH /leads/:id/status
router.patch('/:id/status', authenticate, authorizeRoles('shopkeeper', 'admin'), leadController.updateLeadStatus);

module.exports = router;
