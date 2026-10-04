const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp', 'email'],
      default: 'email'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically deletes expired OTP sessions
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('OtpSession', otpSessionSchema);
