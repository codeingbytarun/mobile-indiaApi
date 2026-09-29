const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['buyer', 'shopkeeper', 'admin'],
      default: 'buyer'
    },
    isPhoneVerified: {
      type: Boolean,
      default: true
    },
    shopId: {
      type: String,
      default: null
    },
    password: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('User', userSchema);
