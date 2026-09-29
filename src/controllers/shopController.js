const dataStore = require('../utils/dataStore');
const QRCode = require('qrcode');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 2.1 GET /shops
const getShops = async (req, res, next) => {
  try {
    const {
      city = 'Jaipur',
      locality,
      verifiedOnly,
      userLat,
      userLng,
      limit = 20,
      page = 1,
      q
    } = req.query;

    const result = await dataStore.findShops({
      city,
      locality,
      verifiedOnly,
      userLat,
      userLng,
      limit,
      page,
      q
    });

    return sendSuccess(res, result.shops, 'Shops fetched successfully', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

// 2.2 GET /shops/:idOrSlug
const getShopByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const shop = await dataStore.findShopByIdOrSlug(idOrSlug);

    if (!shop) {
      return sendError(res, `Shop '${idOrSlug}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const shopId = shop.customId || shop.id || shop._id.toString();

    // Fetch active phone listings of this shop
    const phonesResult = await dataStore.findPhones({ city: '' });
    const inventory = phonesResult.phones
      .filter((p) => (p.shopId === shopId || p.shopId === shop.customId) && !p.isSold)
      .map((ph) => ({
        id: ph.customId || ph.id || ph._id.toString(),
        brand: ph.brand,
        model: ph.model,
        storage: ph.storage,
        price: ph.price,
        condition: ph.condition,
        isSold: ph.isSold
      }));

    return sendSuccess(
      res,
      {
        shop: {
          id: shopId,
          name: shop.name,
          ownerName: shop.ownerName,
          verified: shop.verified,
          rating: shop.rating,
          reviewsCount: shop.reviewsCount,
          address: shop.address,
          locality: shop.locality,
          city: shop.city,
          phone: shop.phone,
          whatsapp: shop.whatsapp,
          image: shop.image,
          openHours: shop.openHours,
          googleMapsUrl: shop.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(shop.name)}`,
          slug: shop.slug
        },
        inventory
      },
      'Shop storefront profile fetched successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 2.3 PUT /shops/:id
const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await dataStore.findShopByIdOrSlug(id);

    if (!shop) {
      return sendError(res, `Shop '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const shopId = shop.customId || shop.id || shop._id.toString();

    // Check ownership if user is a shopkeeper
    if (req.user.role === 'shopkeeper' && req.user.shopId !== shopId) {
      return sendError(res, 'You do not have permission to modify this shop', 403, 'FORBIDDEN', req.originalUrl);
    }

    const allowedFields = ['name', 'openHours', 'address', 'locality', 'city', 'googleMapsUrl', 'image', 'whatsapp', 'phone'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updated = await dataStore.updateShop(shopId, updates);

    return sendSuccess(res, updated, 'Shop profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 2.4 GET /shops/:id/qr
const getShopQrCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await dataStore.findShopByIdOrSlug(id);

    if (!shop) {
      return sendError(res, `Shop '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const catalogUrl = `https://mobimarket.in/shop/${shop.slug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(catalogUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return sendSuccess(
      res,
      {
        qrCodeDataUrl,
        catalogUrl
      },
      'QR Code generated successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 2.5 GET /shops/:id/reviews
const getShopReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await dataStore.findShopByIdOrSlug(id);

    if (!shop) {
      return sendError(res, `Shop '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const shopId = shop.customId || shop.id || shop._id.toString();
    const reviews = await dataStore.findReviewsByShop(shopId);

    const formatted = reviews.map((r) => ({
      id: r.customId || r.id || r._id.toString(),
      buyerName: r.buyerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    }));

    return sendSuccess(res, formatted, 'Reviews fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 2.6 POST /shops/:id/reviews
const addShopReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return sendError(res, 'Rating and comment are required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const shop = await dataStore.findShopByIdOrSlug(id);
    if (!shop) {
      return sendError(res, `Shop '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const shopId = shop.customId || shop.id || shop._id.toString();
    const buyerName = req.user ? req.user.name : (req.body.buyerName || 'Verified Buyer');
    const buyerId = req.user ? (req.user.id || req.user.sub) : `usr_${Date.now()}`;

    const review = await dataStore.createReview({
      customId: `rev_${Date.now().toString().slice(-6)}`,
      shopId,
      buyerId,
      buyerName,
      rating: Number(rating),
      comment: comment.trim()
    });

    // Update shop rating
    const allReviews = await dataStore.findReviewsByShop(shopId);
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    await dataStore.updateShop(shopId, {
      rating: avgRating,
      reviewsCount: allReviews.length
    });

    return sendSuccess(
      res,
      { review },
      `Thank you for reviewing ${shop.name}!`,
      201
    );
  } catch (error) {
    next(error);
  }
};

// 2.7 GET /shops/check-slug/:slug
const checkSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return sendError(res, 'Slug parameter is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const isAvailable = await dataStore.checkShopSlug(slug);

    return sendSuccess(
      res,
      { isAvailable },
      isAvailable ? 'Slug is available' : 'Slug is already taken',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShops,
  getShopByIdOrSlug,
  updateShop,
  getShopQrCode,
  getShopReviews,
  addShopReview,
  checkSlug
};
