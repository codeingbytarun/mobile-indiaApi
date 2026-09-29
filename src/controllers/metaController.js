const { estimatePrice } = require('../utils/priceEstimator');
const { sendSuccess } = require('../utils/responseEnvelope');

// 8.1 GET /meta/cities
const getCities = (req, res) => {
  const cities = [
    {
      name: 'Jaipur',
      state: 'Rajasthan',
      centerLat: 26.9124,
      centerLng: 75.7873,
      localities: [
        'Malviya Nagar',
        'Raja Park',
        'Mansarovar',
        'Vaishali Nagar',
        'C-Scheme',
        'Tonk Road',
        'MI Road',
        'Jagatpura'
      ]
    },
    {
      name: 'Delhi NCR',
      state: 'Delhi',
      centerLat: 28.6139,
      centerLng: 77.209,
      localities: [
        'Nehru Place',
        'Karol Bagh',
        'Lajpat Nagar',
        'Noida',
        'Gurugram',
        'Dwarka',
        'Laxmi Nagar'
      ]
    },
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      centerLat: 19.076,
      centerLng: 72.8777,
      localities: [
        'Lamington Road',
        'Bandra',
        'Andheri',
        'Thane',
        'Dadar',
        'Borivali'
      ]
    },
    {
      name: 'Bengaluru',
      state: 'Karnataka',
      centerLat: 12.9716,
      centerLng: 77.5946,
      localities: [
        'SP Road',
        'Koramangala',
        'Indiranagar',
        'HSR Layout',
        'Whitefield',
        'Jayanagar'
      ]
    }
  ];

  return sendSuccess(res, cities, 'Cities master catalog fetched successfully', 200);
};

// 8.2 GET /meta/brands
const getBrands = (req, res) => {
  const brands = [
    {
      brand: 'Apple',
      models: [
        'iPhone 15 Pro Max',
        'iPhone 15 Pro',
        'iPhone 15 Plus',
        'iPhone 15',
        'iPhone 14 Pro Max',
        'iPhone 14 Pro',
        'iPhone 14',
        'iPhone 13 Pro Max',
        'iPhone 13 Pro',
        'iPhone 13',
        'iPhone 12 Pro',
        'iPhone 12',
        'iPhone 11'
      ]
    },
    {
      brand: 'Samsung',
      models: [
        'Galaxy S24 Ultra',
        'Galaxy S24+',
        'Galaxy S24',
        'Galaxy S23 Ultra',
        'Galaxy S23',
        'Galaxy S22 Ultra',
        'Galaxy S21 FE',
        'Galaxy A54 5G',
        'Galaxy A34 5G',
        'Galaxy Z Fold 5',
        'Galaxy Z Flip 5'
      ]
    },
    {
      brand: 'OnePlus',
      models: [
        'OnePlus 12',
        'OnePlus 12R',
        'OnePlus 11 5G',
        'OnePlus 11R 5G',
        'OnePlus 10 Pro',
        'OnePlus 10T',
        'OnePlus Nord CE 3',
        'OnePlus Nord 3'
      ]
    },
    {
      brand: 'Google',
      models: [
        'Pixel 8 Pro',
        'Pixel 8',
        'Pixel 7 Pro',
        'Pixel 7',
        'Pixel 7a',
        'Pixel 6a'
      ]
    },
    {
      brand: 'Xiaomi',
      models: [
        'Xiaomi 14 Ultra',
        'Xiaomi 14',
        'Xiaomi 13 Pro',
        'Redmi Note 13 Pro+',
        'Redmi Note 12 Pro'
      ]
    },
    {
      brand: 'Vivo',
      models: [
        'Vivo X100 Pro',
        'Vivo X90 Pro',
        'Vivo X90 5G',
        'Vivo V29 Pro',
        'Vivo V27 5G'
      ]
    },
    {
      brand: 'Realme',
      models: [
        'Realme GT 5 Pro',
        'Realme GT 2 Pro',
        'Realme 12 Pro+ 5G',
        'Realme 11 Pro+'
      ]
    }
  ];

  return sendSuccess(res, brands, 'Brands and models catalog fetched successfully', 200);
};

// 8.3 GET /meta/price-estimator
const getPriceEstimate = (req, res) => {
  const { model, storage = '128GB', condition = 'Like New', batteryHealth = 89 } = req.query;

  const estimate = estimatePrice({
    model,
    storage,
    condition,
    batteryHealth
  });

  return sendSuccess(res, estimate, 'Fair-market valuation calculated successfully', 200);
};

module.exports = {
  getCities,
  getBrands,
  getPriceEstimate
};
