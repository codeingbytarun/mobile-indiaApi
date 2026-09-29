const dataStore = require('../utils/dataStore');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 5.1 POST /leads
const createLead = async (req, res, next) => {
  try {
    const { phoneId, channel = 'whatsapp' } = req.body;

    if (!phoneId) {
      return sendError(res, 'Field phoneId is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const phone = await dataStore.findPhoneById(phoneId);
    if (!phone) {
      return sendError(res, `Phone listing '${phoneId}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    const buyerName = req.user ? req.user.name : (req.body.buyerName || 'a verified buyer');
    const buyerPhone = req.user ? req.user.phone : (req.body.buyerPhone || '9829000000');
    const buyerId = req.user ? (req.user.id || req.user.sub) : null;

    const leadCustomId = `lead_${Math.floor(1000 + Math.random() * 9000)}`;

    await dataStore.createLead({
      customId: leadCustomId,
      phoneId: phone.customId || phone.id,
      shopId: phone.shopId,
      buyerId,
      buyerName,
      buyerPhone,
      phoneModel: `${phone.brand} ${phone.model} ${phone.storage}`,
      price: phone.price,
      channel,
      status: 'New'
    });

    // Increment leads count on phone
    const newLeadsCount = (phone.leadsCount || 0) + 1;
    await dataStore.updatePhone(phone.customId || phone.id, { leadsCount: newLeadsCount });

    // Format WhatsApp or Call Deep Link
    let redirectUrl = '';
    if (channel === 'call') {
      redirectUrl = `tel:${phone.shopPhone}`;
    } else {
      const cleanWa = (phone.shopWhatsapp || '919829012345').replace(/\D/g, '');
      const text = `Namaste ${phone.shopName}! I am ${buyerName}. I saw your ${phone.brand} ${phone.model} (${phone.storage}) for ₹${phone.price.toLocaleString('en-IN')} on MobiMarket. Is this phone currently available at your shop?`;
      redirectUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`;
    }

    return sendSuccess(
      res,
      {
        leadId: leadCustomId,
        redirectUrl
      },
      'Lead recorded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// 5.2 GET /leads/shop/:shopId
const getShopLeads = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (req.user && req.user.role === 'shopkeeper' && req.user.shopId !== shopId) {
      return sendError(res, 'Access denied to this shop CRM', 403, 'FORBIDDEN', req.originalUrl);
    }

    const leads = await dataStore.findLeadsByShop(shopId);

    const formatted = leads.map((l) => ({
      id: l.customId || l.id,
      buyerName: l.buyerName,
      buyerPhone: l.buyerPhone,
      phoneModel: l.phoneModel,
      price: l.price,
      channel: l.channel,
      status: l.status,
      createdAt: l.createdAt
    }));

    return sendSuccess(res, formatted, 'Shop inquiries fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

// 5.3 PATCH /leads/:id/status
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Contacted', 'Visited Store', 'Sold', 'Lost'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(
        res,
        `Status must be one of: [${validStatuses.join(', ')}]`,
        400,
        'BAD_REQUEST',
        req.originalUrl
      );
    }

    const updated = await dataStore.updateLeadStatus(id, status);
    if (!updated) {
      return sendError(res, `Lead '${id}' not found`, 404, 'NOT_FOUND', req.originalUrl);
    }

    return sendSuccess(res, { status: updated.status }, 'Lead status updated', 200);
  } catch (error) {
    next(error);
  }
};

// 5.4 GET /leads/buyer/my-inquiries
const getBuyerInquiries = async (req, res, next) => {
  try {
    const buyerId = req.user.id || req.user.sub;
    const buyerPhone = req.user.phone;

    const leads = await dataStore.findLeadsByBuyer(buyerId, buyerPhone);

    return sendSuccess(res, leads, 'Buyer inquiries fetched successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getShopLeads,
  updateLeadStatus,
  getBuyerInquiries
};
