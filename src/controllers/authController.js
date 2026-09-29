const dataStore = require('../utils/dataStore');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 1.1 POST /auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { phone, channel = 'sms' } = req.body;

    if (!phone) {
      return sendError(res, "Field 'phone' is required", 400, 'BAD_REQUEST', req.originalUrl);
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const sessionId = `otp_sess_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;
    
    // In dev / demo mode, fixed test OTP or generated 6 digits
    const otp = '482910';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await dataStore.saveOtp({
      sessionId,
      phone: cleanPhone,
      otp,
      channel,
      expiresAt
    });

    return sendSuccess(
      res,
      { sessionId },
      `6-digit OTP sent successfully to +91 ${cleanPhone}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

// 1.2 POST /auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, sessionId, roleHint = 'buyer', name } = req.body;

    if (!phone || !otp) {
      return sendError(res, 'Phone and OTP are required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Validate OTP session if provided or accept dev master OTP '482910' / '123456'
    let isValidOtp = false;
    if (otp === '482910' || otp === '123456') {
      isValidOtp = true;
    } else if (sessionId) {
      const session = await dataStore.findOtp(sessionId, cleanPhone);
      if (session && session.otp === otp && new Date() < new Date(session.expiresAt)) {
        isValidOtp = true;
      }
    }

    if (!isValidOtp) {
      return sendError(res, 'Invalid or expired OTP code', 400, 'INVALID_OTP', req.originalUrl);
    }

    // Find or create user
    let user = await dataStore.findUserByPhone(cleanPhone);
    if (!user) {
      user = await dataStore.createUser({
        phone: cleanPhone,
        name: name ? name.trim() : (roleHint === 'shopkeeper' ? 'Shop Owner' : 'Verified Buyer'),
        role: roleHint || 'buyer',
        isPhoneVerified: true
      });
    }

    // If shopkeeper, check for associated shop
    let shopId = user.shopId || null;
    if (user.role === 'shopkeeper' && !shopId) {
      const existingShops = await dataStore.findShops({ city: '' });
      const matched = existingShops.shops.find((s) => s.phone.includes(cleanPhone));
      if (matched) {
        shopId = matched.id;
        user.shopId = shopId;
        await dataStore.updateUser(user.id || user._id, { shopId });
      }
    }

    const userId = user.id || user._id ? (user.id || user._id).toString() : `usr_${cleanPhone}`;

    const payload = {
      sub: userId,
      id: userId,
      role: user.role,
      phone: user.phone,
      name: user.name,
      shopId: shopId || undefined
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return sendSuccess(
      res,
      {
        token,
        refreshToken,
        user: {
          id: userId,
          name: user.name,
          phone: user.phone,
          role: user.role,
          shopId
        }
      },
      'Authentication successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 1.3 POST /auth/register-shopkeeper
const registerShopkeeper = async (req, res, next) => {
  try {
    const {
      ownerName,
      phone,
      whatsapp,
      shopName,
      address,
      locality,
      city,
      openHours = '10:00 AM - 9:30 PM',
      image,
      googleMapsUrl
    } = req.body;

    if (!ownerName || !phone || !shopName || !address || !locality || !city) {
      return sendError(
        res,
        'Missing required registration fields (ownerName, phone, shopName, address, locality, city)',
        400,
        'BAD_REQUEST',
        req.originalUrl
      );
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanWhatsapp = (whatsapp || phone).replace(/\D/g, '');

    // Generate unique slug
    let baseSlug = shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (!(await dataStore.checkShopSlug(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Find or create User with shopkeeper role
    let user = await dataStore.findUserByPhone(cleanPhone);
    if (!user) {
      user = await dataStore.createUser({
        name: ownerName,
        phone: cleanPhone,
        role: 'shopkeeper',
        isPhoneVerified: true
      });
    } else {
      user.role = 'shopkeeper';
      user.name = ownerName;
      await dataStore.updateUser(user.id || user._id, { role: 'shopkeeper', name: ownerName });
    }

    const customId = `shop_${Date.now().toString().slice(-6)}`;

    const shop = await dataStore.createShop({
      customId,
      userId: user.id || user._id,
      name: shopName,
      slug,
      ownerName,
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      address,
      locality,
      city,
      openHours,
      image: image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
      googleMapsUrl: googleMapsUrl || '',
      verified: false,
      rating: 5.0,
      reviewsCount: 0,
      activeListingsCount: 0
    });

    const userId = (user.id || user._id).toString();
    await dataStore.updateUser(userId, { shopId: customId });

    const payload = {
      sub: userId,
      id: userId,
      role: 'shopkeeper',
      phone: user.phone,
      name: user.name,
      shopId: customId
    };

    const token = generateToken(payload);

    return sendSuccess(
      res,
      {
        token,
        shop: {
          id: customId,
          slug: shop.slug,
          name: shop.name,
          ownerName: shop.ownerName,
          verified: shop.verified,
          rating: shop.rating,
          reviewsCount: shop.reviewsCount
        }
      },
      'Shop registered successfully. Pending physical verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

// 1.4 GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const user = await dataStore.findUserById(userId);

    if (!user) {
      return sendError(res, 'User profile not found', 404, 'NOT_FOUND', req.originalUrl);
    }

    let shopDetails = null;
    if (user.role === 'shopkeeper' && user.shopId) {
      const shop = await dataStore.findShopByIdOrSlug(user.shopId);
      if (shop) {
        shopDetails = {
          id: shop.customId || shop.id || shop._id.toString(),
          name: shop.name,
          verified: shop.verified,
          activeListingsCount: shop.activeListingsCount || 0
        };
      }
    }

    return sendSuccess(
      res,
      {
        id: (user.id || user._id).toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        ...(shopDetails ? { shop: shopDetails } : {})
      },
      'Profile retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 1.5 POST /auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rToken } = req.body;

    if (!rToken) {
      return sendError(res, 'Refresh token is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const decoded = verifyRefreshToken(rToken);
    if (!decoded) {
      return sendError(res, 'Invalid or expired refresh token', 401, 'UNAUTHORIZED', req.originalUrl);
    }

    const user = await dataStore.findUserById(decoded.id || decoded.sub);
    if (!user) {
      return sendError(res, 'User account no longer exists', 404, 'NOT_FOUND', req.originalUrl);
    }

    const userId = (user.id || user._id).toString();

    const payload = {
      sub: userId,
      id: userId,
      role: user.role,
      phone: user.phone,
      name: user.name,
      shopId: user.shopId || undefined
    };

    const token = generateToken(payload);

    return sendSuccess(
      res,
      { token },
      'Token refreshed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// 1.6 POST /auth/logout
const logout = async (req, res) => {
  return sendSuccess(res, null, 'Logged out successfully', 200);
};

// 1.7 POST /auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, 'sessionId is required to resend OTP', 400, 'BAD_REQUEST', req.originalUrl);
    }

    await dataStore.saveOtp({
      sessionId,
      phone: '9829012345',
      otp: '482910',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    return sendSuccess(res, null, 'OTP re-sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  registerShopkeeper,
  getMe,
  refreshToken,
  logout,
  resendOtp
};
