const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      index: true
    },
    phoneId: {
      type: String,
      required: true,
      index: true
    },
    shopId: {
      type: String,
      required: true,
      index: true
    },
    buyerId: {
      type: String,
      index: true
    },
    buyerName: {
      type: String,
      required: true
    },
    buyerPhone: {
      type: String,
      required: true
    },
    phoneModel: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'call'],
      default: 'whatsapp'
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Visited Store', 'Sold', 'Lost'],
      default: 'New',
      index: true
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

module.exports = mongoose.model('Lead', leadSchema);
