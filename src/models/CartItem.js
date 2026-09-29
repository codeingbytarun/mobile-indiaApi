const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    buyerId: {
      type: String,
      required: true,
      index: true
    },
    phoneId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

cartItemSchema.index({ buyerId: 1, phoneId: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
