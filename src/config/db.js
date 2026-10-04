const dns = require('dns');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// Resolve MongoDB Atlas SRV records on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback error if setting DNS servers is restricted
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  MongoDB Connection Warning: Could not connect to ${MONGODB_URI}`);
    console.warn(`👉 Error: ${error.message}`);
    console.warn(`💡 You can update MONGODB_URI in your .env file whenever your database is ready.`);
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
});

module.exports = {
  connectDB,
  isDbConnected: () => isConnected
};
