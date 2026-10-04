const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    whatsapp: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    locality: {
      type: String,
      required: true,
      index: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    openHours: {
      type: String,
      default: '10:00 AM - 9:30 PM'
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'
    },
    googleMapsUrl: {
      type: String,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    lat: {
      type: Number,
      default: 26.8530
    },
    lng: {
      type: Number,
      default: 75.8050
    },
    activeListingsCount: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
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

module.exports = mongoose.model('Shop', shopSchema);
