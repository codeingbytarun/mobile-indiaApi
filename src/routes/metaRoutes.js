const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');

// 8.1 GET /meta/cities
router.get('/cities', metaController.getCities);

// 8.2 GET /meta/brands
router.get('/brands', metaController.getBrands);

// 8.3 GET /meta/price-estimator
router.get('/price-estimator', metaController.getPriceEstimate);

module.exports = router;
