const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true
    },
    role: {
      type: String,
      enum: ['buyer', 'shopkeeper', 'admin'],
      default: 'buyer'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
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
