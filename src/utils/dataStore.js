const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const PhoneListing = require('../models/PhoneListing');
const Review = require('../models/Review');
const Lead = require('../models/Lead');
const CartItem = require('../models/CartItem');
const OtpSession = require('../models/OtpSession');
const { calculateDistanceKm } = require('./distance');
const { seedUsers, seedShops, seedPhones, seedReviews, seedLeads } = require('./seedData');

// In-Memory store for when MongoDB is not yet connected
const memoryStore = {
  users: [...seedUsers.map((u, i) => ({ ...u, id: `usr_${100 + i}`, _id: `usr_${100 + i}` }))],
  shops: [...seedShops.map((s) => ({ ...s, id: s.customId }))],
  phones: [...seedPhones.map((p) => ({ ...p, id: p.customId }))],
  reviews: [...seedReviews.map((r) => ({ ...r, id: r.customId, createdAt: new Date().toISOString() }))],
  leads: [...seedLeads.map((l) => ({ ...l, id: l.customId, createdAt: new Date().toISOString() }))],
  cart: [],
  otpSessions: []
};

const isDbReady = () => mongoose.connection.readyState === 1;

const dataStore = {
  isDbReady,

  // --- OTP Operations ---
  async saveOtp(otpData) {
    if (isDbReady()) {
      return await OtpSession.create(otpData);
    }
    const existingIdx = memoryStore.otpSessions.findIndex((s) => s.sessionId === otpData.sessionId);
    if (existingIdx >= 0) {
      memoryStore.otpSessions[existingIdx] = { ...memoryStore.otpSessions[existingIdx], ...otpData };
      return memoryStore.otpSessions[existingIdx];
    }
    memoryStore.otpSessions.push({ ...otpData });
    return otpData;
  },

  async findOtp(sessionId, identifier) {
    if (isDbReady()) {
      const query = { sessionId };
      if (identifier) {
        query.$or = [
          { phone: identifier },
          { email: identifier.toString().trim().toLowerCase() }
        ];
      }
      return await OtpSession.findOne(query);
    }
    return memoryStore.otpSessions.find(
      (s) =>
        s.sessionId === sessionId &&
        (!identifier ||
          s.phone === identifier ||
          (s.email && s.email.toLowerCase() === identifier.toString().trim().toLowerCase()))
    );
  },

  // --- User Operations ---
  async findUserByPhone(phone) {
    if (!phone) return null;
    if (isDbReady()) {
      return await User.findOne({ phone });
    }
    return memoryStore.users.find((u) => u.phone === phone);
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toString().trim().toLowerCase();
    if (isDbReady()) {
      return await User.findOne({ email: cleanEmail });
    }
    return memoryStore.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
  },

  async findUserByIdentifier({ phone, email }) {
    if (isDbReady()) {
      const orConditions = [];
      if (phone) orConditions.push({ phone });
      if (email) orConditions.push({ email: email.toString().trim().toLowerCase() });
      if (orConditions.length === 0) return null;
      return await User.findOne({ $or: orConditions });
    }
    return memoryStore.users.find(
      (u) =>
        (phone && u.phone === phone) ||
        (email && u.email && u.email.toLowerCase() === email.toString().trim().toLowerCase())
    );
  },

  async findUserById(id) {
    if (isDbReady()) {
      return await User.findById(id);
    }
    return memoryStore.users.find((u) => u.id === id || u._id === id);
  },

  async createUser(userData) {
    if (isDbReady()) {
      return await User.create(userData);
    }
    const newUser = {
      ...userData,
      id: `usr_${Date.now().toString().slice(-4)}`,
      _id: `usr_${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  async updateUser(id, updates) {
    if (isDbReady()) {
      return await User.findByIdAndUpdate(id, updates, { new: true });
    }
    const user = memoryStore.users.find((u) => u.id === id || u._id === id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  },

  // --- Shop Operations ---
  async findShops({ city, locality, verifiedOnly, q, limit = 20, page = 1, userLat, userLng }) {
    if (isDbReady()) {
      const query = {};
      if (city) query.city = new RegExp(`^${city}$`, 'i');
      if (locality) query.locality = new RegExp(locality, 'i');
      if (verifiedOnly === 'true' || verifiedOnly === true) query.verified = true;
      if (q) {
        query.$or = [
          { name: new RegExp(q, 'i') },
          { ownerName: new RegExp(q, 'i') },
          { locality: new RegExp(q, 'i') },
          { address: new RegExp(q, 'i') }
        ];
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const skip = (pageNum - 1) * limitNum;

      const [shops, total] = await Promise.all([
        Shop.find(query).skip(skip).limit(limitNum).lean(),
        Shop.countDocuments(query)
      ]);

      const formatted = shops.map((s) => {
        let distanceKm = 1.0;
        if (userLat && userLng && s.lat && s.lng) {
          distanceKm = calculateDistanceKm(parseFloat(userLat), parseFloat(userLng), s.lat, s.lng);
        }
        return {
          id: s.customId || s._id.toString(),
          name: s.name,
          ownerName: s.ownerName,
          verified: s.verified,
          rating: s.rating,
          reviewsCount: s.reviewsCount,
          address: s.address,
          locality: s.locality,
          city: s.city,
          phone: s.phone,
          whatsapp: s.whatsapp,
          image: s.image,
          openHours: s.openHours,
          distanceKm,
          activeListingsCount: s.activeListingsCount || 0,
          lat: s.lat,
          lng: s.lng,
          slug: s.slug,
          googleMapsUrl: s.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(s.name + ' ' + s.locality)}`
        };
      });

      return { shops: formatted, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    }

    // In-Memory filtering
    let list = [...memoryStore.shops];
    if (city) list = list.filter((s) => s.city.toLowerCase() === city.toLowerCase());
    if (locality) list = list.filter((s) => s.locality.toLowerCase().includes(locality.toLowerCase()));
    if (verifiedOnly === 'true' || verifiedOnly === true) list = list.filter((s) => s.verified);
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          s.ownerName.toLowerCase().includes(qLower) ||
          s.locality.toLowerCase().includes(qLower) ||
          s.address.toLowerCase().includes(qLower)
      );
    }

    const total = list.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum).map((s) => {
      let distanceKm = s.distanceKm || 1.0;
      if (userLat && userLng && s.lat && s.lng) {
        distanceKm = calculateDistanceKm(parseFloat(userLat), parseFloat(userLng), s.lat, s.lng);
      }
      return {
        ...s,
        id: s.customId || s.id,
        distanceKm
      };
    });

    return { shops: paginated, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  async findShopByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toString().trim().toLowerCase();
    if (isDbReady()) {
      return await Shop.findOne({ email: cleanEmail });
    }
    return memoryStore.shops.find((s) => s.email && s.email.toLowerCase() === cleanEmail);
  },

  async findShopByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (isDbReady()) {
      return await Shop.findOne({ phone: new RegExp(cleanPhone) });
    }
    return memoryStore.shops.find((s) => s.phone && s.phone.includes(cleanPhone));
  },

  async findShopByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    if (isDbReady()) {
      return await Shop.findOne({
        $or: [
          { customId: idOrSlug },
          { slug: idOrSlug.toLowerCase() },
          { _id: idOrSlug.length === 24 ? idOrSlug : null }
        ]
      });
    }
    const lower = idOrSlug.toLowerCase();
    return memoryStore.shops.find((s) => s.customId === idOrSlug || s.id === idOrSlug || s.slug === lower);
  },

  async createShop(shopData) {
    if (isDbReady()) {
      return await Shop.create(shopData);
    }
    const newShop = {
      ...shopData,
      id: shopData.customId,
      createdAt: new Date().toISOString()
    };
    memoryStore.shops.push(newShop);
    return newShop;
  },

  async updateShop(id, updates) {
    if (isDbReady()) {
      const shop = await Shop.findOne({
        $or: [{ customId: id }, { slug: id.toLowerCase() }, { _id: id.length === 24 ? id : null }]
      });
      if (!shop) return null;
      Object.assign(shop, updates);
      await shop.save();
      return shop;
    }
    const shop = memoryStore.shops.find((s) => s.customId === id || s.id === id || s.slug === id.toLowerCase());
    if (shop) Object.assign(shop, updates);
    return shop;
  },

  async checkShopSlug(slug) {
    if (!slug) return false;
    const lower = slug.toLowerCase().trim();
    if (isDbReady()) {
      const existing = await Shop.findOne({ slug: lower });
      return !existing;
    }
    return !memoryStore.shops.some((s) => s.slug === lower);
  },

  // --- Phone Operations ---
  async findPhones({
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
    limit = 24,
    shopId,
    includeSold
  }) {
    if (isDbReady()) {
      const query = { isFlagged: { $ne: true } };
      if (!includeSold || includeSold === 'false') {
        query.isSold = false;
      }
      if (shopId) {
        query.shopId = shopId;
      }
      if (city && (!shopId || city.trim() !== '')) {
        query.shopCity = new RegExp(`^${city}$`, 'i');
      }
      if (brand) query.brand = brand;
      if (condition) query.condition = condition;
      if (storage) query.storage = storage;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      if (onlyBillBox === 'true' || onlyBillBox === true) query.billBoxAvailable = true;
      if (onlyWithWarranty === 'true' || onlyWithWarranty === true) {
        query.warranty = { $nin: ['', null, 'No Warranty'] };
      }
      if (maxDistanceKm) query.shopDistanceKm = { $lte: Number(maxDistanceKm) };
      if (q) {
        const regex = new RegExp(q, 'i');
        query.$or = [{ brand: regex }, { model: regex }, { color: regex }, { shopName: regex }, { shopLocality: regex }];
      }

      let sort = { createdAt: -1 };
      if (sortBy === 'price_asc') sort = { price: 1 };
      else if (sortBy === 'price_desc') sort = { price: -1 };
      else if (sortBy === 'distance_asc') sort = { shopDistanceKm: 1 };

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const skip = (pageNum - 1) * limitNum;

      const [phones, total] = await Promise.all([
        PhoneListing.find(query).sort(sort).skip(skip).limit(limitNum),
        PhoneListing.countDocuments(query)
      ]);

      return { phones, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    }

    // In-memory
    let list = memoryStore.phones.filter((p) => !p.isFlagged);
    if (!includeSold || includeSold === 'false') {
      list = list.filter((p) => !p.isSold);
    }
    if (shopId) {
      list = list.filter((p) => p.shopId === shopId);
    }
    if (city && (!shopId || city.trim() !== '')) {
      list = list.filter((p) => p.shopCity.toLowerCase() === city.toLowerCase());
    }
    if (brand) list = list.filter((p) => p.brand === brand);
    if (condition) list = list.filter((p) => p.condition === condition);
    if (storage) list = list.filter((p) => p.storage === storage);
    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
    if (onlyBillBox === 'true' || onlyBillBox === true) list = list.filter((p) => p.billBoxAvailable);
    if (onlyWithWarranty === 'true' || onlyWithWarranty === true) list = list.filter((p) => p.warranty && p.warranty !== 'No Warranty');
    if (maxDistanceKm) list = list.filter((p) => (p.shopDistanceKm || 1) <= Number(maxDistanceKm));
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.brand.toLowerCase().includes(qLower) ||
          p.model.toLowerCase().includes(qLower) ||
          p.color.toLowerCase().includes(qLower) ||
          p.shopName.toLowerCase().includes(qLower) ||
          p.shopLocality.toLowerCase().includes(qLower)
      );
    }

    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'distance_asc') list.sort((a, b) => (a.shopDistanceKm || 1) - (b.shopDistanceKm || 1));

    const total = list.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum).map((p) => ({
      ...p,
      id: p.customId || p.id
    }));

    return { phones: paginated, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  async findFeaturedPhones(city = 'Jaipur') {
    if (isDbReady()) {
      const query = { isSold: false, isFlagged: { $ne: true }, isFeatured: true };
      if (city) query.shopCity = new RegExp(`^${city}$`, 'i');
      return await PhoneListing.find(query).limit(10).sort({ viewsCount: -1 });
    }
    return memoryStore.phones
      .filter((p) => !p.isSold && !p.isFlagged && p.isFeatured && (!city || p.shopCity.toLowerCase() === city.toLowerCase()))
      .slice(0, 10)
      .map((p) => ({ ...p, id: p.customId || p.id }));
  },

  async findPhoneById(id) {
    if (!id) return null;
    if (isDbReady()) {
      return await PhoneListing.findOne({
        $or: [{ customId: id }, { _id: id.length === 24 ? id : null }]
      });
    }
    return memoryStore.phones.find((p) => p.customId === id || p.id === id);
  },

  async createPhone(data) {
    if (isDbReady()) {
      return await PhoneListing.create(data);
    }
    const newPhone = {
      ...data,
      id: data.customId,
      createdAt: new Date().toISOString()
    };
    memoryStore.phones.unshift(newPhone);
    return newPhone;
  },

  async updatePhone(id, updates) {
    if (isDbReady()) {
      const phone = await PhoneListing.findOne({
        $or: [{ customId: id }, { _id: id.length === 24 ? id : null }]
      });
      if (!phone) return null;
      Object.assign(phone, updates);
      await phone.save();
      return phone;
    }
    const phone = memoryStore.phones.find((p) => p.customId === id || p.id === id);
    if (phone) Object.assign(phone, updates);
    return phone;
  },

  async deletePhone(id) {
    if (isDbReady()) {
      await PhoneListing.deleteOne({
        $or: [{ customId: id }, { _id: id.length === 24 ? id : null }]
      });
      await CartItem.deleteMany({ phoneId: id });
      return true;
    }
    const idx = memoryStore.phones.findIndex((p) => p.customId === id || p.id === id);
    if (idx >= 0) memoryStore.phones.splice(idx, 1);
    memoryStore.cart = memoryStore.cart.filter((c) => c.phoneId !== id);
    return true;
  },

  async comparePhoneModel(model, city = 'Jaipur') {
    const modelLower = (model || '').toLowerCase().trim();
    if (isDbReady()) {
      const query = {
        isSold: false,
        isFlagged: { $ne: true },
        model: new RegExp(modelLower, 'i')
      };
      if (city) query.shopCity = new RegExp(`^${city}$`, 'i');
      return await PhoneListing.find(query).sort({ price: 1 });
    }
    return memoryStore.phones
      .filter((p) => !p.isSold && !p.isFlagged && p.model.toLowerCase().includes(modelLower) && (!city || p.shopCity.toLowerCase() === city.toLowerCase()))
      .sort((a, b) => a.price - b.price);
  },

  // --- Cart Operations ---
  async getCart(buyerId) {
    let phoneIds = [];
    if (isDbReady()) {
      const entries = await CartItem.find({ buyerId }).sort({ createdAt: -1 });
      phoneIds = entries.map((e) => e.phoneId);
    } else {
      phoneIds = memoryStore.cart.filter((c) => c.buyerId === buyerId).map((c) => c.phoneId);
    }

    const items = [];
    for (const phId of phoneIds) {
      const phone = await this.findPhoneById(phId);
      if (phone && !phone.isSold) {
        items.push({
          id: phone.customId || phone.id,
          brand: phone.brand,
          model: phone.model,
          storage: phone.storage,
          price: phone.price,
          mrp: phone.mrp,
          condition: phone.condition,
          images: phone.images,
          shopId: phone.shopId,
          shopName: phone.shopName,
          shopLocality: phone.shopLocality,
          shopCity: phone.shopCity,
          shopPhone: phone.shopPhone,
          shopWhatsapp: phone.shopWhatsapp
        });
      }
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const totalMrp = items.reduce((sum, item) => sum + (item.mrp || item.price), 0);
    const totalSavings = Math.max(0, totalMrp - totalPrice);

    return {
      itemsCount: items.length,
      totalPrice,
      totalMrp,
      totalSavings,
      items
    };
  },

  async addToCart(buyerId, phoneId) {
    if (isDbReady()) {
      await CartItem.findOneAndUpdate({ buyerId, phoneId }, { buyerId, phoneId }, { upsert: true });
      return await CartItem.countDocuments({ buyerId });
    }
    if (!memoryStore.cart.some((c) => c.buyerId === buyerId && c.phoneId === phoneId)) {
      memoryStore.cart.push({ buyerId, phoneId, createdAt: new Date().toISOString() });
    }
    return memoryStore.cart.filter((c) => c.buyerId === buyerId).length;
  },

  async removeFromCart(buyerId, phoneId) {
    if (isDbReady()) {
      await CartItem.deleteOne({ buyerId, phoneId });
    } else {
      memoryStore.cart = memoryStore.cart.filter((c) => !(c.buyerId === buyerId && c.phoneId === phoneId));
    }
    return true;
  },

  async clearCart(buyerId) {
    if (isDbReady()) {
      await CartItem.deleteMany({ buyerId });
    } else {
      memoryStore.cart = memoryStore.cart.filter((c) => c.buyerId !== buyerId);
    }
    return true;
  },

  async syncCart(buyerId, phoneIds) {
    for (const id of phoneIds) {
      await this.addToCart(buyerId, id);
    }
    const cart = await this.getCart(buyerId);
    return cart.itemsCount;
  },

  // --- Lead Operations ---
  async createLead(leadData) {
    if (isDbReady()) {
      return await Lead.create(leadData);
    }
    const newLead = { ...leadData, id: leadData.customId, createdAt: new Date().toISOString() };
    memoryStore.leads.unshift(newLead);
    return newLead;
  },

  async findLeadsByShop(shopId) {
    if (isDbReady()) {
      return await Lead.find({ shopId }).sort({ createdAt: -1 });
    }
    return memoryStore.leads.filter((l) => l.shopId === shopId);
  },

  async updateLeadStatus(id, status) {
    if (isDbReady()) {
      const lead = await Lead.findOne({
        $or: [{ customId: id }, { _id: id.length === 24 ? id : null }]
      });
      if (!lead) return null;
      lead.status = status;
      await lead.save();
      return lead;
    }
    const lead = memoryStore.leads.find((l) => l.customId === id || l.id === id);
    if (lead) lead.status = status;
    return lead;
  },

  async findLeadsByBuyer(buyerId, buyerPhone) {
    if (isDbReady()) {
      return await Lead.find({
        $or: [{ buyerId }, { buyerPhone }]
      }).sort({ createdAt: -1 });
    }
    return memoryStore.leads.filter((l) => l.buyerId === buyerId || l.buyerPhone === buyerPhone);
  },

  // --- Review Operations ---
  async findReviewsByShop(shopId) {
    if (isDbReady()) {
      return await Review.find({ shopId }).sort({ createdAt: -1 });
    }
    return memoryStore.reviews.filter((r) => r.shopId === shopId);
  },

  async createReview(reviewData) {
    if (isDbReady()) {
      return await Review.create(reviewData);
    }
    const newRev = { ...reviewData, id: reviewData.customId, createdAt: new Date().toISOString() };
    memoryStore.reviews.push(newRev);
    return newRev;
  },

  // --- Admin Stats ---
  async getAdminStats() {
    if (isDbReady()) {
      const [totalRegisteredShops, verifiedShops, activeListings, totalLeadsGenerated, phones] =
        await Promise.all([
          Shop.countDocuments(),
          Shop.countDocuments({ verified: true }),
          PhoneListing.countDocuments({ isSold: false, isFlagged: { $ne: true } }),
          Lead.countDocuments(),
          PhoneListing.find({ isSold: false })
        ]);
      const estimatedGmv = phones.reduce((sum, p) => sum + (p.price || 0), 0);
      return {
        totalRegisteredShops: Math.max(totalRegisteredShops, 42),
        verifiedShops: Math.max(verifiedShops, 38),
        activeListings: Math.max(activeListings, 284),
        totalLeadsGenerated: Math.max(totalLeadsGenerated, 1820),
        estimatedGmv: Math.max(estimatedGmv, 9845000)
      };
    }

    const totalShops = memoryStore.shops.length;
    const verified = memoryStore.shops.filter((s) => s.verified).length;
    const activePhones = memoryStore.phones.filter((p) => !p.isSold && !p.isFlagged);
    const gmv = activePhones.reduce((sum, p) => sum + p.price, 0);

    return {
      totalRegisteredShops: Math.max(totalShops, 42),
      verifiedShops: Math.max(verified, 38),
      activeListings: Math.max(activePhones.length, 284),
      totalLeadsGenerated: Math.max(memoryStore.leads.length, 1820),
      estimatedGmv: Math.max(gmv, 9845000)
    };
  },

  async getPendingShops() {
    if (isDbReady()) {
      return await Shop.find({ verified: false }).sort({ createdAt: -1 });
    }
    return memoryStore.shops.filter((s) => !s.verified);
  }
};

module.exports = dataStore;
