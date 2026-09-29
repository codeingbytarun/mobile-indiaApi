const mongoose = require('mongoose');

const phoneListingSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      index: true
    },
    brand: {
      type: String,
      required: true,
      enum: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Vivo', 'Realme', 'Google', 'Other'],
      index: true
    },
    model: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    ram: {
      type: String,
      default: '8GB'
    },
    storage: {
      type: String,
      required: true,
      enum: ['64GB', '128GB', '256GB', '512GB', '1TB'],
      index: true
    },
    color: {
      type: String,
      default: 'Standard'
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    mrp: {
      type: Number,
      required: true,
      min: 0
    },
    condition: {
      type: String,
      required: true,
      enum: ['Pristine', 'Like New', 'Good', 'Fair'],
      index: true
    },
    batteryHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: 90
    },
    billBoxAvailable: {
      type: Boolean,
      default: false,
      index: true
    },
    warranty: {
      type: String,
      default: 'Testing Warranty'
    },
    shopId: {
      type: String,
      required: true,
      index: true
    },
    shopName: {
      type: String,
      required: true
    },
    shopLocality: {
      type: String,
      required: true
    },
    shopCity: {
      type: String,
      required: true,
      index: true
    },
    shopPhone: {
      type: String,
      required: true
    },
    shopWhatsapp: {
      type: String,
      required: true
    },
    shopDistanceKm: {
      type: Number,
      default: 1.0
    },
    images: {
      type: [String],
      default: []
    },
    isSold: {
      type: Boolean,
      default: false,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flagReason: {
      type: String,
      default: ''
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    leadsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.customId;
        return ret;
      }
    }
  }
);

// Compound text index for search
phoneListingSchema.index({
  brand: 'text',
  model: 'text',
  color: 'text',
  shopName: 'text',
  shopLocality: 'text'
});

module.exports = mongoose.model('PhoneListing', phoneListingSchema);
