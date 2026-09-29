const app = require('./app');
const { connectDB, isDbConnected } = require('./config/db');
const { PORT, BASE_URL } = require('./config/env');
const Shop = require('./models/Shop');
const User = require('./models/User');
const PhoneListing = require('./models/PhoneListing');
const Review = require('./models/Review');
const Lead = require('./models/Lead');
const { seedUsers, seedShops, seedPhones, seedReviews, seedLeads } = require('./utils/seedData');

const autoSeedIfEmpty = async () => {
  try {
    if (!isDbConnected()) return;

    const shopCount = await Shop.countDocuments();
    if (shopCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial MobiMarket records...');
      await Promise.all([
        User.insertMany(seedUsers),
        Shop.insertMany(seedShops),
        PhoneListing.insertMany(seedPhones),
        Review.insertMany(seedReviews),
        Lead.insertMany(seedLeads)
      ]);
      console.log('✅ Initial database auto-seeding completed!');
    }
  } catch (err) {
    console.warn('Auto-seed check failed:', err.message);
  }
};

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Seed if connected and empty
  await autoSeedIfEmpty();

  const server = app.listen(PORT, () => {
    console.log('\n========================================================');
    console.log(`🚀 MobiMarket API Backend running at: ${BASE_URL}`);
    console.log(`📡 Base API URL:                      ${BASE_URL}/api/v1`);
    console.log(`🩺 Health Check:                      ${BASE_URL}/api/v1/health`);
    console.log(`📚 Master API Catalog:                ${BASE_URL}/api/v1`);
    console.log('========================================================\n');
  });

  const shutdown = () => {
    console.log('Gracefully stopping server...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
