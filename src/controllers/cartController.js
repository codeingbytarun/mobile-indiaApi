const dataStore = require('../utils/dataStore');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 4.1 GET /buyer/cart
const getCart = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    const cart = await dataStore.getCart(buyerId);
    return sendSuccess(res, cart, 'Cart fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 4.2 POST /buyer/cart
const addToCart = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    const { phoneId } = req.body;

    if (!phoneId) {
      return sendError(res, 'Field phoneId is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const phone = await dataStore.findPhoneById(phoneId);
    if (!phone) {
      return sendError(res, `Phone listing '${phoneId}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (phone.isSold) {
      return sendError(res, 'This phone has already been sold', 400, 'PHONE_ALREADY_SOLD', req.originalUrl);
    }

    const cartCount = await dataStore.addToCart(buyerId, phone.customId || phone.id);

    return sendSuccess(res, { cartCount }, 'Phone added to cart', 200);
  } catch (error) {
    next(error);
  }
};

// 4.3 DELETE /buyer/cart/:phoneId
const removeFromCart = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    const { phoneId } = req.params;

    await dataStore.removeFromCart(buyerId, phoneId);

    return sendSuccess(res, null, 'Item removed from cart', 200);
  } catch (error) {
    next(error);
  }
};

// 4.4 DELETE /buyer/cart
const clearCart = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    await dataStore.clearCart(buyerId);

    return sendSuccess(res, null, 'Cart cleared', 200);
  } catch (error) {
    next(error);
  }
};

// 4.5 POST /buyer/cart/sync
const syncCart = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    const { phoneIds = [] } = req.body;

    if (!Array.isArray(phoneIds)) {
      return sendError(res, 'phoneIds must be an array of strings', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const itemsCount = await dataStore.syncCart(buyerId, phoneIds);

    return sendSuccess(res, { itemsCount }, 'Cart synchronized successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  syncCart
};
