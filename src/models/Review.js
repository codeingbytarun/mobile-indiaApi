const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      index: true
    },
    shopId: {
      type: String,
      required: true,
      index: true
    },
    buyerId: {
      type: String,
      default: 'usr_guest',
      index: true
    },
    buyerName: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true
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

module.exports = mongoose.model('Review', reviewSchema);
