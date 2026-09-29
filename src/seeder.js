const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/env');
const User = require('./models/User');
const Shop = require('./models/Shop');
const PhoneListing = require('./models/PhoneListing');
const Review = require('./models/Review');
const Lead = require('./models/Lead');
const CartItem = require('./models/CartItem');
const { seedUsers, seedShops, seedPhones, seedReviews, seedLeads } = require('./utils/seedData');

const seedDatabase = async () => {
  try {
    console.log(`📡 Connecting to MongoDB for seeding at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      PhoneListing.deleteMany({}),
      Review.deleteMany({}),
      Lead.deleteMany({}),
      CartItem.deleteMany({})
    ]);

    console.log('🌱 Seeding Users...');
    const createdUsers = await User.insertMany(seedUsers);
    console.log(`   + Seeded ${createdUsers.length} users.`);

    console.log('🌱 Seeding Shops...');
    const createdShops = await Shop.insertMany(seedShops);
    console.log(`   + Seeded ${createdShops.length} shops.`);

    console.log('🌱 Seeding Phone Listings...');
    const createdPhones = await PhoneListing.insertMany(seedPhones);
    console.log(`   + Seeded ${createdPhones.length} phones.`);

    console.log('🌱 Seeding Reviews...');
    const createdReviews = await Review.insertMany(seedReviews);
    console.log(`   + Seeded ${createdReviews.length} reviews.`);

    console.log('🌱 Seeding Leads...');
    const createdLeads = await Lead.insertMany(seedLeads);
    console.log(`   + Seeded ${createdLeads.length} leads.`);

    console.log('\n🎉 ==============================================');
    console.log('🎉 MobiMarket Database Seeding Completed!');
    console.log('🎉 Demo Shopkeeper Phone: 9829012345 (Sharma Telecom)');
    console.log('🎉 Demo Buyer Phone:      9829099887 (Tarun Baliyan)');
    console.log('🎉 Demo Admin Phone:      9999999999');
    console.log('🎉 Dev Test OTP:          482910');
    console.log('🎉 ==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
