const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 7.1 POST /media/upload
router.post(
  '/upload',
  authenticate,
  authorizeRoles('shopkeeper', 'admin'),
  upload.single('file'),
  mediaController.uploadMedia
);

// 7.2 DELETE /media
router.delete(
  '/',
  authenticate,
  authorizeRoles('shopkeeper', 'admin'),
  mediaController.deleteMedia
);

module.exports = router;
