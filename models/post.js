const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName:  { type: String, required: true },
  sellerEmail: { type: String, required: true },
  sellerPhone: { type: String, default: '' },
  title:       { type: String, required: true },
  category:    { type: String, required: true },
  condition:   { type: String, default: 'usado' },
  price:       { type: Number, required: true },
  imageUrl:    { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);