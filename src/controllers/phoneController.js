const dataStore = require('../utils/dataStore');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 3.1 GET /phones
const getPhones = async (req, res, next) => {
  try {
    const {
      city = 'Jaipur',
      q,
      brand,
      minPrice,
      maxPrice,
      condition,
      storage,
      maxDistanceKm,
      onlyBillBox,
      onlyWithWarranty,
      sortBy = 'newest',
      page = 1,
      limit = 24
    } = req.query;

    const result = await dataStore.findPhones({
      city,
      q,
      brand,
      minPrice,
      maxPrice,
      condition,
      storage,
      maxDistanceKm,
      onlyBillBox,
      onlyWithWarranty,
      sortBy,
      page,
      limit
    });

    return sendSuccess(res, result.phones, 'Phone listings fetched successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

// 3.2 GET /phones/featured
const getFeaturedPhones = async (req, res, next) => {
  try {
    const { city = 'Jaipur' } = req.query;
    const phones = await dataStore.findFeaturedPhones(city);
    return sendSuccess(res, phones, 'Featured phones fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 3.3 GET /phones/:id
const getPhoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const phone = await dataStore.findPhoneById(id);

    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    // Increment views
    const newViews = (phone.viewsCount || 0) + 1;
    await dataStore.updatePhone(id, { viewsCount: newViews });
    phone.viewsCount = newViews;

    return sendSuccess(res, phone, 'Phone listing fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 3.4 GET /phones/compare
const comparePhones = async (req, res, next) => {
  try {
    const { model, city = 'Jaipur' } = req.query;

    if (!model) {
      return sendError(res, "Query parameter 'model' is required for comparison", 400, 'BAD_REQUEST', req.originalUrl);
    }

    const listings = await dataStore.comparePhoneModel(model, city);

    if (!listings.length) {
      return sendSuccess(
        res,
        {
          model,
          lowestPrice: 0,
          highestSavings: 0,
          shopsCount: 0,
          listings: []
        },
        'No listings found for comparison',
        200
      );
    }

    const lowestPrice = listings[0].price;
    const highestSavings = listings.reduce((max, item) => Math.max(max, (item.mrp || item.price) - item.price), 0);
    const uniqueShops = new Set(listings.map((item) => item.shopId)).size;

    const formattedListings = listings.map((l) => ({
      id: l.customId || l.id || l._id.toString(),
      shopName: l.shopName,
      price: l.price,
      condition: l.condition,
      batteryHealth: l.batteryHealth,
      billBoxAvailable: l.billBoxAvailable,
      warranty: l.warranty,
      shopDistanceKm: l.shopDistanceKm || 1.0
    }));

    return sendSuccess(
      res,
      {
        model,
        lowestPrice,
        highestSavings,
        shopsCount: uniqueShops,
        listings: formattedListings
      },
      'Phone comparison data fetched successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 3.5 POST /phones
const createPhone = async (req, res, next) => {
  try {
    const {
      brand,
      model,
      ram = '8GB',
      storage,
      color = 'Standard',
      price,
      mrp,
      condition = 'Like New',
      batteryHealth = 90,
      billBoxAvailable = false,
      warranty = 'Testing Warranty',
      images = [],
      isFeatured = false
    } = req.body;

    if (!brand || !model || !storage || price === undefined || mrp === undefined) {
      return sendError(
        res,
        'Missing required fields: brand, model, storage, price, mrp',
        400,
        'BAD_REQUEST',
        req.originalUrl
      );
    }

    const shopId = req.user.shopId || 'shop_01';
    const shop = await dataStore.findShopByIdOrSlug(shopId);

    const shopName = shop ? shop.name : 'Verified Shop';
    const shopLocality = shop ? shop.locality : 'Malviya Nagar';
    const shopCity = shop ? shop.city : 'Jaipur';
    const shopPhone = shop ? shop.phone : req.user.phone;
    const shopWhatsapp = shop ? shop.whatsapp : req.user.phone;

    const customId = `ph_${Date.now()}`;

    const newPhone = await dataStore.createPhone({
      customId,
      brand,
      model,
      ram,
      storage,
      color,
      price: Number(price),
      mrp: Number(mrp),
      condition,
      batteryHealth: Number(batteryHealth),
      billBoxAvailable: Boolean(billBoxAvailable),
      warranty,
      shopId,
      shopName,
      shopLocality,
      shopCity,
      shopPhone,
      shopWhatsapp,
      shopDistanceKm: 1.0,
      images,
      isSold: false,
      isFeatured: Boolean(isFeatured),
      viewsCount: 1,
      leadsCount: 0
    });

    if (shop) {
      await dataStore.updateShop(shopId, {
        activeListingsCount: (shop.activeListingsCount || 0) + 1
      });
    }

    return sendSuccess(
      res,
      {
        id: customId,
        isSold: false,
        viewsCount: 1,
        leadsCount: 0
      },
      'Listing published successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// 3.6 PUT /phones/:id
const updatePhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const phone = await dataStore.findPhoneById(id);

    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (req.user.role === 'shopkeeper' && phone.shopId !== req.user.shopId) {
      return sendError(res, 'You do not have permission to modify this listing', 403, 'FORBIDDEN', req.originalUrl);
    }

    const allowedFields = [
      'brand',
      'model',
      'ram',
      'storage',
      'color',
      'price',
      'mrp',
      'condition',
      'batteryHealth',
      'billBoxAvailable',
      'warranty',
      'images',
      'isFeatured'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updated = await dataStore.updatePhone(id, updates);

    return sendSuccess(res, updated, 'Listing updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 3.7 PATCH /phones/:id/price
const updatePhonePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (price === undefined || isNaN(price) || price < 0) {
      return sendError(res, 'Valid positive price is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const phone = await dataStore.findPhoneById(id);
    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (req.user.role === 'shopkeeper' && phone.shopId !== req.user.shopId) {
      return sendError(res, 'You do not have permission to modify this listing', 403, 'FORBIDDEN', req.originalUrl);
    }

    await dataStore.updatePhone(id, { price: Number(price) });

    return sendSuccess(res, null, `Price updated to ₹${Number(price).toLocaleString('en-IN')}`, 200);
  } catch (error) {
    next(error);
  }
};

// 3.8 PATCH /phones/:id/sold
const togglePhoneSoldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isSold } = req.body;

    const phone = await dataStore.findPhoneById(id);
    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (req.user.role === 'shopkeeper' && phone.shopId !== req.user.shopId) {
      return sendError(res, 'You do not have permission to modify this listing', 403, 'FORBIDDEN', req.originalUrl);
    }

    const nextSold = isSold !== undefined ? Boolean(isSold) : !phone.isSold;
    await dataStore.updatePhone(id, { isSold: nextSold });

    return sendSuccess(
      res,
      { isSold: nextSold },
      nextSold ? 'Listing marked as Sold' : 'Listing marked as Active',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 3.9 PATCH /phones/:id/images
const updatePhoneImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return sendError(res, 'Images must be an array of URL strings', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const phone = await dataStore.findPhoneById(id);
    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (req.user.role === 'shopkeeper' && phone.shopId !== req.user.shopId) {
      return sendError(res, 'You do not have permission to modify this listing', 403, 'FORBIDDEN', req.originalUrl);
    }

    await dataStore.updatePhone(id, { images });

    return sendSuccess(res, { images }, 'Images updated', 200);
  } catch (error) {
    next(error);
  }
};

// 3.10 DELETE /phones/:id
const deletePhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const phone = await dataStore.findPhoneById(id);

    if (!phone) {
      return sendError(res, `Phone listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (req.user.role === 'shopkeeper' && phone.shopId !== req.user.shopId) {
      return sendError(res, 'You do not have permission to delete this listing', 403, 'FORBIDDEN', req.originalUrl);
    }

    await dataStore.deletePhone(id);

    return sendSuccess(res, null, 'Listing deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPhones,
  getFeaturedPhones,
  getPhoneById,
  comparePhones,
  createPhone,
  updatePhone,
  updatePhonePrice,
  togglePhoneSoldStatus,
  updatePhoneImages,
  deletePhone
};
