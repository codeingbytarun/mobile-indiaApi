const dataStore = require('../utils/dataStore');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 9.1 GET /admin/shops/pending
const getPendingShops = async (req, res, next) => {
  try {
    const pendingShops = await dataStore.getPendingShops();

    const formatted = pendingShops.map((s) => ({
      id: s.customId || s.id,
      name: s.name,
      ownerName: s.ownerName,
      phone: s.phone,
      whatsapp: s.whatsapp,
      locality: s.locality,
      city: s.city,
      address: s.address,
      openHours: s.openHours,
      verified: s.verified,
      createdAt: s.createdAt
    }));

    return sendSuccess(res, formatted, 'Pending shops fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 9.2 PATCH /admin/shops/:id/verify
const verifyShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified = true, notes } = req.body;

    const shop = await dataStore.findShopByIdOrSlug(id);

    if (!shop) {
      return sendError(res, `Shop '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const shopId = shop.customId || shop.id || shop._id.toString();
    const updated = await dataStore.updateShop(shopId, {
      verified: Boolean(verified),
      ...(notes ? { notes } : {})
    });

    return sendSuccess(
      res,
      {
        id: shopId,
        name: updated.name,
        verified: updated.verified,
        notes: updated.notes
      },
      updated.verified ? 'Shop verified successfully' : 'Shop unverified',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 9.3 GET /admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const stats = await dataStore.getAdminStats();
    return sendSuccess(res, stats, 'Platform statistics fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 9.4 PATCH /admin/listings/:id/flag
const flagListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'hide', reason } = req.body;

    const phone = await dataStore.findPhoneById(id);

    if (!phone) {
      return sendError(res, `Listing '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    if (action === 'delete') {
      await dataStore.deletePhone(id);
      return sendSuccess(res, null, 'Listing deleted by admin', 200);
    }

    if (action === 'hide') {
      await dataStore.updatePhone(id, {
        isFlagged: true,
        flagReason: reason || 'Hidden by admin moderation'
      });
    } else if (action === 'restore') {
      await dataStore.updatePhone(id, {
        isFlagged: false,
        flagReason: ''
      });
    }

    return sendSuccess(
      res,
      { id, action, reason },
      'Listing status updated',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingShops,
  verifyShop,
  getAdminStats,
  flagListing
};
